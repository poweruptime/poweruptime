#!/bin/sh
set -e

NGX_ENV_FILE="./browser/ngx-env.js"

if [ ! -f "$NGX_ENV_FILE" ]; then
  echo "Error: $NGX_ENV_FILE does not exist"
  exit 1
fi

update_property() {
  local key=$1
  local value=$2
  echo "Updating $key → $value"

  # if the quoted key exists, replace its value
  if grep -q "\"$key\"[[:space:]]*:" "$NGX_ENV_FILE"; then
    sed -i \
      "s|\"$key\"[[:space:]]*:[[:space:]]*\"[^\"]*\"|\"$key\": \"$value\"|g" \
      "$NGX_ENV_FILE"
  else
    # otherwise inject it just before the closing brace+semicolon
    sed -i \
      "s|};|  \"$key\": \"$value\",\n};|" \
      "$NGX_ENV_FILE"
  fi
}

[ -n "$API_HOST" ]        && update_property NG_APP_API_HOST "$API_HOST"
[ -n "$HOST" ]            && update_property NG_APP_HOST "$HOST"

echo "----- Contents of $NGX_ENV_FILE -----"
cat "$NGX_ENV_FILE"
echo "-------------------------------------"

exec "$@"
