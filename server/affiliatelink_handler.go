package main

import (
	"github.com/labstack/echo"
)

type AffiliateLinkRequest struct {
	Href string
}

func AffiliateLinkHandler(cfg *Config) echo.HandlerFunc {
	return func(ctx echo.Context) error {
		printLog("Received request", ctx.Request())

		var r AffiliateLinkRequest
		if err := ctx.Bind(&r); err != nil {
			return echo.NewHTTPError(400, "Bad request. Expected AffiliateLinkRequest type.")
		}

		affiliateLink, err := getAffiliateLink(r.Href)
		if err != nil {
			return echo.NewHTTPError(500, err)
		}

		return ctx.JSON(200, affiliateLink)
	}
}
