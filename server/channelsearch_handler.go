package main

import (
	"net/http"

	"github.com/labstack/echo"
	"github.com/typesense/typesense-go/typesense"
	"github.com/typesense/typesense-go/typesense/api"
)

func ChannelSearchHandler(ts *typesense.Client, cfg *Config) echo.HandlerFunc {
	return func(ctx echo.Context) error {
		printLog("Received request", ctx.Request())

		var r SearchRequest
		if err := ctx.Bind(&r); err != nil {
			return echo.NewHTTPError(400, "Bad request. Expected SearchRequest type.")
		}

		req, err := createTypesenseRequest(
			cfg,
			LINKS_SEARCH_URL_PATH,
			map[string]string{
				"q":         r.Term,
				"query_by":  "Brand,Description,Href,VideoTitle",
				"infix":     "always,always,always,always",
				"sort_by":   "PublishedAtInt:desc",
				"num_typos": "0",
			},
		)
		if err != nil {
			return echo.NewHTTPError(400, "Problem creating request: "+err.Error())
		}

		httpClient := &http.Client{}

		tsResult, httpError := do(httpClient, req)
		if httpError != nil {
			return err
		}

		result := &ChannelSearchResult{
			TypesenseCount: *tsResult.Found,
			ChannelIds:     make(map[string]struct{}),
			LinkHits:       make(map[string]map[string]map[string]struct{}), // channelId -> videoId -> linkId:struct{}
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

func channelSearch() {

}

func (r *ChannelSearchResult) transformTypesenseResult(result *api.SearchResult) {
	for _, hit := range *result.Hits {
		m := *(hit.Document)

		channelId := m["ChannelId"].(string)
		videoId := m["VideoId"].(string)
		linkId := m["Id"].(string)

		if len(*hit.Highlights) < 1 {
			continue
		}

		r.ChannelIds[channelId] = struct{}{}
		for _, highlight := range *hit.Highlights {
			_, ok := r.LinkHits[channelId]
			if !ok {
				r.LinkHits[channelId] = map[string]map[string]struct{}{}
			}

			// document only matched on video title
			if *highlight.Field == "VideoTitle" {
				_, ok := r.LinkHits[channelId][videoId]
				if !ok {
					r.LinkHits[channelId][videoId] = map[string]struct{}{}
				}
			} else {
				// document matched on actual link parts
				_, ok := r.LinkHits[channelId][videoId]
				if !ok {
					r.LinkHits[channelId][videoId] = map[string]struct{}{linkId: {}}
				} else {
					r.LinkHits[channelId][videoId][linkId] = struct{}{}
				}
			}
		}
	}

	return
}

func (r *ChannelSearchResult) toResponse(term string) interface{} {
	response := &ChannelSearchResponse{
		TypesenseCount: r.TypesenseCount,
		Term:           term,
		ChannelIds:     mapToArray(r.ChannelIds),
		LinkHitCount:   make(map[string]int),
	}

	for channelId, videoHits := range r.LinkHits {
		for _, linkHits := range videoHits {
			// Matched on video title instead of links.
			// Still add one to hit count.
			if (len(linkHits)) == 0 {
				response.LinkHitCount[channelId] += 1
			} else {
				response.LinkHitCount[channelId] += len(linkHits)
			}

		}
	}

	return response
}
