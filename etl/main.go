package main

import (
	"context"
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"strings"

	firebase "firebase.google.com/go"
	"firebase.google.com/go/db"
	"google.golang.org/api/option"
)

type Config struct {
	YoutubeApiKey string
	Firebase      struct {
		Creds string
		Url   string
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
	flag.StringVar(&cfg.Firebase.Creds, "firebase.creds", "", "Path to service account for firebase.")
	flag.StringVar(&cfg.Firebase.Url, "firebase.url", "", "Firebase database url.")
	flag.StringVar(&cfg.ChannelTitles, "channel.titles", "", "List of channel titles (separated by ,) to include in ETL.")
	flag.StringVar(&cfg.ChannelsInput, "channels.input", "", "Path to file containing channel titles.")
	flag.BoolVar(&dryRun, "dry.run", true, "Dry run - does not upload data to database.")
	flag.BoolVar(&renewLinks, "renew.links", false, "Renew existing links in database without fetching for new channels, videos or links.")

	flag.Parse()

	switch "" {
	case cfg.YoutubeApiKey:
		return fmt.Errorf("Missing API key.")

	case cfg.Firebase.Creds:
		return fmt.Errorf("Missing firebase creds path.")

	case cfg.Firebase.Url:
		return fmt.Errorf("Missing firebase database url.")
	}

	// Connect to firebase database.
	ctx := context.Background()
	conf := &firebase.Config{
		DatabaseURL: cfg.Firebase.Url,
	}
	opt := option.WithCredentialsFile(cfg.Firebase.Creds)

	app, err := firebase.NewApp(ctx, conf, opt)
	if err != nil {
		return err
	}

	firebaseClient, err := app.Database(ctx)
	if err != nil {
		return err
	}

	// Connect to youtube via regular http client.
	httpClient := http.DefaultClient

	// Only update existing links.
	if renewLinks {
		return updateLinks(ctx, firebaseClient, dryRun)
	}

	// Otherwise run full ETL process to fetch new videos and links
	// since the last ETL and update channel, videos and links.
	channels, err := getChannels(&cfg)
	if err != nil {
		return err
	}

	return runETL(ctx, firebaseClient, httpClient, cfg.YoutubeApiKey, channels, dryRun)

}

func updateLinks(ctx context.Context, firebaseClient *db.Client, dryRun bool) error {
	channelsToVideos, err := queryVideosByChannelId(ctx, firebaseClient)
	if err != nil {
		return err
	}

	for channelId, videos := range channelsToVideos {
		links, err := videosToLinksByVideoId(videos)
		if err != nil {
			return err
		}

		channelTitle, err := queryChannelTitleById(ctx, firebaseClient, channelId)
		if err != nil {
			log.Println("Couldn't get channel title")
			channelTitle = channelId
		}

		log.Println("Channel: ", channelTitle)
		log.Println("Number of videos: ", len(videos))
		log.Println("Number of links: ", getNumberOfLinks(links))

		if dryRun {
			log.Println("Skip uploading data.\n")
			continue
		}

		if err := loadLinksByChannelAndVideoIds(ctx, firebaseClient, channelId, links); err != nil {
			return err
		}

		log.Println("Successfully updated database.\n")
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

func runETL(ctx context.Context, firebaseClient *db.Client, httpClient *http.Client, youtubeApiKey string, channels []string, dryRun bool) error {
	lastUpdated, err := queryLastUpdated(ctx, firebaseClient)
	if err != nil {
		return err
	}

	log.Println("This is last update date: %s", lastUpdated)

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

		log.Println("Channel: ", channelTitle)
		log.Println("Number of videos: ", len(videos))
		log.Println("Number of links: ", getNumberOfLinks(links))

		if dryRun {
			log.Println("Skip uploading data.\n")
			continue
		} else {
			if err := loadChannel(ctx, firebaseClient, channel); err != nil {
				return err
			}

			if err := loadVideosbyChannelId(ctx, firebaseClient, channel.Id, videos); err != nil {
				return err
			}

			if err := loadLinksByChannelAndVideoIds(ctx, firebaseClient, channel.Id, links); err != nil {
				return err
			}

			log.Println("Successfully updated database.\n")
		}
	}

	return updateLastUpdated(ctx, firebaseClient)
}
