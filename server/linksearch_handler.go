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

		// Create custom http request to send to typesense server because
		// typesense-go library doesn't support infix in search requests.
		req, err := http.NewRequest("GET", cfg.Typesense.URL, nil)
		if err != nil {
			return err
		}
		req.Header.Add(TYPESENSE_AUTH_HEADER, cfg.Typesense.ApiKey)
		req.URL.Path = TYPESENSE_DOCUMENT_SEARCH_URL_PATH

		q := req.URL.Query()
		q.Add("q", r.Term)
		q.Add("query_by", "Brand,Description,Href,VideoTitle")
		q.Add("infix", "always,always,always,always")
		q.Add("sort_by", "PublishedAtInt:desc")
		q.Add("filter_by", "ChannelId:"+r.ChannelId)

		req.URL.RawQuery = q.Encode()

		httpClient := &http.Client{}

		tsResult, httpError := do(httpClient, req)
		if httpError != nil {
			return err
		}

		printLog("Result from typesense", tsResult)

		result := &LinkSearchResult{
			TypesenseCount: *tsResult.Found,
			VideoIds:       make(map[string]struct{}),
			LinkHits:       make(map[string]map[string]struct{}),
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

		r.VideoIds[videoId] = struct{}{}

		linkMap := make(map[string]struct{})
		for _, highlight := range *hit.Highlights {
			if *highlight.Field == "VideoTitle" {
				r.VideoTitleHits[videoId] = struct{}{}
			} else {
				// matched on link field
				linkMap[linkId] = struct{}{}
			}
		}

		if len(linkMap) > 0 {
			r.LinkHits[videoId] = linkMap
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
	// for _, array := range response.VideoTitleHits {
	// 	response.HitCount += len(array)
	// }

	// Link or video title
	if response.HitCount == 0 {
		response.HitCount = len(response.VideoIds)
	}
}
