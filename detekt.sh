#!/usr/bin/env bash

# Fancy spinner using braille Unicode characters
spinner() {
  local spinner_chars=("⠋" "⠙" "⠹" "⠸" "⠼" "⠴" "⠦" "⠧" "⠇" "⠏")
  local i=0
  local pids=("${!1}")   # array ref trick for bash 3
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

# Define tools: (name|color|command...)
tools=(
  "Prettier|green|prettier --write ."
  "eslint|yellow|pnpm -C web lint"
  "Detekt|cyan|./gradlew detekt"
)

names=()
colors=()
outputs=()
pids=()
exit_codes=()

# Start all tools
for tool in "${tools[@]}"; do
  name=${tool%%|*}
  rest=${tool#*|}
  color=${rest%%|*}
  cmd=${rest#*|}

  names+=("$name")
  colors+=("$(ansi_color "$color")")

  output=$(mktemp)
  outputs+=("$output")

  eval "$cmd" >"$output" 2>&1 &
  pids+=($!)
done

# Run spinner
spinner pids[@] names[@] colors[@] & spinner_pid=$!

# Wait for each process
for idx in "${!pids[@]}"; do
  wait "${pids[$idx]}"
  exit_codes[$idx]=$?
done

kill "$spinner_pid" 2>/dev/null
echo ""

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
  if [ "$code" -eq 0 ]; then
    printf "  %s: \033[32mSuccess\033[0m\n" "$name"
  else
    printf "  %s: \033[31mError (Code: %d)\033[0m\n" "$name" "$code"
  fi
done
