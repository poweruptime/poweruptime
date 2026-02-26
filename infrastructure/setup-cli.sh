#!/bin/bash
set -e

REPO="poweruptime/poweruptime"
VERSION_FILE="versions.env"

if [ ! -f "$VERSION_FILE" ]; then
    echo "Error: $VERSION_FILE not found."
    exit 1
fi

# Extract version from version.env
# Format: POWERUPTIME_VERSION="0.5.0-beta-..."
VERSION=$(grep -E '^POWERUPTIME_VERSION=' "$VERSION_FILE" | cut -d= -f2- | tr -d '"')

if [ -z "$VERSION" ]; then
    echo "Error: Could not determine version from $VERSION_FILE"
    exit 1
fi

OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

if [ "$ARCH" == "x86_64" ]; then
    ARCH="amd64"
elif [ "$ARCH" == "aarch64" ]; then
    ARCH="arm64"
fi



# Create or recreate cli directory
if [ -d "cli" ]; then
    rm -rf cli
fi
mkdir cli

# Asset name on GitHub (based on original script)
ASSET_NAME="pu-v${VERSION}-${OS}-${ARCH}"
URL="https://github.com/${REPO}/releases/download/v${VERSION}/${ASSET_NAME}"

TARGET_FILE="cli/${ASSET_NAME}"

echo "Downloading CLI version $VERSION for $OS/$ARCH..."
echo "URL: $URL"

curl -fL -o "$TARGET_FILE" "$URL"
chmod +x "$TARGET_FILE"

# Create symlink
# Removing existing pu file/link if it exists
if [ -e "pu" ] || [ -L "pu" ]; then
    rm -f pu
fi

# Symlink relative to the current directory
ln -s "$TARGET_FILE" pu

echo "Successfully setup 'pu'. Run with ./pu"

