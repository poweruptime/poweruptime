#!/bin/bash
# entrypoint.sh

# Path to your ngx-env.js file
NGX_ENV_FILE="./browser/ngx-env.js"

# Check if the file exists
if [ ! -f "$NGX_ENV_FILE" ]; then
  echo "Error: $NGX_ENV_FILE does not exist"
  exit 1
fi

# Function to update a property in the NGX_ENV object
update_property() {
  local key=$1
  local value=$2

  echo "Updating $key to $value"

  # Check if the property already exists in the file
  if grep -q "\\b${key}:" "$NGX_ENV_FILE"; then
    # Replace the existing property value
    sed -i "s|${key}: \"[^\"]*\"|${key}: \"${value}\"|g" "$NGX_ENV_FILE"
  else
    # Add new property before the closing brace
    sed -i "s|}|  ${key}: \"${value}\",\n}|" "$NGX_ENV_FILE"
  fi
}

# Manually map specific environment variables to NGX_ENV properties
if [ ! -z "$HOST" ]; then
  update_property "NG_APP_HOST" "$HOST"
fi

if [ ! -z "$API_HOST" ]; then
  update_property "NG_APP_API_HOST" "$API_HOST"
fi

# Execute the original command
exec "$@"
