package main

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"firebase.google.com/go/db"
)

func loadChannel(ctx context.Context, client *db.Client, c *Channel) error {
	ref := client.NewRef(fmt.Sprintf("/channels/%s", c.Id))
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

func loadVideos(ctx context.Context, client *db.Client, videos map[string]*Video) error {
	ref := client.NewRef("/videos")

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
	childRef := newRef.Child("videos")
	return childRef.Update(ctx, videosToUpload)
}

func loadLinks(ctx context.Context, client *db.Client, links map[string]*Link) error {
	ref := client.NewRef("/links")

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
