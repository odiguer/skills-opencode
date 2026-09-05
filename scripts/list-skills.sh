#!/usr/bin/env bash
set -euo pipefail

# Lists skills from skills-manifest.json (the promoted set).
# Pass --all to list every SKILL.md in the repository.

REPO="$(cd "$(dirname "$0")/.." && pwd)"

if [ "${1:-}" = "--all" ]; then
  cd "$REPO"
  find . -name SKILL.md -not -path '*/node_modules/*' | sed 's|^\./||' | sort
else
  jq -r '.skills[]' "$REPO/skills-manifest.json"
fi
