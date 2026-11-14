#!/usr/bin/env bash
# Run a command in the background so later steps of the same job can continue,
# then wait for it (and surface its output and exit code) in a later step.
#
# Usage:
#   background.sh start <name> <command...>
#   background.sh wait <name>
set -euo pipefail

dir="${RUNNER_TEMP:-/tmp}/background"
mkdir -p "$dir"

case "${1:-}" in
  start)
    name="$2"
    shift 2
    # Detach all standard streams, otherwise the step keeps waiting for the
    # background process to close its output.
    (
      rc=0
      "$@" >"$dir/$name.log" 2>&1 || rc=$?
      echo "$rc" >"$dir/$name.exit"
    ) </dev/null >/dev/null 2>&1 &
    echo "Started '$name' in the background"
    ;;
  wait)
    name="$2"
    timeout="${3:-600}"
    elapsed=0
    while [ ! -f "$dir/$name.exit" ]; do
      if [ "$elapsed" -ge "$timeout" ]; then
        echo "::error::'$name' did not finish within ${timeout}s"
        cat "$dir/$name.log" || true
        exit 1
      fi
      sleep 1
      elapsed=$((elapsed + 1))
    done
    echo "::group::Output of '$name'"
    cat "$dir/$name.log"
    echo "::endgroup::"
    rc="$(cat "$dir/$name.exit")"
    if [ "$rc" -ne 0 ]; then
      echo "::error::'$name' failed with exit code $rc"
    fi
    exit "$rc"
    ;;
  *)
    echo "Usage: $0 start <name> <command...> | wait <name> [timeout-seconds]" >&2
    exit 2
    ;;
esac
