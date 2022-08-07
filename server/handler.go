package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"

	"github.com/labstack/echo"
	"github.com/typesense/typesense-go/typesense"
	"github.com/typesense/typesense-go/typesense/api"
)

func SearchHandler(ts *typesense.Client, cfg *Config) echo.HandlerFunc {
	return func(ctx echo.Context) error {
		fmt.Println("in line 16")
		queryParams := ctx.Request().URL.Query()
		searchTerm := queryParams.Get("q")
		if searchTerm == "" {
			return fmt.Errorf("need to provide search term value")
		}

		fmt.Println("these are search terms")
		fmt.Println(searchTerm)

		req, err := http.NewRequest("GET", cfg.Typesense.URL, nil)
		if err != nil {
			return err
		}
		req.Header.Add("X-TYPESENSE-API-KEY", cfg.Typesense.ApiKey)
		req.URL.Path = "/collections/links/documents/search"

		q := req.URL.Query()
		q.Add("q", searchTerm)
		q.Add("query_by", "Brand,Description,Href,VideoTitle")
		q.Add("infix", "always,always,always,always")

		req.URL.RawQuery = q.Encode()

		httpClient := &http.Client{}
		resp, err := httpClient.Do(req)
		if err != nil {
			return err
		}
		defer resp.Body.Close()

		bytes, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			return err
		}

		statusOk := resp.StatusCode >= 200 && resp.StatusCode < 300
		if !statusOk {
			return fmt.Errorf("there was error in the response %s", string(bytes))
		}

		fmt.Println("this was bytes")
		fmt.Println(string(bytes))

		var res api.SearchResult
		if err := json.Unmarshal(bytes, &res); err != nil {
			return err
		}

		fmt.Println("num of docs found")
		fmt.Println(*res.Found)

		for _, hit := range *res.Hits {
			fmt.Println("this is hit")
			fmt.Println(*hit.Document)
		}

		return nil
	}
}

// func testQuery(ts *typesense.Client, cfg *Config) error {
// 	client := &http.Client{}
// 	req, err := http.NewRequest("GET", cfg.Typesense.URL, nil)
// 	if err != nil {
// 		return err
// 	}
// 	req.Header.Add("X-TYPESENSE-API-KEY", cfg.Typesense.ApiKey)
// 	req.URL.Path = "/collections/links/documents/search"

// 	q := req.URL.Query()
// 	q.Add("q", "nytime")
// 	q.Add("query_by", "Brand,Description,Href,VideoTitle")
// 	q.Add("infix", "always,always,always,always")

// 	req.URL.RawQuery = q.Encode()

// 	resp, err := client.Do(req)
// 	if err != nil {
// 		return err
// 	}
// 	defer resp.Body.Close()

// 	bytes, err := ioutil.ReadAll(resp.Body)
// 	if err != nil {
// 		return err
// 	}

// 	statusOk := resp.StatusCode >= 200 && resp.StatusCode < 300
// 	if !statusOk {
// 		return fmt.Errorf("there was error in the response %s", string(bytes))
// 	}

// 	fmt.Println("this was bytes")
// 	fmt.Println(string(bytes))

// 	var res api.SearchResult
// 	if err := json.Unmarshal(bytes, &res); err != nil {
// 		return err
// 	}

// 	// searchParams := &api.SearchCollectionParams{
// 	// 	Q:       "cookbook",
// 	// 	QueryBy: "Brand,Description,Href,VideoTitle",
// 	// }

// 	// res, err := ts.Collection("links").Documents().Search(searchParams)
// 	// if err != nil {
// 	// 	return err
// 	// }

// 	fmt.Println("num of docs found")
// 	fmt.Println(*res.Found)

// 	for _, hit := range *res.Hits {
// 		fmt.Println("this is hit")
// 		fmt.Println(*hit.Document)
// 	}

// 	return nil
// }
