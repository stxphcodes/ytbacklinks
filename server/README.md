Server accepts search requests from the frontend to query typesense (search engine) with and returns the results back to the UI. The server reuploads data from firestore to typesense every time it restarts.

## Local development

1. docker-compose up --build

## Typesense API

Example search request:
`curl -H "X-TYPESENSE-API-KEY:abcxyz" "http://localhost:8108/collections/links/documents/search?q=udon&query_by=Description"`

Docs:
https://typesense.org/docs/0.23.1/api/
