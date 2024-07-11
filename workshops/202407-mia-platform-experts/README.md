# 2024/07/10 - Mia-Platform Expert office hours meeting

Welcome to this workshop; today we are going to use Rönd to protect a simple application using Mia-Platform Console!

> [!IMPORTANT]
> This workshop requires access to Mia-Platform Console as it has been proposed to the Mia-Platform Expert Office Hour Meeting.
>
> Mia-Platform Expert Program is open to anyone who wants to join, [find out more here][expert-program].

## About the App

Today we are going to protect a simple application that lets you manage a store inventory; it will be connected to a MongoDB cluster for data storage and exposes a few APIs.

Rönd will be used to protect such APIs and build our own authorization model.

### Prepare environment

> [!NOTE]
> You should have access to a Project in Mia-Platform Console; if not proceed to [create one][create-project].

This section will briefly guide you in the Project setup by providing information on what resources should be created as a pre-requisite for the workshop.

#### Setup Project workloads

You will need to create the following workloads resources:

- [CRUD Service][crud] (**microservice**): available in the Mia-Platform Marketplace;
- [API Gateway Envoy][envoy] (**microservice**): available in the Mia-Platform Marketplace;
- [kube-green][kube-green] (**custom resource**, *optional*): available in the Mia-Platform Marketplace;
- Traefik IngressRoute (**custom resource**, *optional*): to be created from scratch.

> [!TIP]
> The custom resource are optional but could be useful to maintain the Project, find out more below, skip the next section if you are not interested.

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

### Let's start the Workshop

#### Step 0. Configure the App inventory store data model and API

##### Data model

Our datamodel will be based on the previously created [CRUD Service][crud] as we are going to [create a MongoDB CRUD collection][create-crud-collection].

Let's create the `inventory` collection with the following fields:

- `name` (string): the item name;
- `amountAvailable` (number): available items in stock for this product;
- `sku` (string): stock keeping unit (internal code to identify the product);
- `price` (numbskuer): the item price in any currency.

> [!TIP]
> You can download [this file](./inventory.json) and [import the collection from JSON schema][import-crud] directly in your Project!

##### APIs

For sake of simplicity we are going to expose the CRUD Service endpoints directly,
to do so we have to [create a new Endpoint][create-endpoint]; let's name it `/inventory/` and let it target the `crud-service` we previously created.

With all the preparation and the setup we just made we can deploy our Project and reach it with a simple cUrl:

#### Test step 0

```sh
➜  curl https://my-project-host/v2/inventory/ -i
HTTP/2 200
...

[

]
```

##### What's next?

We are now going to protect our application with Rönd sidecar, our authorization model will be shaped around the following rules:

- users may be logged in, if so they will be feature an `Authorization` header holding a JWT that contains a `role` claim with one of the following values:
  - `admin`: to represent users with administrative privileges;
  - `user`: to represent users that may buy something.
- `admin` user: can do anythihg and view any data;
- a simple `user`: can only view a subset of the inventory data model (`name`, `price` and `amountAvailable`) for any item;
- non-logged user: can only view a subset of the inventory data model (`name`), only for items that are actually available (aka: `amountAvailable > 0`);

> [!WARNING]
> In a real world scenario of course you wouldn't do such thing, you would build a proper authentication flow with proper access tokens, etc...

<br>

> [!NOTE]
> In the examples below we will be using a set of pre-defined JWTs.
>
> To perform requests as an **administrator**:
>
> ```text
> eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiZXRoIiwibmFtZSI6IkJldGggU21pdGgiLCJpYXQiOjE1MTYyMzkwMjIsInJvbGUiOiJhZG1pbiJ9.M_Fe4mtcHCDtmd1CEnPgGo2cY-oXGPBXG4RJAUKNlS4
> ```
>
> To perform requests as a **regular user**, instead:
>
> ```text
> eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiZXRoIiwibmFtZSI6IkplcnJ5IFNtaXRoIiwiaWF0IjoxNTE2MjM5MDIyLCJyb2xlIjoidXNlciJ9.LjI6XBWM0z94eUP0NLiRqlXPSzorsOnJ7J8jPfN-JNc
> ```

