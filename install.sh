#!/bin/bash
# Installs the Power Couple skills into ~/.claude/skills (Claude Code) and their script dependencies.
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
mkdir -p ~/.claude/skills
for s in "$HERE"/skills/*/; do
  n=$(basename "$s"); rm -rf ~/.claude/skills/"$n"; cp -R "$s" ~/.claude/skills/"$n"
  if [ -f ~/.claude/skills/"$n"/scripts/package.json ]; then (cd ~/.claude/skills/"$n"/scripts && npm install --silent --no-audit --no-fund); fi
  echo "✅ $n"
done
command -v ffmpeg >/dev/null || echo "⚠️  ffmpeg לא מותקן – נדרש לסרטונים (brew install ffmpeg)"
[ -d "/Applications/Google Chrome.app" ] || echo "⚠️  Google Chrome לא נמצא – נדרש לתמונות ולכתוביות"
echo "סיום. פתחו Claude Code מחדש כדי שהסקילים ייטענו."
