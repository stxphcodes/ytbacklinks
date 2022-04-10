package main

import (
	"context"

	"firebase.google.com/go/db"
)

func queryLastUpdated(ctx context.Context, client *db.Client) (string, error) {
	ref := client.NewRef("/lastUpdated")

	// get last element of array
	query := ref.OrderByKey().LimitToLast(1)

	// query returns map[array #]lastDate
	//var m map[int]string
	var m []string
	if err := query.Get(ctx, &m); err != nil {
		return "", err
	}

	var date string
	for _, value := range m {
		date = value
	}

	return date, nil
}
