package main

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"firebase.google.com/go/db"
)

const (
	LINKS_REF                    = "/links"
	LINKS_BY_CHANNELS_REF        = "/linksByChannels"
	LINKS_BY_CHANNELS_VIDEOS_REF = "/linksByChannelsAndVideos"
	VIDEOS_REF                   = "/videos"
	CHANNELS_REF                 = "/channels"
	VIDEOS_BY_CHANNELS_REF       = "/videosByChannels"
)

func loadChannel(ctx context.Context, client *db.Client, c *Channel) error {
	ref := client.NewRef(fmt.Sprintf("%s/%s", CHANNELS_REF, c.Id))
	if err := ref.Transaction(ctx, func(t db.TransactionNode) (interface{}, error) {
		var current Channel
		if err := t.Unmarshal(&current); err != nil {
			return nil, err
		}

		if current.Id != "" {
			return nil, errors.New("channel already exists")
		}

		return &c, nil
	}); err != nil {
		if !strings.Contains(err.Error(), "exists") {
			return err
		}
	}

	return nil
}

func loadVideosbyChannelId(ctx context.Context, client *db.Client, channelId string, videos map[string]*Video) error {
	ref := client.NewRef(fmt.Sprintf("%s/%s", VIDEOS_BY_CHANNELS_REF, channelId))

	// Get video ids from database.
	var videoIds map[string]interface{}
	if err := ref.GetShallow(ctx, &videoIds); err != nil {
		return err
	}

	if len(videoIds) == 0 {
		// No videos exist yet. Upload in bulk.
		if err := ref.Set(ctx, videos); err != nil {
			return err
		}
	}

	// Only upload videos that don't already exist.
	videosToUpload := make(map[string]interface{})
	for id, video := range videos {
		_, ok := videoIds[id]
		if !ok {
			videosToUpload[id] = video
		}
	}

	if len(videosToUpload) == 0 {
		return nil
	}

	// Upload new videos.
	newRef := ref.Parent()
	childRef := newRef.Child(fmt.Sprintf("%s", channelId))
	return childRef.Update(ctx, videosToUpload)
}

func loadVideos(ctx context.Context, client *db.Client, videos map[string]*Video) error {
	ref := client.NewRef(VIDEOS_REF)

	// Get video ids from database.
	var videoIds map[string]interface{}
	if err := ref.GetShallow(ctx, &videoIds); err != nil {
		return err
	}

	if len(videoIds) == 0 {
		// No videos exist yet. Upload in bulk.
		if err := ref.Set(ctx, videos); err != nil {
			return err
		}
	}

	// Only upload videos that don't already exist.
	videosToUpload := make(map[string]interface{})
	for id, video := range videos {
		_, ok := videoIds[id]
		if !ok {
			videosToUpload[id] = video
		}
	}

	if len(videosToUpload) == 0 {
		return nil
	}

	// Upload new videos.
	newRef := ref.Parent()
	childRef := newRef.Child(VIDEOS_REF)
	return childRef.Update(ctx, videosToUpload)
}

func deduplicateLinks(videoLinks map[string]map[string]*Link) map[string]*Link {
	l := make(map[string]*Link)

	for videoId, links := range videoLinks {
		for linkId, link := range links {
			_, ok := l[linkId]
			if !ok {
				l[linkId] = link
				continue
			}

			l[linkId].OtherVideoIds = append(l[linkId].OtherVideoIds, videoId)
		}
	}

	return l
}

func loadLinksByChannelIds(ctx context.Context, client *db.Client, channelId string, videoLinks map[string]map[string]*Link) error {
	ref := client.NewRef(fmt.Sprintf("%s/%s", LINKS_BY_CHANNELS_REF, channelId))
	// Get ids from database.
	var linkIds map[string]interface{}
	if err := ref.GetShallow(ctx, &linkIds); err != nil {
		return err
	}

	deduplicatedLinks := deduplicateLinks(videoLinks)

	// Upload in bulk.
	if err := ref.Set(ctx, deduplicatedLinks); err != nil {
		return err
	}

	return nil
}

func loadLinksByChannelAndVideoIds(ctx context.Context, client *db.Client, channelId string, videoLinks map[string]map[string]*Link) error {
	for videoId, links := range videoLinks {
		ref := client.NewRef(fmt.Sprintf("%s/%s/%s", LINKS_BY_CHANNELS_VIDEOS_REF, channelId, videoId))

		// Get ids from database.
		var linkIds map[string]interface{}
		if err := ref.GetShallow(ctx, &linkIds); err != nil {
			return err
		}

		// Upload in bulk. This will overwrite what's existing in ref.
		if err := ref.Set(ctx, links); err != nil {
			return err
		}
	}

	return nil
}

func loadLinks(ctx context.Context, client *db.Client, links map[string]*Link) error {
	ref := client.NewRef(LINKS_REF)

	// Get video ids from database.
	var linkIds map[string]interface{}
	if err := ref.GetShallow(ctx, &linkIds); err != nil {
		return err
	}

	// No videos exist yet. Upload in bulk.
	if len(linkIds) == 0 {
		if err := ref.Set(ctx, links); err != nil {
			return err
		}
	}

	// Only upload videos that don't already exist.
	linksToUpload := make(map[string]interface{})
	for id, link := range links {
		_, ok := linkIds[id]
		if !ok {
			linksToUpload[id] = link
		}
	}

	if len(linksToUpload) == 0 {
		return nil
	}

	// Upload new links.
	newRef := ref.Parent()
	childRef := newRef.Child("links")
	return childRef.Update(ctx, linksToUpload)
}
