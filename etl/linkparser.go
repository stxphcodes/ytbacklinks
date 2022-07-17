package main

import (
	"bufio"
	"encoding/base64"
	"strings"
	"time"
	"unicode"

	"mvdan.cc/xurls"
)

// parseVideoDescription parses for all links in a video description box.
func parseVideoDescription(video *Video) (map[string]*Link, error) {
	links := make(map[string]*Link)

	// iterate through each line in description
	sc := bufio.NewScanner(strings.NewReader(video.Description))

	previousLine := ""
	for sc.Scan() {
		line := sc.Text()

		rawUrl, ok := getLinkUrl(line)
		if !ok {
			previousLine = line
			continue
		}

		description, brand := getLinkDescriptionAndBrand(previousLine, line, rawUrl)
		encodedUrl := base64.URLEncoding.EncodeToString([]byte(rawUrl))

		link := &Link{
			Id:          encodedUrl,
			Category:    getLinkCategory(rawUrl),
			ChannelId:   video.ChannelId,
			VideoId:     video.Id,
			VideoTitle:  video.Title,
			PublishedAt: video.PublishedAt,
			Href:        rawUrl,
			Description: description,
			Brand:       brand,
			LastUpdated: time.Now().Format(time.RFC3339),
		}

		links[link.Id] = link
		previousLine = line
	}

	return links, nil
}

// getLinkDescriptionAndBrand parses a line from the video
// description that contains a URL. It looks for text before
// or after the URL, and returns it as the description of the link.
// Optionally, it also returns a brand if it can find one.
func getLinkDescriptionAndBrand(previousLine, line, url string) (description string, brand string) {
	previousLine = trimSpecialChars(previousLine)
	line = trimSpecialChars(line)
	url = trimSpecialChars(url)

	// if the current line only contains the url, use the
	// previous line for link description. example:
	// previousLine = 'some description for link'
	// line         = 'https://example.com'
	if line == url {
		// previous line is blank or too long to contain link description
		if len(previousLine) > 102 || previousLine == "" {
			return line, ""
		}

		description = previousLine
	} else {
		// current line contains the link description and URL.
		// trim the URL to only get the link description. example:
		// line = 'some description for link https://example.com'
		switch true {
		case strings.HasPrefix(line, url):
			description = strings.TrimPrefix(line, url)

		case strings.HasSuffix(line, url):
			description = strings.TrimSuffix(line, url)

		default:
			return line, ""
		}
	}

	description = trimSpecialChars(description)

	// See if the description is brand and/or product info.
	brandProductDelim := []string{"- ", ":", "by"}
	for _, delim := range brandProductDelim {
		splitLineText := strings.Split(description, delim)
		if len(splitLineText) <= 1 {
			continue
		}

		switch delim {
		case "- ", ":":
			// example:
			// 'brand name - product description'
			// 'brand name: product description'
			brand = splitLineText[0]
			product := splitLineText[1]
			return trimSpecialChars(product), trimSpecialChars(brand)

		case "by":
			// example:
			// 'product description by brand name'
			product := splitLineText[0]
			brand = splitLineText[1]
			return trimSpecialChars(product), trimSpecialChars(brand)
		}
	}

	return description, ""
}

func getLinkUrl(line string) (string, bool) {
	rawUrl := xurls.Strict.FindString(line)
	if rawUrl == "" {
		return "", false
	}

	return rawUrl, true
}

func getLinkCategory(url string) string {
	var (
		socialMediaLinks = [...]string{"instagram", "facebook", "twitter"}
		musicLinks       = [...]string{"spotify"}
	)

	for _, l := range socialMediaLinks {
		if strings.Contains(url, l) {
			return "social media"
		}
	}

	for _, l := range musicLinks {
		if strings.Contains(url, l) {
			return "music"
		}
	}

	return ""
}

func trimSpecialChars(s string) string {
	s = strings.TrimLeftFunc(s, func(r rune) bool {
		return !unicode.IsLetter(r) && !unicode.IsNumber(r)
	})

	s = strings.TrimRightFunc(s, func(r rune) bool {
		if r == ')' {
			return false
		}

		return !unicode.IsLetter(r) && !unicode.IsNumber(r)
	})

	return s
}
