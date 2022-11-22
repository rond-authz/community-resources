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

allow_delete_inventory_item {
  user_has_role("admin")
}
