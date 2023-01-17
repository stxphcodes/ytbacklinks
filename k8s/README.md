Kustomize files for deployment

This directory contains the files to deploy the server, an instance of Typesense and the UI to GKE.

## Development Notes:

- When deploying changes to ui, need to regenerate secret for deployment.yaml to succeed.
- How to get `https://` for domain name: https://cloud.google.com/kubernetes-engine/docs/how-to/managed-certs
- Login to kubectl: `gcloud container clusters get-credentials autopilot-cluster-1 --region=us-east1 --project=$PROJECT_ID` 
  - If there's auth errors, run `gcloud auth login` first.
- For INGRESS deployment: don't delete existing. just reapply. if reapply doesn't work, follow stack overflow to redeploy. Might take a few tries. You don't need to go to networking service to define load balancer. the ingress should automatically create one for you, so all you have to do is apply the ingress yaml.
  https://stackoverflow.com/questions/69468736/gke-ingress-cannot-find-service-resource
  - if you get errors about network endpoint groups - you might have to go to the network endpoint group page and delete the ones that have 0 resources allocated.
