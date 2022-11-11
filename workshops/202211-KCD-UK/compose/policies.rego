package policies

allow_all {
  true
}

user_has_role(required_role) {
  authorization_jwt := input.request.headers["Authorization"][0]
  decoded_jwt_data := io.jwt.decode(authorization_jwt)
  decoded_jwt := decoded_jwt_data[1]
  role := decoded_jwt["role"]
  role == required_role
}

unlogged_request {
  not input.request.headers["Authorization"]
} {
  count(input.request.headers["Authorization"]) == 0
}

allow_create_new_inventory_item {
  user_has_role("admin")
}

filter_inventory {
  user_has_role("admin")
  query := data.resources[_]
} {
  user_has_role("user")
  query := data.resources[_]
  query.sku > 0
} {
  unlogged_request
  query := data.resources[_]
  query.sku > 0
}

protect_inventory_info [response] {
  user_has_role("admin")
  response := input.response.body
} {
  user_has_role("user")
  inventory_response_list := input.response.body
  result := [new_item |
    item := inventory_response_list[_]
    new_item = object.remove(item, ["sku"])
  ]
  response := result
} {
  unlogged_request
  inventory_response_list := input.response.body
  result := [new_item |
    item := inventory_response_list[_]
    new_item = object.remove(item, ["sku", "price"])
  ]
  response := result
}
