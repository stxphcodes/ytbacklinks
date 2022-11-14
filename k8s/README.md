Notes:

- deploying changes to ui: need to regenerate secret for deployment.yaml to succeed.
- getting https:// for domain name: https://cloud.google.com/kubernetes-engine/docs/how-to/managed-certs
- login to kubectl: gcloud container clusters get-credentials autopilot-cluster-1 --region=us-east1 --project=backlinks-81c44
- FOR INGRESS deployment: don't delete existing. just reapply. if reapply doesn't work, follow stack overflow to redeploy. Might take a few tries. You don't need to go to networking service to define load balancer. the ingress should automatically create one for you, so all you have to do is apply the ingress yaml.
  https://stackoverflow.com/questions/69468736/gke-ingress-cannot-find-service-resource
