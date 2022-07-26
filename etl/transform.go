package main

import (
	"time"
)

type Channel struct {
	Id               string
	Title            string
	Description      string
	CustomUrl        string
	UploadPlaylistId string
	ThumbnailUrl     string
	LastUpdated      string
	VideoCount       int
	LinkCount        int
}

func (r *ChannelResponse) toChannel() *Channel {
	c := &Channel{
		Id:               r.Items[0].Id,
		Title:            r.Items[0].Snippet.Title,
		Description:      r.Items[0].Snippet.Description,
		CustomUrl:        r.Items[0].Snippet.CustomUrl,
		ThumbnailUrl:     r.Items[0].Snippet.Thumbnails.High.Url,
		UploadPlaylistId: r.Items[0].ContentDetails.RelatedPlaylists.Uploads,
		LastUpdated:      time.Now().Format(time.RFC3339),
	}

	// Use default thumbnail if high quality isn't available
	if c.ThumbnailUrl == "" {
		c.ThumbnailUrl = r.Items[0].Snippet.Thumbnails.Default.Url
	}

	return c
}

type Video struct {
	Id           string
	Title        string
	ChannelId    string
	Description  string
	PublishedAt  string
	ThumbnailUrl string
	LastUpdated  string
}

func (r *VideoResponse) toVideos() map[string]*Video {
	m := make(map[string]*Video)
	for _, item := range r.Items {
		v := &Video{
			Id:           item.Id,
			Title:        item.Snippet.Title,
			ChannelId:    item.Snippet.ChannelId,
			Description:  item.Snippet.Description,
			PublishedAt:  item.Snippet.PublishedAt,
			ThumbnailUrl: item.Snippet.Thumbnails.High.Url,
			LastUpdated:  time.Now().Format(time.RFC3339),
		}

		if v.ThumbnailUrl == "" {
			v.ThumbnailUrl = item.Snippet.Thumbnails.Default.Url
		}

		m[item.Id] = v
	}

	return m
}

type Link struct {
	Id            string
	Href          string
	Brand         string
	Description   string
	Category      string
	PublishedAt   string
	VideoId       string
	VideoTitle    string
	ChannelId     string
	Tags          []string
	LastUpdated   string
	OtherVideoIds []string
}

func videosToLinksByVideoId(videos map[string]*Video) (map[string]map[string]*Link, error) {
	videoLinks := make(map[string]map[string]*Link)

	for videoId, video := range videos {
		links := make(map[string]*Link)

		links, err := parseVideoDescription(video)
		if err != nil {
			return nil, err
		}

		if len(links) == 0 {
			continue
		}

		videoLinks[videoId] = links
	}

	return videoLinks, nil
}

// func videosToLinks(videos map[string]*Video) (map[string]*Link, error) {
// 	links := make(map[string]*Link)

// 	for videoId, video := range videos {
// 		// iterate through each line in description
// 		sc := bufio.NewScanner(strings.NewReader(video.Description))
// 		for sc.Scan() {
// 			line := sc.Text()

// 			rawUrl, ok := getLinkUrl(line)
// 			if !ok {
// 				continue
// 			}

// 			description, brand := getLinkDescriptionAndBrand("", line, rawUrl)

// 			unencodedId := fmt.Sprintf("%s %s", video.ChannelId, rawUrl)
// 			encodedId := base64.URLEncoding.EncodeToString([]byte(unencodedId))

// 			link := &Link{
// 				Id:          encodedId,
// 				Category:    getLinkCategory(rawUrl),
// 				ChannelId:   video.ChannelId,
// 				VideoId:     videoId,
// 				VideoTitle:  video.Title,
// 				PublishedAt: video.PublishedAt,
// 				Href:        rawUrl,
// 				Description: description,
// 				Brand:       brand,
// 				Tags:        []string{""},
// 				LastUpdated: time.Now().Format(time.RFC3339),
// 			}

// 			links[link.Id] = link
// 		}
// 	}

// 	return links, nil
// }
