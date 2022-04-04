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

var (
	CHANNEL_TITLES = []string{"Jenn Im"}
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

	lastUpdated, err := queryLastUpdated(firebaseClient, ctx)
	if err != nil {
		return err
	}

	fmt.Println("this is last updated")
	fmt.Println(lastUpdated)

	// Connect to youtube via regular http client.
	httpClient := http.DefaultClient

	videos, err := extractVideosByLastUpdated(httpClient, apiKey, lastUpdated)
	if err != nil {
		return err
	}

	fmt.Println(videos)
	return nil

	// playlistId, err := getUploadPlaylist(httpClient, channelId, apiKey)
	// if err != nil {
	// 	return err
	// }

	// snippets, err := getVideoSnippets(httpClient, playlistId, apiKey)
	// if err != nil {
	// 	return err
	// }

	// links, err := snippetsToLinks(snippets)
	// if err != nil {
	// 	return err
	// }

	// return createRecord(CHANNEL_ID, links)
}
