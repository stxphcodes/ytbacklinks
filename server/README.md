# Server

Server is the backend behind YoutubeBacklinks. It asssumes an instance of Typesense (search engine) is running and uploads data from Firestore (database) to it every time it restarts. It then starts the server and waits for requests from the frontend. The following are its endpoints:
- `/channel/:channelId`: returns data for a specific channel 
- `/channels/search`: given a search term, search all channels for videos or links with that term
- `/links/search`: given a search term, search all links for that term
- `/videos/search`: given a search term, search all videos for that term 
- `/channel/new`: add a new channel to the ETL
- `/affilliateLink`: given a link, check whether the link is an affiliate link


## Examples

**Search endpoint**

Request: 
``` bash
curl -H "Content-type: application/json" -X POST "http://localhost:8000/links/search" -d '{"ChannelId": "UCqqJQ_cXSat0KIAVfIfKkVA", "Term": "udon"}'
```
Response:
``` json
{"HitCount":4,"TypesenseCount":7,"Term":"udon","VideoIds":["r4L1UqnUScg"],"VideoTitleHits":{"r4L1UqnUScg":{}},"LinkHits":{"r4L1UqnUScg":["aHR0cHM6Ly93d3cuanVzdG9uZWNvb2tib29rLmNvbS9iZWVmLXVkb24v","aHR0cHM6Ly93d3cueW91dHViZS5jb20vd2F0Y2g_dj10V19yM0FrUEJqQQ==","aHR0cHM6Ly93d3cuc2VyaW91c2VhdHMuY29tL2d5dWRvbi1qYXBhbmVzZS1zaW1tZXJlZC1iZWVmLWFuZC1yaWNlLWJvd2wtcmVjaXBl"]}}
```

**Affiliate Link**

Request:
``` bash
curl -H "Content-type: application/json" -X POST "http://localhost:8000/affiliatelink" -d '{"Href": "https://bit.ly/3VEHAG4"}'
```

Response:
``` json
{"Redirects":[{"Href":"https://bit.ly/3VEHAG4","HasRedirect":true,"RedirectType":"301 Redirect"},{"Href":"https://rstyle.me/+3SvPh92KkqE3Y1iVuHAcEQ","HasRedirect":true,"RedirectType":"Meta-Refresh Redirect"},{"Href":"https://www.anrdoezrs.net/click-4441350-13462687?url=https%3A%2F%2Fwww.mytheresa.com%2Fen-us%2Fsaint-laurent-logo-leather-penny-loafers-2391638.html\u0026sid=.MTQ1MTA2LTA.5cface4f-9694-11ed-8c98-c3b0ebad4777","HasRedirect":true,"RedirectType":"301 Redirect"},{"Href":"https://www.mytheresa.com/en-us/saint-laurent-logo-leather-penny-loafers-2391638.html?utm_source=affiliate\u0026utm_medium=affiliate.cj.us\u0026cjevent=5d06924f969411ed8307381f0a82b838\u0026AID=13462687\u0026PID=4441350\u0026SID=.MTQ1MTA2LTA.5cface4f-9694-11ed-8c98-c3b0ebad4777\u0026lpcr=pdptrecoaff","HasRedirect":false,"RedirectType":""}],"RedirectCount":3,"IsAffiliate":"Yes"}
```

## Local development

### Requirements 
See secret requirements in top-level [Readme](../README.md). Docker and go are installed on your local machine.

### Run via binary
1. Build binary: `go build -o ./app`
2. Run binary:
``` golang
./app \
    --typesense.key=abcxyz \ # typesense key 
    --firestore.projectid=$(cat ../secrets/firebase-projectid.txt) \ # path to file containing GCP project id
    --firestore.creds=/config/firebase-sa.json \ # path to GCP service account key
    --github.pat=$GITHUB_PAT \ # github API token
    --force.recreate=true \ # if true, recreate collections in Typesense 
    --skip.firestore=true # if true, skip updating data from firestore
```

### Run via docker-cokmpose 
1. `export GITHUB_PAT=$(cat ../secrets/github.personal.token)`
2. docker-compose up --build


## Development Notes 
- Example search request to Typesense directly: 
`curl -H "X-TYPESENSE-API-KEY:abcxyz" "http://localhost:8108/collections/links/documents/search?q=udon&query_by=Description"`
- typesense docs: https://typesense.org/docs/0.23.1/api/