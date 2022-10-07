# ETL

ETL gets data from youtube, parses for links, and uploads to firestore database.

## Run locally

1. go build
2. ./etl --youtube.key=$(cat ../secrets/youtube-api.key) --firestore.creds=../secrets/firebase-sa.json --firestore.projectid=$(cat ../secrets/firestore-projectid.txt) --channels.path=channels.json --dry.run=true

## Docker

1. export YOUTUBE_KEY=$(cat ../secrets/youtube-api.key)
2. export FIRESTORE_PROJECTID=$(cat ../secrets/firestore-projectid.txt)
3. docker-compose up --build

## Firestore REST API:

1. export GOOGLE_APPLICATION_CREDENTIALS=$(pwd)/secrets/firebase-sa.json
2. curl "https://firestore.googleapis.com/v1/projects/backlinks-81c44/databases/(default)/documents/channels"
