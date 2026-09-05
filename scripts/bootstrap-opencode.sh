#!/usr/bin/env bash
set -euo pipefail

# Bootstraps this skills repo for local opencode development.
# Reads skills-manifest.json and symlinks the promoted skills into
# .opencode/skills/ so opencode loads only the curated set.

REPO="$(cd "$(dirname "$0")/.." && pwd)"
MANIFEST="$REPO/skills-manifest.json"
DEST="$REPO/.opencode/skills"

if [ ! -f "$MANIFEST" ]; then
  echo "error: $MANIFEST not found" >&2
  exit 1
fi

mkdir -p "$DEST"

# Read skill paths from manifest and symlink each one.
jq -r '.skills[]' "$MANIFEST" | while IFS= read -r skill_path; do
  src="$REPO/skills/$skill_path"
  name="$(basename "$skill_path")"
  target="$DEST/$name"

  if [ ! -d "$src" ]; then
    echo "error: skill directory not found: $src" >&2
    exit 1
  fi

  if [ -e "$target" ] && [ ! -L "$target" ]; then
    rm -rf "$target"
  fi

  ln -sfn "$src" "$target"
  echo "linked $name -> $src"
done

echo "opencode skills bootstrapped in $DEST"
echo "Restart opencode for changes to take effect."
