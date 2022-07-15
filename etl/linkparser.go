package main

import (
	"strings"
	"unicode"

	"mvdan.cc/xurls"
)

func getLinkUrl(line string) (string, bool) {
	rawUrl := xurls.Strict.FindString(line)
	if rawUrl == "" {
		return "", false
	}

	return rawUrl, true
}

// get link description and remove special chars before and after
func getLinkDescriptionAndBrand(line, url string) (string, string) {
	description := strings.Split(line, url)[0]
	brand := ""
	if len(strings.Split(description, "-")) == 2 {
		brand = strings.Split(description, "-")[0]
		description = strings.Split(description, "-")[1]
	}

	brand = trimSpecialChars(brand)
	description = trimSpecialChars(description)

	return description, brand
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
