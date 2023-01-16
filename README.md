# YoutubeBackinks 

A web app to view and search for discount codes, product links and full video description box text of Youtube videos from popular Youtubers. See https://youtubebacklinks.com .

This repo comprises of:
- `etl/`: parses data from Youtube API to upload to database 
- `k8s/`: kustomize files used to deploy site
- `secrets/`: (empty) store secrets used for local development
- `server/`: creates the backend behind YoutubeBacklinks
- `ui/`: creates the frontend for YoutubeBacklinks

Each subdirectory has its own README with more information. 

## Local development

### Requirements
To build and run YoutubeBacklinks locally, you need the following:
1. Clone this repo and have docker installed
2. A GCP account and a GCP project created. See https://console.cloud.google.com
3. Under IAM & Admin, create a service account with Firebase Admin SDK rights. 
4. Create an API key to use with the Youtube API. See 
5. Under the `secrets/` subdirectory, create the following files:
    - `firebase-projectid.txt`: Enter GCP Project ID from step 1 
    - `firebase-sa.json`: Go to the service account created in step 2 and download JSON key. Rename the file to firebase-sa.json. 
    - `youtube-api.key`: Enter API key value from step 3


### Running locally for the first time
1. Run the ETL to populate your Firestore database: `cd etl && docker-compose up --build` 
2. Start the server: `cd server && docker-compose up --build` 
3. Start the ui: `cd ui && docker-compose up --build`  

### Running locally subsequently
1. No need to run the ETL unless you want updated data 
2. Use `docker-compose up` to skip re-building the image 
