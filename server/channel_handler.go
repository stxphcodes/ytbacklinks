package main

import (
	"net/http"

	"github.com/labstack/echo"
	"github.com/typesense/typesense-go/typesense"
	"github.com/typesense/typesense-go/typesense/api"
)

func ChannelHandler(ts *typesense.Client, cfg *Config) echo.HandlerFunc {
	return func(ctx echo.Context) error {
		printLog("Received request", ctx.Request())
		channelId := ctx.Param("channelId")

		httpClient := &http.Client{}

		channelResult, err := getChannel(ts, httpClient, cfg, channelId)
		if err != nil {
			return echo.NewHTTPError(500, "error getting channel "+err.Error())
		}

		if err := getVideos(ts, httpClient, cfg, channelResult, channelId); err != nil {
			return echo.NewHTTPError(500, "error getting videos "+err.Error())
		}

		if err := getLinks(ts, httpClient, cfg, channelResult, channelId); err != nil {
			return echo.NewHTTPError(500, "error getting links "+err.Error())
		}

		response := channelResult.toResponse("")

		return ctx.JSON(200, response)
	}
}

func getChannel(
	ts *typesense.Client,
	httpClient *http.Client,
	cfg *Config,
	channelId string) (*ChannelResult, error) {
	req, err := createTypesenseRequest(
		cfg,
		CHANNELS_SEARCH_URL_PATH,
		map[string]string{
			"q":         "*",
			"filter_by": "Id:" + channelId,
		},
	)
	if err != nil {
		return nil, err
	}

	tsResult, httpError := do(httpClient, req)
	if httpError != nil {
		return nil, httpError
	}

	channel := (*tsResult.Hits)[0].Document
	return &ChannelResult{
		Channel: channel,
	}, nil
}

func getVideos(
	ts *typesense.Client,
	httpClient *http.Client,
	cfg *Config,
	channelResult *ChannelResult,
	channelId string) error {
	req, err := createTypesenseRequest(
		cfg,
		VIDEOS_SEARCH_URL_PATH,
		map[string]string{
			"q":         "*",
			"sort_by":   "PublishedAtInt:desc",
			"filter_by": "ChannelId:" + channelId,
		},
	)
	if err != nil {
		return err
	}

	tsResult, httpError := do(httpClient, req)
	if httpError != nil {
		return httpError
	}

	channelResult.transformTypesenseResult(tsResult)
	if err := getAllPages(httpClient, req, channelResult, *tsResult.Found); err != nil {
		return err
	}

	return nil
}

func getLinks(
	ts *typesense.Client,
	httpClient *http.Client,
	cfg *Config,
	channelResult *ChannelResult,
	channelId string) error {
	req, err := createTypesenseRequest(
		cfg,
		LINKS_SEARCH_URL_PATH,
		map[string]string{
			"q":         "*",
			"filter_by": "ChannelId:" + channelId,
		},
	)
	if err != nil {
		return err
	}

	tsResult, httpError := do(httpClient, req)
	if httpError != nil {
		return httpError
	}

	channelResult.AppendToLinks = true
	channelResult.transformTypesenseResult(tsResult)
	if err := getAllPages(httpClient, req, channelResult, *tsResult.Found); err != nil {
		return err
	}

	return nil
}

func (r *ChannelResult) transformTypesenseResult(result *api.SearchResult) {
	for _, hit := range *result.Hits {
		m := *(hit.Document)

		if !r.AppendToLinks {
			r.Videos = append(r.Videos, m)
		} else {
			r.Links = append(r.Links, m)
		}

	}
	return
}

func (r *ChannelResult) toResponse(term string) interface{} {
	response := &ChannelResponse{
		Channel: r.Channel,
	}

	a := []interface{}{}
	for _, video := range r.Videos {
		videoId := video.(map[string]interface{})["Id"].(string)

		video.(map[string]interface{})["Links"] = []interface{}{}

		i := 0
		for _, link := range r.Links {
			if link.(map[string]interface{})["VideoId"].(string) == videoId {
				video.(map[string]interface{})["Links"] = append(
					video.(map[string]interface{})["Links"].([]interface{}),
					link)
			} else {
				r.Links[i] = link
				i++
			}
		}

		r.Links = r.Links[:i]
		a = append(a, video)
	}

	response.Videos = a
	return response
}
