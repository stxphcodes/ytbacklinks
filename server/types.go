package main

import (
	"github.com/typesense/typesense-go/typesense/api"
)

// Firestore types/ Typesense doc types
type Video struct {
	Id           string
	Title        string
	ChannelId    string
	Description  string
	PublishedAt  string
	ThumbnailUrl string
	LastUpdated  string

	PublishedAtInt int64
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

	PublishedAtInt int64
}

type Channel struct {
	Id               string
	Title            string
	Description      string
	Categories       []string
	CustomUrl        string
	UploadPlaylistId string
	ThumbnailUrl     string
	LastUpdated      string
	VideoCount       int
	LinkCount        int

	LastUpdatedInt int64
	VideoCountInt  int64
	LinkCountInt   int64
}

// API search request and responses
type SearchRequest struct {
	ChannelId string `json:"channelId"`
	Term      string `json:"term"`
}

type MainSearchResponse struct {
	LinkSearchResponse *LinkSearchResponse
	VideoSeachResponse *VideoSearchResponse
}

type LinkSearchResponse struct {
	HitCount       int
	TypesenseCount int
	Term           string
	VideoIds       []string
	VideoTitleHits map[string]struct{}
	LinkHits       map[string][]string
}

type VideoSearchResponse struct {
	HitCount             int
	TypesenseCount       int
	Term                 string
	VideoIds             []string
	VideoTitleHits       map[string]struct{}
	VideoDescriptionHits map[string]struct{}
}

type ChannelsResponse struct {
	Count    int
	Channels []interface{}
}

type ChannelResponse struct {
	Channel interface{} // contains fields of the channel struct
	Videos  interface{} // []{Video: {video object}, Links: { link object }}
}

// SearchResult is the intermediary data type
// that transforms typesense result into an API response type.
type SearchResult interface {
	transformTypesenseResult(result *api.SearchResult)
	toResponse(term string) interface{}
}

type LinkSearchResult struct {
	TypesenseCount int
	VideoIds       map[string]struct{}
	LinkHits       map[string]map[string]struct{}
	VideoTitleHits map[string]struct{}
}

type VideoSearchResult struct {
	TypesenseCount       int
	VideoIds             map[string]struct{}
	VideoTitleHits       map[string]struct{}
	VideoDescriptionHits map[string]struct{}
}

type ChannelsResult struct {
	TypesenseCount int
	Channels       []interface{}
}

type ChannelResult struct {
	AppendToLinks bool

	Channel interface{}
	Videos  []interface{}
	Links   []interface{}
}

// Compile time check that LinkSearchResult and
// VideoSearchResult implements SearchResult interface.
var _ SearchResult = &LinkSearchResult{}
var _ SearchResult = &VideoSearchResult{}
