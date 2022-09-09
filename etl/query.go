package main

import (
	"context"
	"errors"
	"fmt"
	"time"

	"cloud.google.com/go/firestore"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func queryFirstAndLastETLRun(ctx context.Context, client *firestore.Client) (string, string, error) {
	doc := client.Doc(LASTUPDATED_DOC_PATH)
	docSnap, err := doc.Get(ctx)
	if err != nil {
		return "", "", err
	}

	dates, err := docSnap.DataAtPath([]string{"dates"})
	if err != nil {
		return "", "", err
	}

	if dates == nil {
		return "", "", errors.New("last updated dates not found.")
	}

	d, ok := dates.([]interface{})
	if !ok {
		return "", "", fmt.Errorf("last updated dates unexpected type.")
	}

	return d[0].(string), d[len(d)-1].(string), nil
}

func queryChannelExistsById(ctx context.Context, client *firestore.Client, channelId string) (bool, error) {
	_, err := client.Collection("channels").Doc(channelId).Get(ctx)
	if err != nil {
		if status.Code(err) == codes.NotFound {
			return false, nil
		}

		return false, err
	}

	return true, nil
}

func queryChannelLastUpdatedById(ctx context.Context, client *firestore.Client, channelId string) (*time.Time, error) {
	csnap, err := client.Collection("channels").Doc(channelId).Get(ctx)
	if err != nil {
		if status.Code(err) == codes.NotFound {
			return nil, nil
		}

		return nil, err
	}

	var channel Channel
	if err := csnap.DataTo(&channel); err != nil {
		return nil, err
	}

	lastUpdated, err := time.Parse(time.RFC3339, channel.LastUpdated)
	return &lastUpdated, err
}

func queryVideosByChannelId(ctx context.Context, client *firestore.Client) (map[*Channel]map[string]*Video, error) {
	channelDocs, err := client.Collection("channels").Documents(ctx).GetAll()
	if err != nil {
		return nil, err
	}

	channelToVideos := make(map[*Channel]map[string]*Video)
	for _, cdoc := range channelDocs {
		var c Channel
		if err := cdoc.DataTo(&c); err != nil {
			return nil, err
		}

		videoDocs, err := client.Collection(c.Id).Documents(ctx).GetAll()
		if err != nil {
			return nil, err
		}

		m := make(map[string]*Video)
		for _, vdoc := range videoDocs {
			var v Video
			if err := vdoc.DataTo(&v); err != nil {
				return nil, err
			}
			m[v.Id] = &v
		}

		channelToVideos[&c] = m
	}

	return channelToVideos, nil
}

func queryVideoAndLinkCount(ctx context.Context, client *firestore.Client, channelId string) (int, int, error) {
	cdoc, err := client.Collection("channels").Doc(channelId).Get(ctx)
	if err != nil {
		// channel doesn't exist yet, start at 0.
		if status.Code(err) == codes.NotFound {
			return 0, 0, nil
		}

		return -1, -1, err
	}

	var c Channel
	if err := cdoc.DataTo(&c); err != nil {
		return -1, -1, err
	}

	return c.VideoCount, c.LinkCount, nil
}

func queryVideoAndLinkCountFromFirestore(ctx context.Context, client *firestore.Client, channelId string) (int, int, error) {
	vrefs, err := client.Collection(channelId).DocumentRefs(ctx).GetAll()
	if err != nil {
		return -1, -1, err
	}

	linkCount := 0
	for _, vref := range vrefs {
		lrefs, err := vref.Collection("links").DocumentRefs(ctx).GetAll()
		if err != nil {
			return -1, -1, err
		}

		linkCount += len(lrefs)
	}

	return len(vrefs), linkCount, nil
}