#### Step 1. Introduce Rönd

As of now we have published our API to interact with the data model but there is no protection whatsoever.

To protect our APIs we have to [enable Rönd sidecar injection][enable-rond] for the CRUD Service instance we have in our Project!

#### Test step 1

```sh
➜  curl https://my-project-host/v2/inventory/ -i
HTTP/2 403
...

{"error":"error while parsing rowFilter.enabled: strconv.ParseBool: parsing \"\": invalid syntax","message":"The request doesn't match any known API","statusCode":403}                                                   
```

#### Step 2. Generic administrator protection

Let's write our first set of policies to only grant access to the `admin` role.

We have to write a few policies and setup the correct manual routes in order to let admimitrator get inventory information, create new items and delete existing items.

<details>
<summary>policies</summary>

```go
package policies

user_has_role(required_role) {
    authorization_jwt := input.request.headers["Authorization"][0]
    decoded_jwt_data := io.jwt.decode(authorization_jwt)
    decoded_jwt := decoded_jwt_data[1]
    role := decoded_jwt["role"]
    role == required_role
}

allow_create_new_inventory_item {
    user_has_role("admin")
}

allow_delete_inventory_item {
    user_has_role("admin")
}

filter_inventory {
    user_has_role("admin")
    query := data.resources[_]
}
```

</details>

The API we are going to protect are the following:

- `GET /inventory/`: `filter_inventory` (with query generation)
- `POST /inventory/`: `allow_create_new_inventory_item`
- `DELETE /inventory/:id`: `allow_delete_inventory_item`

#### Step 3. Properly filter inventory

In our authorization model we defined that anyone can view the inventory, just with different information. At the moment only administrator can access the whole inventory. Let's address this by udpating the policies with the following ones:


<details>
<summary>policies</summary>

```go
package policies

user_has_role(required_role) {
    authorization_jwt := input.request.headers["Authorization"][0]
    decoded_jwt_data := io.jwt.decode(authorization_jwt)
    decoded_jwt := decoded_jwt_data[1]
    role := decoded_jwt["role"]
    role == required_role
}

allow_create_new_inventory_item {
    user_has_role("admin")
}

allow_delete_inventory_item {
    user_has_role("admin")
}

filter_inventory {
    user_has_role("admin")
    query := data.resources[_]
} {
    user_has_role("user")
    query := data.resources[_]
} {
    unlogged_request
    query := data.resources[_]
    query.amountAvailable > 0
}
```

```diff

filter_inventory {
    user_has_role("admin")
    query := data.resources[_]
+} {
+    user_has_role("user")
+    query := data.resources[_]
+} {
+    unlogged_request
+    query := data.resources[_]
+    query.amountAvailable > 0
}
```

</details>


---

[expert-program]: https://events.mia-platform.eu/mia-platform-expert-community
[envoy]: https://www.envoyproxy.io
[crud]: https://github.com/mia-platform/crud-service
[kube-green]: https://kube-green.dev
[create-project]: https://docs.mia-platform.eu/docs/console/project-configuration/create-a-project
[create-custom-resource]: https://docs.mia-platform.eu/docs/console/design-your-projects/custom-resources
[create-crud-collection]: https://docs.mia-platform.eu/docs/development_suite/api-console/api-design/crud_advanced
[create-endpoint]: https://docs.mia-platform.eu/docs/development_suite/api-console/api-design/endpoints
[import-crud]: https://docs.mia-platform.eu/docs/development_suite/api-console/api-design/crud_advanced#how-to-create-the-fields-of-your-crud-by-importing-a-json
[enable-rond]: https://docs.mia-platform.eu/docs/console/tutorials/protect-your-endpoints-with-policies#enable-r%C3%B6nd
