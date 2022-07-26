package main

import (
	"context"
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"strings"

	"cloud.google.com/go/firestore"
	"google.golang.org/api/option"
)

type Config struct {
	YoutubeApiKey string
	Firestore     struct {
		Creds     string
		ProjectId string
	}
	ChannelTitles string
	ChannelsInput string
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
	flag.StringVar(&cfg.ChannelTitles, "channel.titles", "", "List of channel titles (separated by ,) to include in ETL.")
	flag.StringVar(&cfg.ChannelsInput, "channels.input", "", "Path to file containing channel titles.")
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

func getChannels(cfg *Config) ([]string, error) {
	if cfg.ChannelTitles == "" && cfg.ChannelsInput == "" {
		return nil, fmt.Errorf("Missing channel titles or channels input file.")
	}

	if cfg.ChannelTitles != "" {
		return strings.Split(cfg.ChannelTitles, ","), nil
	}

	f, err := ioutil.ReadFile(cfg.ChannelsInput)
	if err != nil {
		return nil, err
	}

	return strings.Split(string(f), ","), nil
}

func getNumberOfLinks(linksByVideo map[string]map[string]*Link) int {
	total := 0
	for _, mlinks := range linksByVideo {
		total += len(mlinks)
	}

	return total
}

func runETL(ctx context.Context, firestoreClient *firestore.Client, httpClient *http.Client, youtubeApiKey string, channels []string, dryRun bool) error {
	lastUpdated, err := queryLastUpdated(ctx, firestoreClient)
	if err != nil {
		return err
	}

	log.Printf("This is last update date: %s", lastUpdated)

	for _, channelTitle := range channels {
		channelResponse, err := extractChannel(httpClient, youtubeApiKey, channelTitle)
		if err != nil {
			return err
		}
		channel := channelResponse.toChannel()

		videoResponse, err := extractVideosByLastUpdated(httpClient, youtubeApiKey, channel.Id, lastUpdated)
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

		log.Println("Channel: ", channelTitle)
		log.Println("Number of new videos: ", len(videos))
		log.Println("Number of new links: ", getNumberOfLinks(links))

		if dryRun {
			log.Print("Skip uploading data.\n\n")
			continue
		} else {
			if err := loadChannel(ctx, firestoreClient, channel); err != nil {
				return err
			}

			if err := loadVideosbyChannelId(ctx, firestoreClient, channel.Id, videos); err != nil {
				return err
			}

			if err := loadLinksByChannelAndVideoIds(ctx, firestoreClient, channel.Id, links); err != nil {
				return err
			}

			log.Print("Successfully updated database.\n\n")
		}
	}

	return updateLastUpdated(ctx, firestoreClient)
}
