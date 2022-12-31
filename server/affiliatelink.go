package main

import (
	"io/ioutil"
	"net/http"
	"strings"

	"github.com/PuerkitoBio/goquery"
)

const (
	UserAgent      = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_5) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.64 Safari/537.11`
	MetaRedirect   = "Meta-Refresh Redirect"
	ServerRedirect = "Server side redirect"
)

type AffiliateLink struct {
	Redirects     []*RedirectURL
	RedirectCount int
	IsAffiliate   string
}

type RedirectURL struct {
	Href         string
	HasRedirect  bool
	RedirectType string
}

func getAffiliateLink(href string) (*AffiliateLink, error) {
	redirects, err := getRedirects(href, nil)
	if err != nil {
		return nil, err
	}

	a := &AffiliateLink{
		Redirects:     redirects,
		RedirectCount: len(redirects) - 1,
	}

	if a.RedirectCount == 0 {
		a.IsAffiliate = "No"
		return a, nil
	}

	lastHref := strings.ToLower(a.Redirects[len(redirects)-1].Href)
	if strings.Contains(lastHref, "affiliate") || strings.Contains(lastHref, "campaign") {
		a.IsAffiliate = "Yes"
		return a, nil
	}

	if a.RedirectCount == 1 {
		a.IsAffiliate = "Most likely not"
		return a, nil
	}

	a.IsAffiliate = "Most likely"
	return a, nil
}

func getRedirects(href string, redirects []*RedirectURL) ([]*RedirectURL, error) {
	req, _ := http.NewRequest("GET", href, nil)
	req.Header.Add("User-Agent", UserAgent)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var (
		redirectHref string
		redirectType string
	)

	refreshHeader, hasRefreshHeader := resp.Header[http.CanonicalHeaderKey("refresh")]
	switch {
	case resp.Request.URL.String() != href:
		redirectHref = resp.Request.URL.String()
		redirectType = "301 Redirect"

	case resp.StatusCode == http.StatusFound:
		fallthrough

	case resp.StatusCode == http.StatusMovedPermanently:
		location, err := resp.Location()
		if err != nil {
			return nil, err
		}
		redirectHref = location.String()
		redirectType = resp.Status

	// Rediret occurs client side.
	case hasRefreshHeader:
		str := strings.SplitAfterN(refreshHeader[0], "url=", 2)
		if len(str) == 1 {
			str = strings.SplitAfterN(refreshHeader[0], "URL=", 2)
			if len(str) == 1 {
				str = strings.SplitAfterN(refreshHeader[0], "Url=", 2)
			}
		}

		if len(str) > 1 {
			redirectHref = str[1]
			redirectType = MetaRedirect
		}

	// Get redirect URL from client-side html code.
	// Looks like:  <meta http-equiv="refresh" content="4; URL='https://ahrefs.com/blog/301-redirects/'" />
	default:
		bytes, _ := ioutil.ReadAll(resp.Body)
		strbytes := string(bytes)

		if !strings.Contains(strbytes, "http-equiv") ||
			!strings.Contains(strbytes, "refresh") {
			break
		}

		doc, err := goquery.NewDocumentFromReader(strings.NewReader(strbytes))
		if err != nil {
			return nil, err
		}

		doc.Find("meta").Each(func(i int, s *goquery.Selection) {
			refresh, ok := s.Attr("http-equiv")
			if !ok || refresh != "refresh" {
				return
			}

			description, _ := s.Attr("content")
			redirectHref = strings.SplitAfterN(description, "url=", 2)[1]
			redirectType = MetaRedirect
		})
	}

	if redirectHref != "" && redirectType != "" {
		return getRedirects(
			redirectHref,
			append(redirects, &RedirectURL{
				Href:         href,
				HasRedirect:  true,
				RedirectType: redirectType,
			}),
		)
	}

	return append(redirects, &RedirectURL{Href: href}), nil
}
