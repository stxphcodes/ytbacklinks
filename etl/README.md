ETL gets data from youtube, parses for links, and uploads to firestore database.

1. go build
2. ./etl --youtube.key=$(cat ./youtube-api.key) --firestore.creds=$(cat firebase-sa.json) --firestore.projectid=$(cat ./firestore-projectid.txt) --channels.input=$(cat channels.txt)
