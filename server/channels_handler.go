package main

import (
	"net/http"

	"github.com/labstack/echo"
	"github.com/typesense/typesense-go/typesense"
	"github.com/typesense/typesense-go/typesense/api"
)

func ChannelsHandler(ts *typesense.Client, cfg *Config) echo.HandlerFunc {
	return func(ctx echo.Context) error {
		printLog("Received request", ctx.Request())

		req, err := createTypesenseRequest(
			cfg,
			CHANNELS_SEARCH_URL_PATH,
			map[string]string{
				"q": "*",
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

		result := &ChannelsResult{
			TypesenseCount: *tsResult.Found,
		}
		result.transformTypesenseResult(tsResult)

		if err := getAllPages(httpClient, req, result, result.TypesenseCount); err != nil {
			return err
		}

		response := result.toResponse("")

		return ctx.JSON(200, response)
	}
}

func (r *ChannelsResult) transformTypesenseResult(result *api.SearchResult) {
	for _, hit := range *result.Hits {
		m := *(hit.Document)

		r.Channels = append(r.Channels, m)
	}
	return
}

func (r *ChannelsResult) toResponse(term string) interface{} {
	response := &ChannelsResponse{
		Count:    r.TypesenseCount,
		Channels: r.Channels,
	}

	return response
}
