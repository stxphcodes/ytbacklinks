package main

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"strconv"

	"github.com/labstack/echo"
	"github.com/typesense/typesense-go/typesense/api"
)

func printLog(s string, data interface{}) {
	bytes, _ := json.Marshal(data)
	log.Println("%s: %s", s, string(bytes))
	return
}

func do(httpClient *http.Client, req *http.Request) (*api.SearchResult, *echo.HTTPError) {
	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, echo.NewHTTPError(resp.StatusCode, err.Error())
	}
	defer resp.Body.Close()

	bytes, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, echo.NewHTTPError(500, string(bytes))
	}

	statusOk := resp.StatusCode >= 200 && resp.StatusCode < 300
	if !statusOk {
		return nil, echo.NewHTTPError(resp.StatusCode, string(bytes))
	}

	var result api.SearchResult
	if err := json.Unmarshal(bytes, &result); err != nil {
		return nil, echo.NewHTTPError(500, err.Error())
	}

	return &result, nil
}

func getAllPages(httpClient *http.Client, req *http.Request, r SearchResult, typesenseCount int) *echo.HTTPError {
	count := typesenseCount / PER_PAGE_RESULTS
	if count == 0 {
		return nil
	}

	if typesenseCount%PER_PAGE_RESULTS > 0 {
		count += 1
	}

	for n := 2; n <= count; n++ {
		q := req.URL.Query()
		q.Add("page", strconv.Itoa(n))
		req.URL.RawQuery = q.Encode()

		result, httpError := do(httpClient, req)
		if httpError != nil {
			return httpError
		}

		r.transformTypesenseResult(result)
	}

	return nil
}

func mapToArray(m map[string]struct{}) []string {
	a := []string{}
	for k := range m {
		a = append(a, k)
	}

	return a
}

func nestedMapToMapArray(n map[string]map[string]struct{}) map[string][]string {
	m := make(map[string][]string)
	for k, v := range n {
		m[k] = mapToArray(v)
	}

	return m
}
