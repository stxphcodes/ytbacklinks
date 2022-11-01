package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"time"

	"cloud.google.com/go/firestore"
	"google.golang.org/api/option"
)

type Config struct {
	YoutubeApiKey string
	Firestore     struct {
		Creds     string
		ProjectId string
	}
	ChannelsPath string
}

type ChannelInput struct {
	Title      string   `json:"title"`
	Categories []string `json:"categories"`
}

func main() {
	if err := run(); err != nil {
		log.Fatal(err)
	}
}

func run() error {
	var (
		cfg        Config
		dryRun     bool
		renewLinks bool
	)

	flag.StringVar(&cfg.YoutubeApiKey, "youtube.key", "", "API Key to use for Youtube API.")
	flag.StringVar(&cfg.Firestore.Creds, "firestore.creds", "", "Path to service account for firestore.")
	flag.StringVar(&cfg.Firestore.ProjectId, "firestore.projectid", "", "Firestore project id.")
	flag.StringVar(&cfg.ChannelsPath, "channels.path", "", "Path to JSON file containing channel titles.")
	flag.BoolVar(&dryRun, "dry.run", true, "Dry run - does not upload data to database.")
	flag.BoolVar(&renewLinks, "renew.links", false, "Renew existing links in database without fetching for new channels, videos or links.")

	flag.Parse()

	switch "" {
	case cfg.YoutubeApiKey:
		return fmt.Errorf("Missing API key.")

	case cfg.Firestore.Creds:
		return fmt.Errorf("Missing firestore creds path.")

	case cfg.Firestore.ProjectId:
		return fmt.Errorf("Missing firestore project id.")

	case cfg.ChannelsPath:
		return fmt.Errorf("Missing path to channels json file.")
	}

	// Connect to firestore database.
	ctx := context.Background()

	firestoreClient, err := firestore.NewClient(
		ctx,
		cfg.Firestore.ProjectId,
		option.WithCredentialsFile(cfg.Firestore.Creds))
	if err != nil {
		return err
	}
	defer firestoreClient.Close()

	// Connect to youtube via regular http client.
	httpClient := http.DefaultClient

	// Only update existing links.
	if renewLinks {
		return updateLinks(ctx, firestoreClient, dryRun)
	}

	// Otherwise run full ETL process to fetch new videos and links
	// since the last ETL and update channel, videos and links.
	channels, err := getChannels(&cfg)
	if err != nil {
		return err
	}

	return runETL(ctx, firestoreClient, httpClient, cfg.YoutubeApiKey, channels, dryRun)
}

func updateLinks(ctx context.Context, firestoreClient *firestore.Client, dryRun bool) error {
	channelsToVideos, err := queryVideosByChannelId(ctx, firestoreClient)
	if err != nil {
		return err
	}

	for channel, videos := range channelsToVideos {
		links, err := videosToLinksByVideoId(videos)
		if err != nil {
			return err
		}

		log.Println("Only renewing links.")
		log.Println("Channel: ", channel.Title)
		log.Println("Number of videos: ", len(videos))
		log.Println("Number of links: ", getNumberOfLinks(links))

		if dryRun {
			log.Print("Skip uploading data.\n\n")
			continue
		}

		if err := loadLinksByChannelAndVideoIds(ctx, firestoreClient, channel.Id, links); err != nil {
			return err
		}

		log.Print("Successfully updated database.\n\n")
	}

	return nil
}

func getChannels(cfg *Config) ([]ChannelInput, error) {
	f, err := os.Open(cfg.ChannelsPath)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	bytes, err := ioutil.ReadAll(f)
	if err != nil {
		return nil, err
	}

	var c []ChannelInput
	if err := json.Unmarshal(bytes, &c); err != nil {
		return nil, err
	}

	return c, nil
}

func getNumberOfLinks(linksByVideo map[string]map[string]*Link) int {
	total := 0
	for _, mlinks := range linksByVideo {
		total += len(mlinks)
	}

	return total
}

func runETL(ctx context.Context, firestoreClient *firestore.Client, httpClient *http.Client, youtubeApiKey string, channels []ChannelInput, dryRun bool) error {
	currentDate := time.Now()
	eightMonthsAgo := currentDate.AddDate(0, -10, 0)

	for _, channelInput := range channels {
		log.Println("Running ETL for: ", channelInput.Title)
		// extract channel data from youtube.
		channelResponse, err := extractChannel(httpClient, youtubeApiKey, channelInput.Title)
		if err != nil {
			return err
		}
		channel := channelResponse.toChannel(channelInput.Categories)

		// check when channel was last updated in firestore.
		lastUpdated, err := queryChannelLastUpdatedById(ctx, firestoreClient, channel.Id)
		if err != nil {
			return err
		}

		extractVideosDate := ""
		// new channel - extract videos starting from eight months ago.
		if lastUpdated == nil {
			log.Println("New channel detected.")
			extractVideosDate = eightMonthsAgo.Format(time.RFC3339)
		} else {
			// update if it's been more than 7 days since channel was updated.
			if lastUpdated.AddDate(0, 0, 7).Before(currentDate) {
				extractVideosDate = lastUpdated.Format(time.RFC3339)
			}
		}

		if extractVideosDate == "" {
			log.Printf("Skipped updating %s since it's been updated in the past week. \n\n", channelInput.Title)
			continue
		}

		log.Println("Gathering video data starting from ", extractVideosDate)
		videoResponse, err := extractVideosByDate(httpClient, youtubeApiKey, channel.Id, extractVideosDate)
		if err != nil {
			return err
		}
		videos := videoResponse.toVideos()

		links, err := videosToLinksByVideoId(videos)
		if err != nil {
			return err
		}

		// Update channel video and link counts.
		channel.VideoCount, channel.LinkCount, err = queryVideoAndLinkCount(
			ctx,
			firestoreClient,
			channel.Id,
		)
		if err != nil {
			return err
		}
		channel.VideoCount += len(videos)
		channel.LinkCount += getNumberOfLinks(links)

		log.Println("Number of new videos: ", len(videos))
		log.Println("Number of new links: ", getNumberOfLinks(links))

		if dryRun {
			log.Print("Skip uploading data.\n\n")
			continue
		}

		if len(videos) == 0 || getNumberOfLinks(links) == 0 {
			log.Print("No new videos or links to upload.\n\n")
			continue
		}

		if err := loadVideosbyChannelId(ctx, firestoreClient, channel.Id, videos); err != nil {
			return err
		}
		log.Println("Loaded video data.")

		if err := loadLinksByChannelAndVideoIds(ctx, firestoreClient, channel.Id, links); err != nil {
			return err
		}
		log.Println("Loaded link data.")

		if err := loadChannel(ctx, firestoreClient, channel); err != nil {
			return err
		}
		log.Println("Loaded channel data.")

		log.Print("Successfully updated database.\n\n")

	}

	if !dryRun {
		log.Println("Updating etl metadata.")
		return updateLastUpdated(ctx, firestoreClient)
	}

	return nil
}
