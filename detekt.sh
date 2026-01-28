#!/usr/bin/env bash

# Fancy spinner using braille Unicode characters
spinner() {
  local spinner_chars=("⠋" "⠙" "⠹" "⠸" "⠼" "⠴" "⠦" "⠧" "⠇" "⠏")
  local i=0
  local pids=("${!1}")
  local names=("${!2}")
  local colors=("${!3}")

  # Build label string with colors
  local label=""
  for idx in "${!names[@]}"; do
    label+="${colors[$idx]}${names[$idx]}\033[0m"
    if [ "$idx" -lt $((${#names[@]} - 1)) ]; then
      label+=", "
    fi
  done

  while :; do
    local alive=false
    for pid in "${pids[@]}"; do
      if kill -0 "$pid" 2>/dev/null; then
        alive=true
        break
      fi
    done
    if [ "$alive" = false ]; then
      break
    fi
    printf "\r%s Running %b..." "${spinner_chars[i]}" "$label"
    i=$(( (i + 1) % ${#spinner_chars[@]} ))
    sleep 0.1
  done
  printf "\r"
}

# Map color name to ANSI escape code
ansi_color() {
  case $1 in
    red)     echo "\033[31m" ;;
    green)   echo "\033[32m" ;;
    yellow)  echo "\033[33m" ;;
    blue)    echo "\033[34m" ;;
    magenta) echo "\033[35m" ;;
    cyan)    echo "\033[36m" ;;
    white)   echo "\033[37m" ;;
    *)       echo "\033[0m"  ;;
  esac
}

# Define tools in two groups
sequential_tools=(
  "eslint|yellow|pnpm -C web lint:fix"
)

parallel_tools=(
  "Prettier|green|pnpm format"
  "Detekt|cyan|./gradlew detekt"
)

names=()
colors=()
outputs=()
pids=()
exit_codes=()
start_times=()
end_times=()

# Run sequential tools first
for tool in "${sequential_tools[@]}"; do
  name=${tool%%|*}
  rest=${tool#*|}
  color=${rest%%|*}
  cmd=${rest#*|}

  names+=("$name")
  colors+=("$(ansi_color "$color")")

  output=$(mktemp)
  outputs+=("$output")

  start_times+=($(date +%s%N))

  eval "$cmd" >"$output" 2>&1 &
  pid=$!
  pids+=($pid)

  # Run spinner for this single process
  spinner_pids=($pid)
  spinner_names=("$name")
  spinner_colors=("$(ansi_color "$color")")
  spinner spinner_pids[@] spinner_names[@] spinner_colors[@] & spinner_pid=$!

  wait "$pid"
  exit_codes+=($?)
  end_times+=($(date +%s%N))

  kill "$spinner_pid" 2>/dev/null
  echo ""
done

# Start parallel tools
parallel_start=${#names[@]}
parallel_pids=()

for tool in "${parallel_tools[@]}"; do
  name=${tool%%|*}
  rest=${tool#*|}
  color=${rest%%|*}
  cmd=${rest#*|}

  names+=("$name")
  colors+=("$(ansi_color "$color")")

  output=$(mktemp)
  outputs+=("$output")

  start_times+=($(date +%s%N))

  eval "$cmd" >"$output" 2>&1 &
  pid=$!
  pids+=($pid)
  parallel_pids+=($pid)
done

# Run spinner for parallel tools
if [ ${#parallel_pids[@]} -gt 0 ]; then
  parallel_names=()
  parallel_colors=()
  for idx in $(seq $parallel_start $((${#names[@]} - 1))); do
    parallel_names+=("${names[$idx]}")
    parallel_colors+=("${colors[$idx]}")
  done
  spinner parallel_pids[@] parallel_names[@] parallel_colors[@] & spinner_pid=$!

  # Wait for parallel processes
  for idx in "${!parallel_pids[@]}"; do
    wait "${parallel_pids[$idx]}"
    exit_codes+=($?)
    end_times+=($(date +%s%N))
  done

  kill "$spinner_pid" 2>/dev/null
  echo ""
fi

# Print outputs with colors
for idx in "${!names[@]}"; do
  echo -e "\033[1mOutput from ${names[$idx]}:\033[0m"
  while IFS= read -r line; do
    printf "%b%s\033[0m\n" "${colors[$idx]}" "$line"
  done <"${outputs[$idx]}"
  echo ""
  rm "${outputs[$idx]}"
done

# Print summary
echo -e "\nSummary:"
for idx in "${!names[@]}"; do
  name=${names[$idx]}
  code=${exit_codes[$idx]}

  duration_ns=$((end_times[$idx] - start_times[$idx]))
  duration_ms=$((duration_ns / 1000000))

  seconds=$((duration_ms / 1000))
  milliseconds=$((duration_ms % 1000))
  time_str=$(printf "%d.%03d" "$seconds" "$milliseconds")

  if [ "$code" -eq 0 ]; then
    printf "  %b%s\033[0m: \033[32mSuccess\033[0m (%ss)\n" \
      "${colors[$idx]}" "$name" "$time_str"
  else
    printf "  %b%s\033[0m: \033[31mError (Code: %d)\033[0m (%ss)\n" \
      "${colors[$idx]}" "$name" "$code" "$time_str"
  fi
done
