package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
)

const (
	CHANNEL_USERNAME = "clothesencounters"
	CHANNEL_TITLE    = "Jenn Im"
	CHANNEL_ID       = "UCgWfS_47YPVbKx5EK4FLm4A"

	YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3"
)

func main() {
	if err := run(); err != nil {
		log.Fatal(err)
	}
}

func run() error {
	var (
		apiKey string
	)

	flag.StringVar(&apiKey, "key", "", "API Key to use for Youtube API.")
	flag.Parse()

	if apiKey == "" {
		return fmt.Errorf("Missing API Key")
	}

	httpClient := http.DefaultClient
	playlistId, err := getUploadPlaylist(httpClient, CHANNEL_USERNAME, apiKey)
	if err != nil {
		return err
	}

	snippets, err := getVideoSnippets(httpClient, playlistId, apiKey)
	if err != nil {
		return err
	}

	links, err := snippetsToLinks(snippets)
	if err != nil {
		return err
	}

	return createRecord(CHANNEL_ID, links)
}
