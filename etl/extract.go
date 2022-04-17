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

	return getChannelByChannelId(client, apiKey, channelId)
}

func extractVideosByLastUpdated(client *http.Client, apiKey, channelId string, lastUpdated string) (*VideoResponse, error) {
	videoIds, err := searchVideoIdsAfterPublishedDate(client, apiKey, channelId, lastUpdated, "")
	if err != nil {
		return nil, err
	}

	return getVideosByVideoIds(client, apiKey, videoIds)
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

func getChannelByChannelId(client *http.Client, apiKey, channelId string) (*ChannelResponse, error) {
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

func getVideosByVideoIds(client *http.Client, apiKey string, ids []string) (*VideoResponse, error) {
	var response VideoResponse

	// Youtube maxes video requests by 50.
	n := 1
	if len(ids) > 50 {
		n = len(ids) / 50
		if len(ids)%50 > 0 {
			n += 1
		}
	}

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

// unused.

// func getVideosByUploadPlaylist(client *http.Client, apiKey, playlistId string) (map[string]VideoSnippet, error) {
// 	req, err := http.NewRequest("GET", YOUTUBE_API_URL, nil)
// 	if err != nil {
// 		return nil, err
// 	}

// 	req.URL.Path = fmt.Sprintf("%s/%s", req.URL.Path, "playlistItems")

// 	// set params
// 	q := req.URL.Query()
// 	q.Add("key", apiKey)
// 	q.Add("part", "snippet")
// 	q.Add("maxResults", "10")
// 	q.Add("playlistId", playlistId)

// 	req.URL.RawQuery = q.Encode()

// 	type Response struct {
// 		Items []struct {
// 			Snippet VideoSnippet
// 		}
// 	}

// 	resp, err := client.Do(req)
// 	if err != nil {
// 		return nil, err
// 	}
// 	defer resp.Body.Close()

// 	var r Response
// 	if err := json.NewDecoder(resp.Body).Decode(&r); err != nil {
// 		return nil, err
// 	}

// 	m := make(map[string]VideoSnippet)
// 	for _, item := range r.Items {
// 		m[item.Snippet.ResourceId.VideoId] = item.Snippet
// 	}

// 	return m, nil
// }

// func getUploadPlaylistByChannelId(client *http.Client, apiKey, channelId string) (string, error) {
// 	req, err := http.NewRequest("GET", YOUTUBE_API_URL, nil)
// 	if err != nil {
// 		return "", err
// 	}

// 	req.URL.Path = fmt.Sprintf("%s/%s", req.URL.Path, "channels")

// 	// set params
// 	q := req.URL.Query()
// 	q.Add("key", apiKey)
// 	q.Add("part", "contentDetails")
// 	q.Add("id", channelId)

// 	req.URL.RawQuery = q.Encode()

// 	resp, err := client.Do(req)
// 	if err != nil {
// 		return "", err
// 	}
// 	defer resp.Body.Close()

// 	type Response struct {
// 		Items []struct {
// 			ContentDetails struct {
// 				RelatedPlaylists struct {
// 					Uploads string
// 				}
// 			}
// 		}
// 	}

// 	var r Response
// 	if err := json.NewDecoder(resp.Body).Decode(&r); err != nil {
// 		return "", err
// 	}

// 	return r.Items[0].ContentDetails.RelatedPlaylists.Uploads, nil
// }
