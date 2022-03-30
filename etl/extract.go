package main

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type ChannelResponse struct {
	Kind  string `json:"kind"`
	Etag  string `json:"etag"`
	Items []struct {
		Kind           string `json:"kind"`
		Id             string `json:"id"`
		ContentDetails struct {
			RelatedPlaylists struct {
				Likes   string `json:"likes"`
				Uploads string `json:"uploads"`
			} `json:"relatedPlaylists"`
		} `json:"contentDetails"`
	}
}

func getUploadPlaylist(client *http.Client, channelUsername, apiKey string) (string, error) {
	req, err := http.NewRequest("GET", YOUTUBE_API_URL, nil)
	if err != nil {
		return "", err
	}

	req.URL.Path = fmt.Sprintf("%s/%s", req.URL.Path, "channels")

	// set params
	q := req.URL.Query()
	q.Add("part", "contentDetails")
	q.Add("forUsername", channelUsername)
	q.Add("key", apiKey)
	req.URL.RawQuery = q.Encode()

	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var c ChannelResponse
	if err := json.NewDecoder(resp.Body).Decode(&c); err != nil {
		return "", err
	}

	return c.Items[0].ContentDetails.RelatedPlaylists.Uploads, nil
}

type Snippet struct {
	PublishedAt string
	Title       string
	Description string
	ResourceId  struct {
		VideoId string
	}
}

type PlaylistResponse struct {
	Kind  string
	Items []struct {
		Kind    string
		Id      string
		Snippet Snippet
	}
}

func getVideoSnippets(client *http.Client, playlistId, apiKey string) (map[string]Snippet, error) {
	req, err := http.NewRequest("GET", YOUTUBE_API_URL, nil)
	if err != nil {
		return nil, err
	}

	req.URL.Path = fmt.Sprintf("%s/%s", req.URL.Path, "playlistItems")

	// set params
	q := req.URL.Query()
	q.Add("part", "snippet")
	q.Add("maxResults", "10")
	q.Add("playlistId", playlistId)
	q.Add("key", apiKey)

	req.URL.RawQuery = q.Encode()

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var p PlaylistResponse
	if err := json.NewDecoder(resp.Body).Decode(&p); err != nil {
		return nil, err
	}

	m := make(map[string]Snippet)
	for _, item := range p.Items {
		m[item.Snippet.ResourceId.VideoId] = item.Snippet
	}

	return m, nil
}
