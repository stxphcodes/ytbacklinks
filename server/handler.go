package main

import (
	"encoding/json"
	"io/ioutil"
	"net/http"

	"github.com/labstack/echo"
	"github.com/typesense/typesense-go/typesense"
	"github.com/typesense/typesense-go/typesense/api"
)

const (
	TYPESENSE_AUTH_HEADER              = "X-TYPESENSE-API-KEY"
	TYPESENSE_DOCUMENT_SEARCH_URL_PATH = "/collections/links/documents/search"
)

func SearchHandler(ts *typesense.Client, cfg *Config) echo.HandlerFunc {
	return func(ctx echo.Context) error {
		queryParams := ctx.Request().URL.Query()
		searchTerm := queryParams.Get("q")
		if searchTerm == "" {

			return echo.NewHTTPError(400, "missing URL query param 'q'")
		}

		req, err := http.NewRequest("GET", cfg.Typesense.URL, nil)
		if err != nil {
			return err
		}
		req.Header.Add(TYPESENSE_AUTH_HEADER, cfg.Typesense.ApiKey)
		req.URL.Path = TYPESENSE_DOCUMENT_SEARCH_URL_PATH

		q := req.URL.Query()
		q.Add("q", searchTerm)
		q.Add("query_by", "Brand,Description,Href,VideoTitle")
		q.Add("infix", "always,always,always,always")

		req.URL.RawQuery = q.Encode()

		httpClient := &http.Client{}
		resp, err := httpClient.Do(req)
		if err != nil {
			return echo.NewHTTPError(resp.StatusCode, err.Error())
		}
		defer resp.Body.Close()

		bytes, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			return echo.NewHTTPError(500, string(bytes))
		}

		statusOk := resp.StatusCode >= 200 && resp.StatusCode < 300
		if !statusOk {
			return echo.NewHTTPError(resp.StatusCode, string(bytes))
		}

		var res api.SearchResult
		if err := json.Unmarshal(bytes, &res); err != nil {
			return err
		}

		return ctx.JSON(200, res)
	}
}
