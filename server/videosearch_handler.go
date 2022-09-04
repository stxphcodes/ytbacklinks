package main

import (
	"net/http"

	"github.com/labstack/echo"
	"github.com/typesense/typesense-go/typesense"
	"github.com/typesense/typesense-go/typesense/api"
)

func VideoSearchHandler(ts *typesense.Client, cfg *Config) echo.HandlerFunc {
	return func(ctx echo.Context) error {
		printLog("Received request", ctx.Request())

		var r SearchRequest
		if err := ctx.Bind(&r); err != nil {
			return echo.NewHTTPError(400, "Bad request. Expected SearchRequest type.")
		}

		req, err := http.NewRequest("GET", cfg.Typesense.URL, nil)
		if err != nil {
			return err
		}
		req.Header.Add(TYPESENSE_AUTH_HEADER, cfg.Typesense.ApiKey)
		req.URL.Path = TYPESENSE_VIDEOS_SEARCH_URL_PATH

		q := req.URL.Query()
		q.Add("q", r.Term)
		q.Add("query_by", "Title,Description")
		q.Add("infix", "always,always")
		q.Add("sort_by", "PublishedAtInt:desc")
		q.Add("filter_by", "ChannelId:"+r.ChannelId)

		req.URL.RawQuery = q.Encode()

		httpClient := &http.Client{}

		tsResult, httpError := do(httpClient, req)
		if httpError != nil {
			return err
		}

		printLog("Result from typesense", tsResult)

		result := &VideoSearchResult{
			TypesenseCount:       *tsResult.Found,
			VideoIds:             make(map[string]struct{}),
			VideoDescriptionHits: make(map[string]struct{}),
			VideoTitleHits:       make(map[string]struct{}),
		}
		result.transformTypesenseResult(tsResult)

		if err := getAllPages(httpClient, req, result, result.TypesenseCount); err != nil {
			return err
		}

		response := result.toResponse(r.Term)
		printLog("Response being sent", response)
		return ctx.JSON(200, response)
	}
}

func (r *VideoSearchResult) transformTypesenseResult(result *api.SearchResult) {
	for _, hit := range *result.Hits {
		m := *(hit.Document)

		videoId := m["Id"].(string)

		r.VideoIds[videoId] = struct{}{}

		for _, highlight := range *hit.Highlights {
			if *highlight.Field == "Title" {
				r.VideoTitleHits[videoId] = struct{}{}
			} else {
				// usually description hits don't get highlighted...
				r.VideoDescriptionHits[videoId] = struct{}{}
			}
		}
	}

	return
}

func (r *VideoSearchResult) toResponse(term string) interface{} {
	response := &VideoSearchResponse{
		TypesenseCount:       r.TypesenseCount,
		Term:                 term,
		VideoIds:             mapToArray(r.VideoIds),
		VideoTitleHits:       r.VideoTitleHits,
		VideoDescriptionHits: r.VideoDescriptionHits,
	}

	response.HitCount = len(response.VideoTitleHits) + len(response.VideoIds)

	return response
}
