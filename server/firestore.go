package main

import (
	"context"

	"cloud.google.com/go/firestore"
)

func getFSLinkCount(ctx context.Context, fs *firestore.Client) (int, error) {
	docs, err := fs.CollectionGroup("links").
		OrderBy("PublishedAt", firestore.Desc).
		Documents(ctx).
		GetAll()
	if err != nil {
		return -1, err
	}

	return len(docs), nil
}

type Link struct {
	Id          string
	Href        string
	Brand       string
	Description string
	Category    string
	PublishedAt string
	VideoId     string
	VideoTitle  string
	ChannelId   string
	LastUpdated string
}

func extractLinksFromFirestore(ctx context.Context, fs *firestore.Client) ([]interface{}, error) {
	docs, err := fs.CollectionGroup("links").
		OrderBy("PublishedAt", firestore.Desc).
		Documents(ctx).
		GetAll()
	if err != nil {
		return nil, err
	}

	var links []interface{}
	for _, doc := range docs {
		var link Link
		if err := doc.DataTo(&link); err != nil {
			return nil, err
		}

		links = append(links, &link)
	}

	return links, nil
}
