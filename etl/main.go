package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"net/http"

	firebase "firebase.google.com/go"
	"google.golang.org/api/option"
)

//"Jenn Im", "Freesia Park",
var (
	CHANNEL_TITLES = []string{"theneedledrop"}
)

func main() {
	if err := run(); err != nil {
		log.Fatal(err)
	}
}

func run() error {
	var (
		apiKey              string
		firebaseCredsPath   string
		firebaseDatabaseUrl string
	)

	flag.StringVar(&apiKey, "key", "", "API Key to use for Youtube API.")
	flag.StringVar(&firebaseCredsPath, "firebaseCreds", "", "Path to service account for firebase.")
	flag.StringVar(&firebaseDatabaseUrl, "firebaseDatabase", "", "Firebase database url.")

	flag.Parse()

	switch "" {
	case apiKey:
		return fmt.Errorf("Missing API key.")

	case firebaseCredsPath:
		return fmt.Errorf("Missing firebase creds path.")

	case firebaseDatabaseUrl:
		return fmt.Errorf("Missing firebase database url.")

	}

	// Connect to firebase database.
	ctx := context.Background()
	conf := &firebase.Config{
		DatabaseURL: firebaseDatabaseUrl,
	}
	opt := option.WithCredentialsFile(firebaseCredsPath)

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

	lastUpdated, err := queryLastUpdated(ctx, firebaseClient)
	if err != nil {
		return err
	}

	fmt.Println("this is last updated")
	fmt.Println(lastUpdated)

	for _, channelTitle := range CHANNEL_TITLES {
		channelResponse, err := extractChannel(httpClient, apiKey, channelTitle)
		if err != nil {
			return err
		}
		channel := channelResponse.toChannel()

		videoResponse, err := extractVideosByLastUpdated(httpClient, apiKey, channel.Id, lastUpdated)
		if err != nil {
			return err
		}
		videos := videoResponse.toVideos()

		links, err := videosToLinksByVideoId(videos)
		if err != nil {
			return err
		}

		if err := loadChannel(ctx, firebaseClient, channel); err != nil {
			return err
		}

		if err := loadVideosbyChannelId(ctx, firebaseClient, channel.Id, videos); err != nil {
			return err
		}

		if err := loadLinksByChannelAndVideoIds(ctx, firebaseClient, channel.Id, links); err != nil {
			return err
		}
	}

	return nil
}
