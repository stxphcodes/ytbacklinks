package main

import (
	"net/http"

	"github.com/labstack/echo"
	"github.com/typesense/typesense-go/typesense"
	"github.com/typesense/typesense-go/typesense/api"
)

func LinkSearchHandler(ts *typesense.Client, cfg *Config) echo.HandlerFunc {
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
				"filter_by": "ChannelId:" + r.ChannelId,
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

		result := &LinkSearchResult{
			TypesenseCount: *tsResult.Found,
			VideoIds:       make(map[string]struct{}),
			LinkHits:       make(map[string]map[string]struct{}), //videoId -> linkId:struct{}
			VideoTitleHits: make(map[string]struct{}),
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

func (r *LinkSearchResult) transformTypesenseResult(result *api.SearchResult) {
	for _, hit := range *result.Hits {
		m := *(hit.Document)

		videoId := m["VideoId"].(string)
		linkId := m["Id"].(string)

		if len(*hit.Highlights) < 1 {
			continue
		}

		r.VideoIds[videoId] = struct{}{}
		for _, highlight := range *hit.Highlights {
			// document only matched on video title
			if *highlight.Field == "VideoTitle" {
				r.VideoTitleHits[videoId] = struct{}{}
				// document matched on actual link parts
			} else {
				_, ok := r.LinkHits[videoId]
				if !ok {
					r.LinkHits[videoId] = map[string]struct{}{linkId: {}}
				} else {
					r.LinkHits[videoId][linkId] = struct{}{}
				}
			}
		}
	}

	return
}

func (r *LinkSearchResult) toResponse(term string) interface{} {
	response := &LinkSearchResponse{
		TypesenseCount: r.TypesenseCount,
		Term:           term,
		VideoIds:       mapToArray(r.VideoIds),
		LinkHits:       nestedMapToMapArray(r.LinkHits),
		VideoTitleHits: r.VideoTitleHits,
	}
	response.getHitCount()

	return response
}

func (response *LinkSearchResponse) getHitCount() {
	// Hit Count = unique link hits + unique video title hits
	for _, array := range response.LinkHits {
		response.HitCount += len(array)
	}

	response.HitCount += len(response.VideoTitleHits)

	// Link or video title
	if response.HitCount == 0 {
		response.HitCount = len(response.VideoIds)
	}
}
