# Server

Server is the backend behind YoutubeBacklinks. It asssumes an instance of Typesense (search engine) is running and uploads data from Firestore (database) to it every time it restarts. It then starts the server and waits for requests from the frontend. The following are its endpoints:
- `/channel/:channelId`: returns data for a specific channel 
- `/channels/search`: given a search term, search all channels for videos or links with that term
- `/links/search`: given a search term, search all links for that term
- `/videos/search`: given a search term, search all videos for that term 
- `/channel/new`: add a new channel to the ETL
- `/affilliateLink`: given a link, check whether the link is an affiliate link

## Local development

### Requirements 

### Run via docker-cokmpose 
1. `export GITHUB_PAT=$(cat ../secrets/github.personal.token)`
2. docker-compose up --build

### Example
Request
```
curl -H "Content-type: application/json" -X POST "http://localhost:8000/links/search" -d '{"ChannelId": "UCt7fwAhXDy3oNFTAzF2o8Pw", "Term": "udon"}'
```

Response
```
```

## Development Notes 
- Example search request to Typesense directly: 
`curl -H "X-TYPESENSE-API-KEY:abcxyz" "http://localhost:8108/collections/links/documents/search?q=udon&query_by=Description"`
- typesense docs: https://typesense.org/docs/0.23.1/api/