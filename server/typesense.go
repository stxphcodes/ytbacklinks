package main

import (
	"fmt"
	"strings"

	"github.com/typesense/typesense-go/typesense"
	"github.com/typesense/typesense-go/typesense/api"
)

const (
	LINK_COLLECTION = "links"
)

func getTSDocCount(ts *typesense.Client) (int, error) {
	resp, err := ts.Collection(LINK_COLLECTION).Retrieve()
	if err != nil {
		return -1, err
	}

	return int(resp.NumDocuments), nil
}

func createLinkCollection(ts *typesense.Client) error {
	_, err := ts.Collection(LINK_COLLECTION).Delete()
	if err != nil {
		if !strings.Contains(err.Error(), "No collection with name") {
			return err
		}
	}

	schema := &api.CollectionSchema{
		Name: "links",
		Fields: []api.Field{
			{
				Name:  "Brand",
				Type:  "string",
				Infix: typedBool(true),
			},
			{
				Name: "Category",
				Type: "string",
			},
			{
				Name:  "ChannelId",
				Type:  "string",
				Facet: typedBool(true),
			},
			{
				Name:  "Description",
				Type:  "string",
				Infix: typedBool(true),
			},
			{
				Name:  "Href",
				Type:  "string",
				Infix: typedBool(true),
			},
			{
				Name: "Id",
				Type: "string",
			},
			{
				Name: "LastUpdated",
				Type: "string",
			},
			{
				Name: "PublishedAt",
				Type: "string",
			},
			{
				Name: "PublishedAtInt",
				Type: "int64",
				Sort: typedBool(true),
			},
			{
				Name:  "VideoId",
				Type:  "string",
				Facet: typedBool(true),
			},
			{
				Name:  "VideoTitle",
				Type:  "string",
				Infix: typedBool(true),
				Facet: typedBool(true),
			},
		},
	}

	_, err = ts.Collections().Create(schema)

	return err
}

func loadLinksToTypesense(ts *typesense.Client, links []interface{}) error {
	params := &api.ImportDocumentsParams{
		Action:    typedString("create"),
		BatchSize: typedInt(100),
	}

	resp, err := ts.Collection(LINK_COLLECTION).Documents().Import(links, params)
	if err != nil {
		return err
	}

	for _, r := range resp {
		if !r.Success {
			return fmt.Errorf("batch import of docs not successful.")
		}
	}

	return nil
}

// helper functions
func typedString(s string) *string {
	return &s
}

func typedInt(i int) *int {
	return &i
}

func typedBool(b bool) *bool {
	return &b
}
