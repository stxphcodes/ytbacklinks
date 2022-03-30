package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"
)

const DATA_DIRECTORY = "../data"

type Record struct {
	ChannelUsername string
	ChannelId       string
	ChannelTitle    string

	LastUpdated time.Time
	Links       []*Link
}

func createRecord(channelId string, links []*Link) error {
	f, err := os.Create(filepath.Join(DATA_DIRECTORY, fmt.Sprintf("%s.json", channelId)))
	if err != nil {
		return err
	}
	defer f.Close()

	r := &Record{
		ChannelUsername: CHANNEL_USERNAME,
		ChannelTitle:    CHANNEL_TITLE,
		ChannelId:       CHANNEL_ID,
		LastUpdated:     time.Now(),
		Links:           links,
	}

	encoder := json.NewEncoder(f)
	encoder.SetIndent("", "    ")
	if err := encoder.Encode(r); err != nil {
		return err
	}

	return nil
}
