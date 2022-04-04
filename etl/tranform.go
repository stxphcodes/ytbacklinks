package main

import (
	"bufio"
	"strings"
	"unicode"

	"mvdan.cc/xurls/v2"
)

var (
	socialMediaLinks = [...]string{"instagram", "facebook", "twitter"}
)

type Link struct {
	Href        string
	Brand       string
	Description string
	Category    string
	Tags        []string
	PublishedAt string
	VideoId     string
	VideoTitle  string
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

func snippetsToLinks(snippets map[string]VideoSnippet) ([]*Link, error) {
	var links []*Link

	for videoId, snippet := range snippets {
		// iterate through each line in description
		sc := bufio.NewScanner(strings.NewReader(snippet.Description))
		for sc.Scan() {
			line := sc.Text()
			rxStrict := xurls.Strict()
			url := rxStrict.FindString(line)
			if url == "" {
				continue
			}

			// skip social media links
			isSocial := false
			for _, socialMediaLink := range socialMediaLinks {
				if strings.Contains(url, socialMediaLink) {
					isSocial = true
					break
				}
			}

			if isSocial {
				continue
			}

			// get link description and remove special chars before and after
			description := strings.Split(line, url)[0]
			brand := ""
			if len(strings.Split(description, "-")) == 2 {
				brand = strings.Split(description, "-")[0]
				description = strings.Split(description, "-")[1]
			}

			brand = trimSpecialChars(brand)
			description = trimSpecialChars(description)

			link := &Link{
				VideoId:     videoId,
				VideoTitle:  snippet.Title,
				PublishedAt: snippet.PublishedAt,
				Href:        url,
				Description: description,
				Brand:       brand,
			}

			links = append(links, link)
		}
	}

	return links, nil
}
