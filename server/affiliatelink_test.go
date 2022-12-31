package main

import (
	"fmt"
	"testing"
)

func TestGetRedirectURLs(t *testing.T) {
	tests := map[string][]*RedirectURL{
		"https://example.com/": {
			{
				Href:         "https://example.com/",
				HasRedirect:  false,
				RedirectType: "",
			},
		},
		"https://go.magik.ly/ml/1kmph/": {
			{
				Href:         "https://go.magik.ly/ml/1kmph/",
				HasRedirect:  true,
				RedirectType: MetaRedirect,
			},
			{
				Href:         "",
				HasRedirect:  true,
				RedirectType: "301",
			},
		},
		"https://rstyle.me/cz-n/fwqh2sbdpwx": {
			{
				Href:         "https://go.magik.ly/ml/1kmph/",
				HasRedirect:  true,
				RedirectType: MetaRedirect,
			},
			{
				Href:         "",
				HasRedirect:  true,
				RedirectType: "301",
			},
		},
		"https://bit.ly/34SuC1I": {
			{
				Href:         "https://bit.ly/34SuC1I",
				HasRedirect:  true,
				RedirectType: "302",
			},
			{
				Href:         "",
				HasRedirect:  true,
				RedirectType: "301",
			},
		},
		"https://bit.ly/3gIp7VV":        nil,
		"https://go.magik.ly/ml/1olpe/": nil,
	}

	for link := range tests {
		links, err := getRedirects(link, nil)
		if err != nil {
			fmt.Println("this is error")
			fmt.Println(err)
		}

		for _, l := range links {
			fmt.Printf("%+v\n", l)
		}
	}
}
