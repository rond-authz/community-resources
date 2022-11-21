# Rönd Workshop KCD UK

Welcome to this workshop; today we are going to use Rönd to protect a simple application!

## About the App

Today we are going to protect a simple Node.js application that lets you manage a store inventory; it is connected to a local MongoDB instance for data storage and exposes a few APIs:

- `GET /store-info`: returns generic store information
- `GET /inventory`: returns a list of available inventory items
- `POST /inventory`: lets you add a new inventory item
- `DELETE /inventory`: lets you delete an inventory item by its name

### What is an item?

Each inventory item has three fields:

 - `name`: the item name (of course)
 - `sku`: stock keeping unit (the amount of such item in stock)
 - `price`: the price for the item

### What do want to obtain?

- `GET /store-info`: publicly available, returns some info.
- `GET /inventory`: publicly available, returns available items in your database; the behaviour changes based on the user privileges.
- `POST /inventory`: only accessible by admin users, lets you add new items in your database.
- `DELETE /inventory`: only accessible by admin users, lets you delete items from your database.

Please note that there is currently [limited support on policy for response flow](https://github.com/rond-authz/rond/issues/113), therefore the `GET /inventory` API will return limited data only with the Kubernetes setup.

## Workshop walkthrough

### Step 1 - Application

To start the workshop checkout the branch first branch with:

```sh
git checkout workshops/202211-KCD-UK-step1
```

In this step a simple Node.js application can be executed in your environment; this application has no security protection in place so all the APIs are publicly accessible by anyone.

#### TODO

In order to protect it let's install Rönd!

 - configure Rönd as a sidecar (or standalone for docker-compose setup)
 - prepare _policies_ and _OAS_ file
 - make sure the application has proper environment variables (specifically for standalone setup `DOCKER_COMPOSE_MODE` and `ROND_STANDALONE_URL` are required!)
 - test your APIs, every one of them should result in a 403; Rönd is successfully blocking all the APIs.

### Step 2 - Protect API accesses

```sh
git checkout workshops/202211-KCD-UK-step2
```

Now that Rönd is blocking APIs we need to open the ones we need based on our requirements.

#### TODO
 
  - make `GET /store-info` publicly available
    - verify it is available even without the `Authorization` header.
  - make `POST /inventory` available to administrators
    - verify only administrator user can access the API
  - make `DELETE /inventory` available to administrators
    - verify only administrator user can access the API

### Step 3 - Protect data accesses

Now that we have protected the majority of the APIs lets focus on the `GET /inventory` and how to protect data with Rönd!

```sh
git checkout workshops/202211-KCD-UK-step3
```

#### TODO

  - make `GET /inventory` publicly available but behaving differently based on the user:
      - administrator user can see all the items
      - logged users can only see items with `sku > 0` and have visiblity only for name and price
      - non logged users can only see items with `sku > 0` and have visiblity only for name

## Environment requirements and available setup

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

To invoke the APIs there is a [Postman collection](./postman_collection.json) available in the repository but use whatever client you wish.

### Available users

To test APIs with different user privileges two JWT are available, one for an Administrator user, the other one for a regular logged user.

To perform requests as an **Administrator** use the following JWT:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiZXRoIiwibmFtZSI6IkJldGggU21pdGgiLCJpYXQiOjE1MTYyMzkwMjIsInJvbGUiOiJhZG1pbiJ9.M_Fe4mtcHCDtmd1CEnPgGo2cY-oXGPBXG4RJAUKNlS4
```

To perform requests as a **regular User** use this JWT, instead:

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
