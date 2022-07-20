package main

import (
	"context"
	"fmt"

	"firebase.google.com/go/db"
)

func queryLastUpdated(ctx context.Context, client *db.Client) (string, error) {
	ref := client.NewRef(LAST_UPDATED_REF)

	// get last element of array
	query := ref.OrderByKey().LimitToLast(1)

	// query returns map[array last #]lastDate
	// and map has length of 1
	var m map[int]string
	if err := query.Get(ctx, &m); err != nil {
		return "", err
	}

	var date string
	for _, value := range m {
		date = value
	}

	return date, nil
}

func queryVideosByChannelId(ctx context.Context, client *db.Client) (map[string]map[string]*Video, error) {
	ref := client.NewRef(VIDEOS_BY_CHANNELS_REF)

	var channelToVideos map[string]map[string]*Video
	if err := ref.Get(ctx, &channelToVideos); err != nil {
		return nil, err
	}

	return channelToVideos, nil
}

func queryChannelTitleById(ctx context.Context, client *db.Client, id string) (string, error) {
	ref := client.NewRef(fmt.Sprintf("%s/%s", CHANNELS_REF, id))

	var channel Channel
	if err := ref.Get(ctx, &channel); err != nil {
		return "", err
	}

	return channel.Title, nil
}
