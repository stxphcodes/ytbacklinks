ETL gets data from youtube, parses for links, and uploads to firestore database.

1. go build
2. ./etl --youtube.key=$(cat ../secrets/youtube-api.key) --firestore.creds=$(cat ../secrets/firebase-sa.json) --firestore.projectid=$(cat ../secrets/firestore-projectid.txt) --channels.input=$(cat channels.txt)
