package main

import (
	"fmt"
	"time"

	"github.com/google/go-github/v47/github"
	"github.com/labstack/echo"
)

const (
	GistId   = "469389cf4c493378572b414eb91d049e"
	GistName = "ytbacklinks-new-channels.txt"
)

type NewChannelRequest struct {
	RequestDate       string
	ChannelName       string
	ChannelCategories []string
	Email             string
}

type NewChannelResponse struct {
	ChannelAdded bool
}

func NewChannelHandler(gh *github.Client, cfg *Config) echo.HandlerFunc {
	return func(ctx echo.Context) error {
		printLog("Received request", ctx.Request())

		var r NewChannelRequest
		if err := ctx.Bind(&r); err != nil {
			return echo.NewHTTPError(400, "Bad request. Expected NewChannelRequest type.")
		}
		r.RequestDate = time.Now().Format(time.RFC3339)

		// Get github gist.
		gist, resp, err := gh.Gists.Get(ctx.Request().Context(), GistId)
		if err != nil {
			return echo.NewHTTPError(500, "Error getting channels gist.")
		}
		if resp.StatusCode != 200 {
			return echo.NewHTTPError(resp.StatusCode, resp.Response)
		}

		file, ok := gist.Files[GistName]
		if !ok {
			return echo.NewHTTPError(404, "Can't find youtube gist file")
		}

		// Add new request to gist.
		newContent := file.GetContent() + fmt.Sprintf("%+v\n", r)
		file.Content = &newContent
		gist.Files[GistName] = file

		// Send update request to github.
		_, resp, err = gh.Gists.Edit(ctx.Request().Context(), GistId, gist)
		if err != nil {
			return echo.NewHTTPError(500, "Error udpating channels gist.")
		}

		if resp.StatusCode < 200 || resp.StatusCode > 299 {
			return echo.NewHTTPError(resp.StatusCode, resp.Response)
		}

		return ctx.JSON(200, &NewChannelResponse{
			ChannelAdded: true,
		})
	}
}
