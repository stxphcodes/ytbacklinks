# ETL

ETL gets data from Youtube for the Youtube channles listed in [channels.json](./channels.json), parses every video's description box text for links, and uploads the data to a Google Firestore database. Note: Youtube quota per API token is 10000 units per day (every GET request for video data is 1 unit).


## Local development

### Requirements 
It assumed you have access to a firestore database and a Youtube API token (see top-level [Readme](../README.md) requirements), and Go and Docker are installed on your machine.

### Run locally

1. Go to `etl/` directory and build the binary: `go build`
2. Run the binary:
``` golang
./etl \
   --youtube.key=$(cat ../secrets/youtube-api.key) \ # Youtube API token
   --firestore.creds=../secrets/firebase-sa.json \ # Path to firebase service account token 
   --firestore.projectid=$(cat ../secrets/firestore-projectid.txt) \ # Path to Firebase Project ID 
   --channels.path=channels.json \  # Path to list of channels to parse
   --dry.run=true # Set to true to **skip** uploading to Firestore
```

### Run via Docker

1. export YOUTUBE_KEY=$(cat ../secrets/youtube-api.key)
2. export FIRESTORE_PROJECTID=$(cat ../secrets/firestore-projectid.txt)
3. docker-compose up --build


## Development notes

- How to call Firestore REST API:
  1. export GOOGLE_APPLICATION_CREDENTIALS=$(pwd)/secrets/firebase-sa.json
  2. export PROJECT_ID=$(cat ../secrets/firebase-projectid.txt)
  3. curl "https://firestore.googleapis.com/v1/projects/$PROJECT_ID/databases/(default)/documents/channels"

- How to update channels in production:
  1. Run ETL using Run via Docker method 
  2. Delete existing server workload in GCP via console 
  3. Reapply server: `kubectl apply --kustomize=k8s/server` 
