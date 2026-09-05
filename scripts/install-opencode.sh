#!/usr/bin/env bash
set -euo pipefail

# Installs the promoted mattpocock skills into a target project or globally.
#
# Usage:
#   install-opencode.sh [OPTIONS] [TARGET]
#
# Options:
#   -g, --global    Install into ~/.config/opencode/skills/
#   -h, --help      Show this help
#
# Examples:
#   install-opencode.sh
#   install-opencode.sh /path/to/project
#   install-opencode.sh --global

REPO="$(cd "$(dirname "$0")/.." && pwd)"
exec node "$REPO/scripts/install-opencode.js" "$@"
