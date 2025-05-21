#!/usr/bin/env bash

# Fancy spinner using braille Unicode characters.
spinner() {
  local spinner_chars=("⠋" "⠙" "⠹" "⠸" "⠼" "⠴" "⠦" "⠧" "⠇" "⠏")
  local i=0

  # Loop while any of the three processes is still running.
  while kill -0 "$detekt_pid"   2>/dev/null \
     || kill -0 "$prettier_pid" 2>/dev/null \
     || kill -0 "$pnpm_pid"     2>/dev/null; do
    printf "\r%s Running detekt, prettier, and web lint..." \
      "${spinner_chars[i]}"
    i=$(( (i + 1) % ${#spinner_chars[@]} ))
    sleep 0.1
  done
  printf "\r"  # Clear spinner line.
}

# Return ANSI color based on exit code: green if 0, red otherwise.
color() {
  if [ "$1" -eq 0 ]; then
    echo -e "\033[32m"
  else
    echo -e "\033[31m"
  fi
}

# Create temporary files to capture output.
detekt_output=$(mktemp)
prettier_output=$(mktemp)
pnpm_output=$(mktemp)

# Start Detekt, Prettier and Web Lint concurrently.
./gradlew detekt            > "$detekt_output"   2>&1 &
detekt_pid=$!
prettier --write .          > "$prettier_output" 2>&1 &
prettier_pid=$!
pnpm -C web lint            > "$pnpm_output"     2>&1 &
pnpm_pid=$!

# Launch the fancy spinner in the background.
spinner & spinner_pid=$!

# Wait for each process to finish.
wait "$detekt_pid";   detekt_exit_code=$?
wait "$prettier_pid"; prettier_exit_code=$?
wait "$pnpm_pid";     pnpm_exit_code=$?

# Stop the spinner.
kill "$spinner_pid" 2>/dev/null
echo ""

# Print Prettier output.
echo -e "\033[1;32mOutput from prettier:\033[0m"
while IFS= read -r line; do
  printf "\033[32m%s\033[0m\n" "$line"
done < "$prettier_output"

# Print Web Lint output.
echo -e "\n\033[1;33mOutput from web lint:\033[0m"
while IFS= read -r line; do
  printf "\033[33m%s\033[0m\n" "$line"
done < "$pnpm_output"

# Print Detekt output.
echo -e "\n\033[1;34mOutput from detekt:\033[0m"
while IFS= read -r line; do
  printf "\033[34m%s\033[0m\n" "$line"
done < "$detekt_output"


# Clean up temporary files.
rm "$detekt_output" "$prettier_output" "$pnpm_output"

# Determine final status messages.
detekt_status="Success"
prettier_status="Success"
pnpm_status="Success"
[ "$detekt_exit_code"   -ne 0 ] && detekt_status="Error (Code: $detekt_exit_code)"
[ "$prettier_exit_code" -ne 0 ] && prettier_status="Error (Code: $prettier_exit_code)"
[ "$pnpm_exit_code"     -ne 0 ] && pnpm_status="Error (Code: $pnpm_exit_code)"

# Print summary.
printf "\nSummary:\n"
printf "  Prettier: $(color "$prettier_exit_code")%s\033[0m\n" \
  "$prettier_status"
printf "  Web Lint: $(color "$pnpm_exit_code")%s\033[0m\n" \
  "$pnpm_status"
printf "  Detekt:   $(color "$detekt_exit_code")%s\033[0m\n" \
  "$detekt_status"
