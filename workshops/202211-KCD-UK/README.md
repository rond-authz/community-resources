# Rönd Workshop KCD UK

Welcome to this workshop; today we are going to use Rönd to protect a simple application!

## Environment requirements

### Kubernetes setup with Kind

Create your cluster

```sh
$ kind create cluster --name=rond-kcduk --config ./kubefiles/kind.config.yaml
```
Run the application

```sh
sh ./kubefiles/boot.sh
```

Note: you can run this script whenever you have done some changes and want to deploy them in your cluster
