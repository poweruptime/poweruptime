#!/usr/bin/env bash

# Fancy spinner using braille Unicode characters.
spinner() {
  local spinner_chars=("⠋" "⠙" "⠹" "⠸" "⠼" "⠴" "⠦" "⠧" "⠇" "⠏")
  local i=0
  # Loop while either process is still running.
  while kill -0 "$detekt_pid" 2>/dev/null || kill -0 "$prettier_pid" 2>/dev/null; do
    printf "\r%s Running detekt and prettier..." "${spinner_chars[i]}"
    i=$(( (i + 1) % ${#spinner_chars[@]} ))
    sleep 0.1
  done
  printf "\r"  # Clear spinner line.
}

# Return color based on exit code.
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

# Start Detekt and Prettier concurrently.
./gradlew detekt > "$detekt_output" 2>&1 &
detekt_pid=$!

prettier --write . > "$prettier_output" 2>&1 &
prettier_pid=$!

# Launch the fancy spinner in the background.
spinner & spinner_pid=$!

# Wait for both processes to complete.
wait "$detekt_pid"
detekt_exit_code=$?
wait "$prettier_pid"
prettier_exit_code=$?

# Stop the spinner.
kill "$spinner_pid" 2>/dev/null
echo ""

# Print Prettier output first.
echo -e "\033[1;32mOutput from prettier:\033[0m"
while IFS= read -r line; do
  printf "\033[32m%s\033[0m\n" "$line"
done < "$prettier_output"

printf "\n\n"

# Then print Detekt output.
echo -e "\033[1;34mOutput from detekt:\033[0m"
while IFS= read -r line; do
  printf "\033[34m%s\033[0m\n" "$line"
done < "$detekt_output"

# Clean up temporary output files.
rm "$detekt_output" "$prettier_output"

# Determine success or error messages.
detekt_status="Success"
prettier_status="Success"
if [ "$detekt_exit_code" -ne 0 ]; then
  detekt_status="Error (Code: $detekt_exit_code)"
fi
if [ "$prettier_exit_code" -ne 0 ]; then
  prettier_status="Error (Code: $prettier_exit_code)"
fi

# Print final summary.
printf "\n\nSummary:\n"
printf "  Prettier: $(color "$prettier_exit_code")%s\033[0m\n" "$prettier_status"
printf "  Detekt: $(color "$detekt_exit_code")%s\033[0m\n" "$detekt_status"
