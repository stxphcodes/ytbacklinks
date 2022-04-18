package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"strings"
)

const YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3"

func checkResponse(resp *http.Response) error {
	statusOK := resp.StatusCode >= 200 && resp.StatusCode < 300
	if statusOK {
		return nil
	}

	b, _ := ioutil.ReadAll(resp.Body)
	return fmt.Errorf(string(b))
}

func extractChannel(client *http.Client, apiKey, channelTitle string) (*ChannelResponse, error) {
	channelId, err := searchChannelIdByTitle(client, apiKey, channelTitle)
	if err != nil {
		return nil, err
	}

	return getChannelById(client, apiKey, channelId)
}

func extractVideosByLastUpdated(client *http.Client, apiKey, channelId string, lastUpdated string) (*VideoResponse, error) {
	videoIds, err := searchVideoIdsAfterPublishedDate(client, apiKey, channelId, lastUpdated, "")
	if err != nil {
		return nil, err
	}

	return getVideosByIds(client, apiKey, videoIds)
}

func searchChannelIdByTitle(client *http.Client, apiKey, channelTitle string) (string, error) {
	req, err := http.NewRequest("GET", YOUTUBE_API_URL, nil)
	if err != nil {
		return "", err
	}

	req.URL.Path = fmt.Sprintf("%s/%s", req.URL.Path, "search")
	// set params
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

	if err := checkResponse(resp); err != nil {
		return "", err
	}

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

	if len(r.Items) < 1 {
		return "", fmt.Errorf("No channel found for title.")
	}

	return r.Items[0].Snippet.ChannelId, nil
}

type ChannelResponse struct {
	Items []struct {
		Id      string
		Snippet struct {
			Title       string
			Description string
			CustomUrl   string
			Thumbnails  struct {
				Default struct {
					Url string
				}
				High struct {
					Url string
				}
			}
		}
		ContentDetails struct {
			RelatedPlaylists struct {
				Uploads string
			}
		}
	}
}

func getChannelById(client *http.Client, apiKey, channelId string) (*ChannelResponse, error) {
	req, err := http.NewRequest("GET", YOUTUBE_API_URL, nil)
	if err != nil {
		return nil, err
	}

	req.URL.Path = fmt.Sprintf("%s/%s", req.URL.Path, "channels")
	// set params
	q := req.URL.Query()
	q.Add("key", apiKey)
	q.Add("part", "snippet,contentDetails")
	q.Add("id", channelId)

	req.URL.RawQuery = q.Encode()

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if err := checkResponse(resp); err != nil {
		return nil, err
	}

	var r ChannelResponse
	if err := json.NewDecoder(resp.Body).Decode(&r); err != nil {
		return nil, err
	}

	return &r, nil
}

func searchVideoIdsAfterPublishedDate(client *http.Client, apiKey, channelId, lastUpdated, pageToken string) ([]string, error) {
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
	q.Add("publishedAfter", lastUpdated)
	// by default results are split to 5 resultsPerPage.
	// setting maxResults helps return more.
	q.Add("maxResults", "100")
	// get results by page.
	q.Add("pageToken", pageToken)

	req.URL.RawQuery = q.Encode()

	type Response struct {
		NextPageToken string
		Items         []struct {
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

	if err := checkResponse(resp); err != nil {
		return nil, err
	}

	var r Response
	if err := json.NewDecoder(resp.Body).Decode(&r); err != nil {
		return nil, err
	}

	ids := []string{}
	for _, item := range r.Items {
		ids = append(ids, item.Id.VideoId)
	}

	// recursively run function if there
	// are more page results.
	if r.NextPageToken != "" {
		nextPageIds, err := searchVideoIdsAfterPublishedDate(
			client,
			apiKey,
			channelId,
			lastUpdated,
			r.NextPageToken)
		if err != nil {
			return nil, err
		}
		ids = append(ids, nextPageIds...)
	}

	return ids, nil
}

type VideoResponse struct {
	Items []struct {
		Id      string
		Snippet struct {
			PublishedAt string
			ChannelId   string
			Title       string
			Description string
			Thumbnails  struct {
				Default struct {
					Url string
				}
				High struct {
					Url string
				}
			}
		}
	}
}

func getVideosByIds(client *http.Client, apiKey string, ids []string) (*VideoResponse, error) {
	var response VideoResponse

	// Youtube API returns a max of 50 videos.
	n := 1
	if len(ids) > 50 {
		n = len(ids) / 50
		if len(ids)%50 > 0 {
			n += 1
		}
	}

	// Get 50 video ids to request at a time.
	for i := 0; i < n; i++ {
		start := i * 50
		end := start + 50

		if end > len(ids) {
			end = len(ids)
		}

		idsToUse := ids[start:end]

		req, err := http.NewRequest("GET", YOUTUBE_API_URL, nil)
		if err != nil {
			return nil, err
		}

		req.URL.Path = fmt.Sprintf("%s/%s", req.URL.Path, "videos")
		// set params
		q := req.URL.Query()
		q.Add("key", apiKey)
		q.Add("part", "snippet")
		q.Add("id", strings.Join(idsToUse, ","))

		req.URL.RawQuery = q.Encode()

		resp, err := client.Do(req)
		if err != nil {
			return nil, err
		}
		defer resp.Body.Close()

		if err := checkResponse(resp); err != nil {
			return nil, err
		}

		var r VideoResponse
		if err := json.NewDecoder(resp.Body).Decode(&r); err != nil {
			return nil, err
		}

		response.Items = append(response.Items, r.Items...)
	}

	return &response, nil
}
