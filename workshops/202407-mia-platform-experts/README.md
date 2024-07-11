# 2024/07/10 - Mia-Platform Expert office hours meeting

Welcome to this workshop; today we are going to use Rönd to protect a simple application using Mia-Platform Console!

> [!IMPORTANT]
> This workshop requires access to Mia-Platform Console as it has been proposed to the Mia-Platform Expert Office Hour Meeting.
>
> Mia-Platform Expert Program is open to anyone who wants to join, [find out more here][expert-program].

## About the App

Today we are going to protect a simple application that lets you manage a store inventory; it will be connected to a MongoDB cluster for data storage and exposes a few APIs.

The App will be composed of two services:

- [Envoy API Gateway][envoy]: used to expose endpoints
- [CRUD Service][crud]: used to define collections and protected by rönd

Rönd wil be in charge of performing authorization rules protecting the CRUD Service.

### Prepare environment

#### Setup Project workloads

> [!NOTE]
> You should have access to a Project in Mia-Platform Console; if not proceed to [create one][create-project].

##### Services

You need to create the following services, both available in the Mia-Platform Marketplace:

- CRUD Service
- API Gateway Envoy

##### Custom Resources

Optionally we can [setup a few custom resources][create-custom-resource] to help us with the Project Maintenance: a Traefik ingress controller and a kube-green SleepInfo.

###### Traefik IngressRoute

To get access to the Project from the internet we can leverage the Traefik IngressController with the following Custom Resource.

Create the resource from Scratch using the name `ingress` and the manifest below:

<details>
<summary>Manifest to create from Scratch</summary>

```yaml
apiVersion: traefik.containo.us/v1alpha1
kind: IngressRoute
metadata:
  name: ingress
  labels:
    app.kubernetes.io/instance: ingress-controller
spec:
  entryPoints:
    - websecure
  routes:
    - kind: Rule
      match: Host(`{{PROJECT_HOST}}`) # use a Public Variable or change this.
      services:
        - name: api-gateway
          port: 8080
```

</details>

###### kube-green SleepInfo

[kube-green][kube-green] will shut down the deployments in our environment once we are done with the workshop allowing us to prevent unwanted costs and recuding the carbon footprint of your work.

> [!TIP]
> The kube-green SleepInfo custom resource can be found in the Expert marketplace

Create the resource from the marketplace or from scratch by using the name `working-hours` and the manifest below:

<details>
<summary>Manifest to create from Scratch</summary>

```yaml
apiVersion: kube-green.com/v1alpha1
kind: SleepInfo
metadata:
  name: working-hours
spec:
  sleepAt: '19:00'
  timeZone: Europe/Rome
  weekdays: 1-5
```

</details>

### Configure

[expert-program]: https://events.mia-platform.eu/mia-platform-expert-community
[envoy]: https://www.envoyproxy.io
[crud]: https://github.com/mia-platform/crud-service
[kube-green]: https://kube-green.dev
[create-project]: https://docs.mia-platform.eu/docs/console/project-configuration/create-a-project
[create-custom-resource]: https://docs.mia-platform.eu/docs/console/design-your-projects/custom-resources