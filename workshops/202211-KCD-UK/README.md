# Rönd Workshop KCD UK

Welcome to this workshop; today we are going to use Rönd to protect a simple application!

## Environment requirements

### Kubernetes setup with Kind

Create your cluster

```sh
kind create cluster --name=rond-kcduk --config ./kubefiles/kind.config.yaml
```
Run the application

```sh
sh ./kubefiles/boot.sh
```

Note: you can run this script whenever you have done some changes and want to deploy them in your cluster

```sh
kind delete cluster --name=rond-kcduk
```

By default the kubernetes cluster will be reachable on port `30000`.

### Running with docker compose

Boot the application

```sh
docker-compose -f compose/docker-compose.yaml up
```

Shut down the application with

```sh
docker-compose -f compose/docker-compose.yaml down
```

By default the application running with docker compose will be reachable on port `40000`.

## Invoke APIs

### Available APIs

- `GET /store-info`: publicly available, returns some info.
- `GET /inventory`: publicly available, returns available items in your database; the behaviour changes based on the user privileges.
- `POST /inventory`: only accessible by admin users, lets you add new items in your database.
- `DELETE /inventory`: only accessible by admin users, lets you delete items from your database.

Please note that currently there is [limited support on policy for response flow](https://github.com/rond-authz/rond/issues/113), therefore the `GET /inventory` API will return limited data only with the Kubernetes setup.

### Available users

The following JWT can be used to simulate different users.

To perform requests as an Administrator use the following JWT:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiZXRoIiwibmFtZSI6IkJldGggU21pdGgiLCJpYXQiOjE1MTYyMzkwMjIsInJvbGUiOiJhZG1pbiJ9.M_Fe4mtcHCDtmd1CEnPgGo2cY-oXGPBXG4RJAUKNlS4
```

To perform requests as a regular User use this JWT, instead:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiZXRoIiwibmFtZSI6IkplcnJ5IFNtaXRoIiwiaWF0IjoxNTE2MjM5MDIyLCJyb2xlIjoidXNlciJ9.LjI6XBWM0z94eUP0NLiRqlXPSzorsOnJ7J8jPfN-JNc
```

To provide the JWT simply set the `Authorization` header with the value, for the sake of simplicity the `Bearer` keyword must be omitted; so you simply have to set

```
Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Example requests with cURL

These examples have the default port for the Kubernetes setup, please change it depending on the port you are using to expose your application.

```sh
# Get public inventory
curl localhost:30000/inventory

# Get inventory as a regular user
curl localhost:30000/inventory \
  -H 'Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiZXRoIiwibmFtZSI6IkplcnJ5IFNtaXRoIiwiaWF0IjoxNTE2MjM5MDIyLCJyb2xlIjoidXNlciJ9.LjI6XBWM0z94eUP0NLiRqlXPSzorsOnJ7J8jPfN-JNc'

# Get inventory as an administrator
curl localhost:30000/inventory \
  -H 'Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiZXRoIiwibmFtZSI6IkJldGggU21pdGgiLCJpYXQiOjE1MTYyMzkwMjIsInJvbGUiOiJhZG1pbiJ9.M_Fe4mtcHCDtmd1CEnPgGo2cY-oXGPBXG4RJAUKNlS4'
```

Use the [Postman collection](./postman_collection.json) for further details and examples.
