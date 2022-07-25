package main

import (
	"context"
	"fmt"
	"time"

	"cloud.google.com/go/firestore"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

const (
	LASTUPDATED_DOC_PATH = "etl-metadata/last-updated"
	CHANNELS_COLLECTION  = "channels"

	LINKS_REF                    = "/links"
	LINKS_BY_CHANNELS_REF        = "/linksByChannels"
	LINKS_BY_CHANNELS_VIDEOS_REF = "/linksByChannelsAndVideos"
	VIDEOS_REF                   = "/videos"
	CHANNELS_REF                 = "/channels"
	VIDEOS_BY_CHANNELS_REF       = "/videosByChannels"
	LAST_UPDATED_REF             = "/lastUpdated"
)

func loadChannel(ctx context.Context, client *firestore.Client, c *Channel) error {
	cref := client.Collection(CHANNELS_COLLECTION)
	_, err := cref.Doc(c.Id).Set(ctx, &c)
	return err
}

func loadVideosbyChannelId(ctx context.Context, client *firestore.Client, channelId string, videos map[string]*Video) error {
	cref := client.Collection(channelId)
	batch := client.Batch()

	for videoId, video := range videos {
		docRef := cref.Doc(videoId)
		// check if video exists
		snap, err := docRef.Get(ctx)
		if err != nil {
			if status.Code(err) != codes.NotFound {
				return err
			}
		}

		if snap.Exists() {
			continue
		}

		// doc doesn't exist yet, create
		batch.Set(docRef, &video)
	}

	_, err := batch.Commit(ctx)

	return err
}

func loadLinksByChannelAndVideoIds(ctx context.Context, client *firestore.Client, channelId string, videoLinks map[string]map[string]*Link) error {
	for videoId, links := range videoLinks {
		cref := client.Collection(fmt.Sprintf("%s/%s/links", channelId, videoId))
		batch := client.Batch()

		for linkId, link := range links {
			batch.Set(cref.Doc(linkId), link)
		}

		// Upload in bulk. This will overwrite what's existing in ref.
		if _, err := batch.Commit(ctx); err != nil {
			return err
		}
	}

	return nil
}

func updateLastUpdated(ctx context.Context, client *firestore.Client) error {
	doc := client.Doc(LASTUPDATED_DOC_PATH)

	_, err := doc.Update(ctx, []firestore.Update{
		{Path: "dates", Value: firestore.ArrayUnion(time.Now().Format(time.RFC3339))},
	})

	return err

	// ref := client.NewRef(LAST_UPDATED_REF)

	// var dates []string
	// if err := ref.Get(ctx, &dates); err != nil {
	// 	return err
	// }

	// dates = append(dates, time.Now().Format(time.RFC3339))

	// return ref.Set(ctx, dates)
}

// unused.

// func loadLinks(ctx context.Context, client *db.Client, links map[string]*Link) error {
//  ref := client.NewRef(LINKS_REF)

//  // Get video ids from database.
//  var linkIds map[string]interface{}
//  if err := ref.GetShallow(ctx, &linkIds); err != nil {
//      return err
//  }

//  // No videos exist yet. Upload in bulk.
//  if len(linkIds) == 0 {
//      if err := ref.Set(ctx, links); err != nil {
//          return err
//      }
//  }

//  // Only upload videos that don't already exist.
//  linksToUpload := make(map[string]interface{})
//  for id, link := range links {
//      _, ok := linkIds[id]
//      if !ok {
//          linksToUpload[id] = link
//      }
//  }

//  if len(linksToUpload) == 0 {
//      return nil
//  }

//  // Upload new links.
//  newRef := ref.Parent()
//  childRef := newRef.Child("links")
//  return childRef.Update(ctx, linksToUpload)
// }

// func deduplicateLinks(videoLinks map[string]map[string]*Link) map[string]*Link {
//  l := make(map[string]*Link)

//  for videoId, links := range videoLinks {
//      for linkId, link := range links {
//          _, ok := l[linkId]
//          if !ok {
//              l[linkId] = link
//              continue
//          }

//          l[linkId].OtherVideoIds = append(l[linkId].OtherVideoIds, videoId)
//      }
//  }

//  return l
// }

// func loadLinksByChannelIds(ctx context.Context, client *db.Client, channelId string, videoLinks map[string]map[string]*Link) error {
//  ref := client.NewRef(fmt.Sprintf("%s/%s", LINKS_BY_CHANNELS_REF, channelId))
//  // Get ids from database.
//  var linkIds map[string]interface{}
//  if err := ref.GetShallow(ctx, &linkIds); err != nil {
//      return err
//  }

//  deduplicatedLinks := deduplicateLinks(videoLinks)

//  // Upload in bulk.
//  if err := ref.Set(ctx, deduplicatedLinks); err != nil {
//      return err
//  }

//  return nil
// }

// func loadVideos(ctx context.Context, client *db.Client, videos map[string]*Video) error {
//  ref := client.NewRef(VIDEOS_REF)

//  // Get video ids from database.
//  var videoIds map[string]interface{}
//  if err := ref.GetShallow(ctx, &videoIds); err != nil {
//      return err
//  }

//  if len(videoIds) == 0 {
//      // No videos exist yet. Upload in bulk.
//      if err := ref.Set(ctx, videos); err != nil {
//          return err
//      }
//  }

//  // Only upload videos that don't already exist.
//  videosToUpload := make(map[string]interface{})
//  for id, video := range videos {
//      _, ok := videoIds[id]
//      if !ok {
//          videosToUpload[id] = video
//      }
//  }

//  if len(videosToUpload) == 0 {
//      return nil
//  }

//  // Upload new videos.
//  newRef := ref.Parent()
//  childRef := newRef.Child(VIDEOS_REF)
//  return childRef.Update(ctx, videosToUpload)
// }
