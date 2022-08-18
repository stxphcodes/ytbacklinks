package main

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"strconv"

	"github.com/labstack/echo"
	"github.com/typesense/typesense-go/typesense"
	"github.com/typesense/typesense-go/typesense/api"
)

const (
	TYPESENSE_AUTH_HEADER              = "X-TYPESENSE-API-KEY"
	TYPESENSE_DOCUMENT_SEARCH_URL_PATH = "/collections/links/documents/search"
	PER_PAGE_RESULTS                   = 10
)

type SearchRequest struct {
	ChannelId string `json:"channelId"`
	Term      string `json:"term"`
}

type SearchResponse struct {
	HitCount       int
	LinkHits       map[string][]string
	Term           string
	TypesenseCount int
	VideoIds       []string
	VideoTitleHits map[string][]string
}

type SearchResult struct {
	TypesenseCount int
	VideoIds       map[string]struct{}
	LinkHits       map[string]map[string]struct{}
	VideoTitleHits map[string]map[string]struct{}
}

func printLog(s string, data interface{}) {
	bytes, _ := json.Marshal(data)
	log.Println("%s: %s", s, string(bytes))
	return
}

func SearchHandler(ts *typesense.Client, cfg *Config) echo.HandlerFunc {
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

		result := &SearchResult{
			TypesenseCount: *tsResult.Found,
			VideoIds:       make(map[string]struct{}),
			LinkHits:       make(map[string]map[string]struct{}),
			VideoTitleHits: make(map[string]map[string]struct{}),
		}
		result.transformTypesenseResult(tsResult)

		if err := result.getAllPages(httpClient, req); err != nil {
			return err
		}

		response := result.toResponse(r.Term)
		printLog("Response being sent", response)
		return ctx.JSON(200, response)
	}
}

func do(httpClient *http.Client, req *http.Request) (*api.SearchResult, *echo.HTTPError) {
	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, echo.NewHTTPError(resp.StatusCode, err.Error())
	}
	defer resp.Body.Close()

	bytes, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, echo.NewHTTPError(500, string(bytes))
	}

	statusOk := resp.StatusCode >= 200 && resp.StatusCode < 300
	if !statusOk {
		return nil, echo.NewHTTPError(resp.StatusCode, string(bytes))
	}

	var result api.SearchResult
	if err := json.Unmarshal(bytes, &result); err != nil {
		return nil, echo.NewHTTPError(500, err.Error())
	}

	return &result, nil
}

func (r *SearchResult) transformTypesenseResult(result *api.SearchResult) {
	for _, hit := range *result.Hits {
		m := *(hit.Document)

		videoId := m["VideoId"].(string)
		videoTitle := m["VideoTitle"].(string)
		linkId := m["Id"].(string)

		r.VideoIds[videoId] = struct{}{}

		titleMap := make(map[string]struct{})
		linkMap := make(map[string]struct{})
		for _, highlight := range *hit.Highlights {
			if *highlight.Field == "VideoTitle" {
				titleMap[videoTitle] = struct{}{}
			} else {
				// matched on link field
				linkMap[linkId] = struct{}{}
			}
		}

		if len(titleMap) > 0 {
			r.VideoTitleHits[videoId] = titleMap
		}
		if len(linkMap) > 0 {
			r.LinkHits[videoId] = linkMap
		}
	}

	return
}

func (r *SearchResult) getAllPages(httpClient *http.Client, req *http.Request) *echo.HTTPError {
	count := r.TypesenseCount / PER_PAGE_RESULTS
	if count == 0 {
		return nil
	}

	if r.TypesenseCount%PER_PAGE_RESULTS > 0 {
		count += 1
	}

	for n := 2; n <= count; n++ {
		q := req.URL.Query()
		q.Add("page", strconv.Itoa(n))
		req.URL.RawQuery = q.Encode()

		result, httpError := do(httpClient, req)
		if httpError != nil {
			return httpError
		}

		r.transformTypesenseResult(result)
	}

	return nil
}

func (r *SearchResult) toResponse(term string) *SearchResponse {
	response := &SearchResponse{
		TypesenseCount: r.TypesenseCount,
		Term:           term,
		VideoIds:       mapToArray(r.VideoIds),
		LinkHits:       nestedMapToMapArray(r.LinkHits),
		VideoTitleHits: nestedMapToMapArray(r.VideoTitleHits),
	}
	response.getHitCount()

	return response
}

func (response *SearchResponse) getHitCount() {
	for _, array := range response.LinkHits {
		response.HitCount += len(array)
	}
	for _, array := range response.VideoTitleHits {
		response.HitCount += len(array)
	}
}

func mapToArray(m map[string]struct{}) []string {
	a := []string{}
	for k := range m {
		a = append(a, k)
	}

	return a
}

func nestedMapToMapArray(n map[string]map[string]struct{}) map[string][]string {
	m := make(map[string][]string)
	for k, v := range n {
		m[k] = mapToArray(v)
	}

	return m
}
