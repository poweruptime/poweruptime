#!/bin/bash

set -e
shopt -s nullglob

version="$1"
if [[ -z "$version" ]]; then
    echo "Usage: $0 <version>"
    exit 1
fi

output_dir="./dist/binaries"
mkdir -p "$output_dir"

found=0
for folder in ./dist/pu_*; do
    if [[ -d "$folder" && -f "$folder/pu" ]]; then
        temp="${folder##*/pu_}"
        os="${temp%%_*}"
        temp="${temp#${os}_}"
        arch="${temp%_v*}"

        dest_file="$output_dir/pu-${version}-${os}-${arch}"
        cp "$folder/pu" "$dest_file"
        chmod +x "$dest_file"

        echo "✓ $dest_file"
        found=1
    fi
done

if [[ "$found" -eq 0 ]]; then
  echo "No CLI artifacts found in ./dist/pu_*" >&2
  exit 1
fi
