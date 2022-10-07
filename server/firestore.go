package main

import (
	"context"
	"time"

	"cloud.google.com/go/firestore"
)

func getFSLinkCount(ctx context.Context, fs *firestore.Client) (int, error) {
	docs, err := fs.CollectionGroup("links").
		OrderBy("PublishedAt", firestore.Desc).
		Documents(ctx).
		GetAll()
	if err != nil {
		return -1, err
	}

	return len(docs), nil
}

func extractLinksFromFirestore(ctx context.Context, fs *firestore.Client) ([]interface{}, error) {
	docs, err := fs.CollectionGroup("links").
		OrderBy("PublishedAt", firestore.Desc).
		Documents(ctx).
		GetAll()
	if err != nil {
		return nil, err
	}

	var links []interface{}
	for _, doc := range docs {
		var link Link
		if err := doc.DataTo(&link); err != nil {
			return nil, err
		}

		t, err := time.Parse(time.RFC3339, link.PublishedAt)
		if err != nil {
			return nil, err
		}
		link.PublishedAtInt = t.Unix()

		links = append(links, &link)
	}

	return links, nil
}

func extractVideosFromFirestore(ctx context.Context, fs *firestore.Client) ([]interface{}, error) {
	channelRefs, err := fs.Collection("channels").DocumentRefs(ctx).GetAll()
	if err != nil {
		return nil, err
	}

	var videos []interface{}
	for _, cref := range channelRefs {
		videoRefs, err := fs.Collection(cref.ID).Documents(ctx).GetAll()
		if err != nil {
			return nil, err
		}

		for _, vref := range videoRefs {
			var video Video
			if err := vref.DataTo(&video); err != nil {
				return nil, err
			}

			t, err := time.Parse(time.RFC3339, video.PublishedAt)
			if err != nil {
				return nil, err
			}

			video.PublishedAtInt = t.Unix()
			videos = append(videos, video)
		}
	}

	return videos, nil
}

func extractChannelsFromFirestore(ctx context.Context, fs *firestore.Client) ([]interface{}, error) {
	channelRefs, err := fs.Collection("channels").Documents(ctx).GetAll()
	if err != nil {
		return nil, err
	}

	var channels []interface{}
	for _, cref := range channelRefs {
		var channel Channel
		if err := cref.DataTo(&channel); err != nil {
			return nil, err
		}

		t, err := time.Parse(time.RFC3339, channel.LastUpdated)
		if err != nil {
			return nil, err
		}

		channel.LastUpdatedInt = t.Unix()
		channel.VideoCountInt = int64(channel.VideoCount)
		channel.LinkCountInt = int64(channel.LinkCount)

		channels = append(channels, channel)
	}

	return channels, nil
}
