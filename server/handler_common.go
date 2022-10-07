package main

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"strconv"

	"github.com/labstack/echo"
	"github.com/typesense/typesense-go/typesense/api"
)

const (
	TYPESENSE_AUTH_HEADER    = "X-TYPESENSE-API-KEY"
	CHANNELS_SEARCH_URL_PATH = "/collections/channels/documents/search"
	VIDEOS_SEARCH_URL_PATH   = "/collections/videos/documents/search"
	LINKS_SEARCH_URL_PATH    = "/collections/links/documents/search"

	PER_PAGE_RESULTS = 200
)

func printLog(s string, data interface{}) {
	bytes, _ := json.Marshal(data)
	log.Println("%s: %s", s, string(bytes))
	return
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

func getAllPages(httpClient *http.Client, req *http.Request, r SearchResult, typesenseCount int) *echo.HTTPError {
	count := typesenseCount / PER_PAGE_RESULTS
	if count == 0 {
		return nil
	}

	if typesenseCount%PER_PAGE_RESULTS > 0 {
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

// Create custom http request to send to typesense server because
// typesense-go library doesn't support infix in search requests.
func createTypesenseRequest(cfg *Config, urlPathname string, queries map[string]string) (*http.Request, error) {
	req, err := http.NewRequest("GET", cfg.Typesense.URL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Add(TYPESENSE_AUTH_HEADER, cfg.Typesense.ApiKey)
	req.URL.Path = urlPathname

	q := req.URL.Query()
	for k, v := range queries {
		q.Add(k, v)
	}
	q.Add("per_page", strconv.Itoa(PER_PAGE_RESULTS))
	req.URL.RawQuery = q.Encode()

	return req, nil
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
