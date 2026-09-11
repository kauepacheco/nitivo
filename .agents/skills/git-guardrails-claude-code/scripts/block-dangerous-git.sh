#!/bin/bash

INPUT=$(cat)
if ! COMMAND=$(printf '%s' "$INPUT" | python3 -c '
import json, sys
value = json.load(sys.stdin)["tool_input"]["command"]
if not isinstance(value, str):
    raise ValueError("command must be a string")
sys.stdout.write(value)
' 2>/dev/null); then
  echo "BLOCKED: unable to validate hook input." >&2
  exit 2
fi

DANGEROUS_PATTERNS=(
  "git push"
  "git reset --hard"
  "git clean -fd"
  "git clean -f"
  "git branch -D"
  "git checkout \."
  "git restore \."
  "push --force"
  "reset --hard"
)

for pattern in "${DANGEROUS_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qE "$pattern"; then
    echo "BLOCKED: command matches a configured dangerous Git pattern." >&2
    exit 2
  fi
done

exit 0
