# ETL

ETL gets data from youtube, parses for links, and uploads to firestore database.

## Run locally

1. go build
2. ./etl --youtube.key=$(cat ../secrets/youtube-api.key) --firestore.creds=$(cat ../secrets/firebase-sa.json) --firestore.projectid=$(cat ../secrets/firestore-projectid.txt) --channels.input=$(cat channels.txt)

## Firestore REST API:

1. export GOOGLE_APPLICATION_CREDENTIALS=$(pwd)/secrets/firebase-sa.json
2. curl "https://firestore.googleapis.com/v1/projects/backlinks-81c44/databases/(default)/documents/channels"
