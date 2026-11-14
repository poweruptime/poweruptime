#!/usr/bin/env bash
set -euo pipefail

source_file=${1:?Usage: extractLatestChangelog.sh <changelog> <version>}
version=${2:?Usage: extractLatestChangelog.sh <changelog> <version>}

# Match a whole release heading, accepting dated historical entries too.
# Write atomically so a missing or empty entry cannot publish stale notes.
tmp_file=$(mktemp)
trap 'rm -f "$tmp_file"' EXIT
awk -v version="$version" '
  /^## / {
    if (found) exit
    if ($0 == "## " version || ($2 == version && $3 == "-" && $4 ~ /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/ && NF == 4)) {
      found = 1
    }
    next
  }
  found { print; if (NF) content = 1 }
  END { if (!found || !content) exit 1 }
' "$source_file" > "$tmp_file"
mv "$tmp_file" RELEASE_CHANGELOG.md
