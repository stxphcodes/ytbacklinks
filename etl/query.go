package main

import (
	"context"
	"time"

	"firebase.google.com/go/db"
)

func queryLastUpdated(client *db.Client, ctx context.Context) (time.Time, error) {
	ref := client.NewRef("/lastUpdated")

	var date string
	if err := ref.Get(ctx, &date); err != nil {
		return time.Time{}, err
	}

	return time.Time{}, nil
}
