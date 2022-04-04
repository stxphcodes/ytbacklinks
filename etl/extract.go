package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"
)

const YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3"

func extractVideosByLastUpdated(client *http.Client, apiKey string, lastUpdated time.Time) (map[string]VideoSnippet, error) {
	channelId, err := searchChannelIdByTitle(client, apiKey, CHANNEL_TITLES[0])
	if err != nil {
		return nil, err
	}

	videoIds, err := searchVideoIdsAfterPublishedDate(client, apiKey, channelId, lastUpdated)
	if err != nil {
		return nil, err
	}

	return getVideosByVideoIds(client, apiKey, videoIds)
}

func extractVideos(client *http.Client, apiKey, channelTitle string) (map[string]VideoSnippet, error) {
	channelId, err := searchChannelIdByTitle(client, apiKey, CHANNEL_TITLES[0])
	if err != nil {
		return nil, err
	}

	playlistId, err := getUploadPlaylistByChannelId(client, apiKey, channelId)
	if err != nil {
		return nil, err
	}

	return getVideosByUploadPlaylist(client, apiKey, playlistId)
}

func searchChannelIdByTitle(client *http.Client, apiKey, channelTitle string) (string, error) {
	req, err := http.NewRequest("GET", YOUTUBE_API_URL, nil)
	if err != nil {
		return "", err
	}

	req.URL.Path = fmt.Sprintf("%s/%s", req.URL.Path, "search")

	// set params
	// URL looks something like:
	// 'https://www.googleapis.com/youtube/v3/search?key=AIzaSyDu7ExJHUAyGXFiG2FPJxwa9xQMbrEiT2A&part=snippet&type=channel&q={jenn%20im}&fields=items%2Fsnippet(title,channelId)&maxResults=1'
	q := req.URL.Query()
	q.Add("key", apiKey)
	q.Add("part", "snippet")
	q.Add("type", "channel")
	q.Add("q", channelTitle)
	q.Add("fields", "items/snippet(title,channelId)")
	q.Add("maxResults", "1")

	req.URL.RawQuery = q.Encode()

	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	type Response struct {
		Items []struct {
			Snippet struct {
				ChannelId string
				Title     string
			}
		}
	}

	var r Response
	if err := json.NewDecoder(resp.Body).Decode(&r); err != nil {
		return "", err
	}

	return r.Items[0].Snippet.ChannelId, nil
}

func getUploadPlaylistByChannelId(client *http.Client, apiKey, channelId string) (string, error) {
	req, err := http.NewRequest("GET", YOUTUBE_API_URL, nil)
	if err != nil {
		return "", err
	}

	req.URL.Path = fmt.Sprintf("%s/%s", req.URL.Path, "channels")

	// set params
	q := req.URL.Query()
	q.Add("key", apiKey)
	q.Add("part", "contentDetails")
	q.Add("id", channelId)

	req.URL.RawQuery = q.Encode()

	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	type Response struct {
		Items []struct {
			ContentDetails struct {
				RelatedPlaylists struct {
					Uploads string
				}
			}
		}
	}

	var r Response
	if err := json.NewDecoder(resp.Body).Decode(&r); err != nil {
		return "", err
	}

	return r.Items[0].ContentDetails.RelatedPlaylists.Uploads, nil
}

func searchVideoIdsAfterPublishedDate(client *http.Client, apiKey, channelId string, lastUpdated time.Time) ([]string, error) {
	req, err := http.NewRequest("GET", YOUTUBE_API_URL, nil)
	if err != nil {
		return nil, err
	}

	req.URL.Path = fmt.Sprintf("%s/%s", req.URL.Path, "search")
	// set params
	q := req.URL.Query()
	q.Add("key", apiKey)
	q.Add("type", "video")
	q.Add("part", "snippet")
	q.Add("channelId", channelId)
	q.Add("publishedAfter", lastUpdated.String())

	req.URL.RawQuery = q.Encode()

	type Response struct {
		Items []struct {
			Id struct {
				VideoId string
			}
		}
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var r Response
	if err := json.NewDecoder(resp.Body).Decode(&r); err != nil {
		return nil, err
	}

	ids := []string{}
	for _, item := range r.Items {
		ids = append(ids, item.Id.VideoId)
	}

	return ids, nil
}

type VideoSnippet struct {
	PublishedAt string
	Title       string
	Description string
	ResourceId  struct {
		VideoId string
	}
}

func getVideosByVideoIds(client *http.Client, apiKey string, ids []string) (map[string]VideoSnippet, error) {
	req, err := http.NewRequest("GET", YOUTUBE_API_URL, nil)
	if err != nil {
		return nil, err
	}

	req.URL.Path = fmt.Sprintf("%s/%s", req.URL.Path, "videos")

	// set params
	q := req.URL.Query()
	q.Add("key", apiKey)
	q.Add("part", "snippet")
	q.Add("id", strings.Join(ids, ","))

	req.URL.RawQuery = q.Encode()

	type Response struct {
		Items []struct {
			Snippet VideoSnippet
		}
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var r Response
	if err := json.NewDecoder(resp.Body).Decode(&r); err != nil {
		return nil, err
	}

	m := make(map[string]VideoSnippet)
	for _, item := range r.Items {
		m[item.Snippet.ResourceId.VideoId] = item.Snippet
	}

	return m, nil

}

func getVideosByUploadPlaylist(client *http.Client, apiKey, playlistId string) (map[string]VideoSnippet, error) {
	req, err := http.NewRequest("GET", YOUTUBE_API_URL, nil)
	if err != nil {
		return nil, err
	}

	req.URL.Path = fmt.Sprintf("%s/%s", req.URL.Path, "playlistItems")

	// set params
	q := req.URL.Query()
	q.Add("key", apiKey)
	q.Add("part", "snippet")
	q.Add("maxResults", "10")
	q.Add("playlistId", playlistId)

	req.URL.RawQuery = q.Encode()

	type Response struct {
		Items []struct {
			Snippet VideoSnippet
		}
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var r Response
	if err := json.NewDecoder(resp.Body).Decode(&r); err != nil {
		return nil, err
	}

	m := make(map[string]VideoSnippet)
	for _, item := range r.Items {
		m[item.Snippet.ResourceId.VideoId] = item.Snippet
	}

	return m, nil
}
