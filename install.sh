#!/usr/bin/env bash
# claude-ui-skills installer
# Usage:
#   ./install.sh                          # all skills -> ~/.agents/skills
#   ./install.sh <target-dir> [skill ...] # e.g. ./install.sh ~/.claude/skills cds-foundation cds-chat
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILLS_SRC="$SCRIPT_DIR/skills"
ALL_SKILLS=(cds-foundation cds-motion cds-components cds-chat cds-media cds-desktop)

TARGET="${1:-$HOME/.agents/skills}"
if [[ "$TARGET" == -* ]]; then TARGET="$HOME/.agents/skills"; fi
shift 2>/dev/null || true
if [ $# -gt 0 ]; then SELECTED=("$@"); else SELECTED=("${ALL_SKILLS[@]}"); fi

mkdir -p "$TARGET"
for skill in "${SELECTED[@]}"; do
  src="$SKILLS_SRC/$skill"
  if [ ! -d "$src" ]; then
    echo "!! unknown skill: $skill (available: ${ALL_SKILLS[*]})" >&2
    exit 1
  fi
  rm -rf "$TARGET/$skill"
  cp -r "$src" "$TARGET/$skill"
  echo "installed $skill -> $TARGET/$skill"
done

echo
echo "done. verify by asking your agent for a 'Claude-style UI'."
echo "tip: $TARGET is discovered by Claude Code (~/.claude/skills), ZCode (~/.zcode/skills) and any ~/.agents/skills client."
