# Invoke store info
curl localhost:30000/store-info

# Get inventory

## Invocation without login
curl localhost:30000/inventory

## User
curl localhost:30000/inventory \
  -H 'Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiZXRoIiwibmFtZSI6IkplcnJ5IFNtaXRoIiwiaWF0IjoxNTE2MjM5MDIyLCJyb2xlIjoidXNlciJ9.LjI6XBWM0z94eUP0NLiRqlXPSzorsOnJ7J8jPfN-JNc'

## Admin
curl localhost:30000/inventory \
  -H 'Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiZXRoIiwibmFtZSI6IkJldGggU21pdGgiLCJpYXQiOjE1MTYyMzkwMjIsInJvbGUiOiJhZG1pbiJ9.M_Fe4mtcHCDtmd1CEnPgGo2cY-oXGPBXG4RJAUKNlS4'


# Create invetory item
curl -X POST localhost:30000/inventory \
  --data '{"name":"fidget spinner", "sku": 32, "price": 5}'

## User
curl -X POST localhost:30000/inventory \
  --data '{"name":"fidget spinner", "sku": 32, "price": 5}' \
  -H 'content-type: application/json' \
  -H 'Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiZXRoIiwibmFtZSI6IkplcnJ5IFNtaXRoIiwiaWF0IjoxNTE2MjM5MDIyLCJyb2xlIjoidXNlciJ9.LjI6XBWM0z94eUP0NLiRqlXPSzorsOnJ7J8jPfN-JNc'

## Admin
curl -X POST localhost:30000/inventory \
  --data '{"name":"fidget spinner", "sku": 32, "price": 5}' \
  -H 'content-type: application/json' \
  -H 'Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiZXRoIiwibmFtZSI6IkJldGggU21pdGgiLCJpYXQiOjE1MTYyMzkwMjIsInJvbGUiOiJhZG1pbiJ9.M_Fe4mtcHCDtmd1CEnPgGo2cY-oXGPBXG4RJAUKNlS4'
