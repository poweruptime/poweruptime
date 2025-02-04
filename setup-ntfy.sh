#!/bin/bash

# Use the first parameter as the docker container
if [ -n "$1" ]; then
  CONTAINER="$1"
else
  CONTAINER="poweruptime-ntfy"
fi


# Define the character pool
CHAR_POOL='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{}|;:<>,.?/~`'

# Use the second parameter as the password, or generate a random one if not provided
if [ -n "$2" ]; then
  RANDOM_PASSWORD="$2"
else
  RANDOM_PASSWORD=$(LC_ALL=C tr -dc "$CHAR_POOL" < /dev/urandom | head -c 60)

  # Check for success
  if [ $? -ne 0 ]; then
    echo "Error generating random password"
    exit 1
  fi
fi

# Run the ntfy user add command with the generated or provided password
docker exec -e NTFY_PASSWORD="$RANDOM_PASSWORD" $CONTAINER ntfy user add --role=admin poweruptime

# Print the password for reference
echo "Password: $RANDOM_PASSWORD"
