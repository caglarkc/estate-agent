#!/usr/bin/env bash
# Auto commit + push when any tracked-path content changes (Linux: inotifywait).
# Stages the whole repo (git add -A). Ignores heavy dirs in the watcher only;
# .gitignore still controls what Git actually adds.
#
# Optional env:
#   GIT_AUTO_IMMENSE_USE_POLL=1   — poll instead of inotifywait
#   GIT_AUTO_IMMENSE_POLL_INTERVAL=3 — seconds between polls (default 3)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

while ! git rev-parse --is-inside-work-tree >/dev/null 2>&1 && [[ "$(pwd)" != "/" ]]; do
  cd ..
done

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "This script must live inside a git repository."
  exit 1
fi

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

WATCH_ROOT="$REPO_ROOT"

if [[ "${GIT_AUTO_IMMENSE_USE_POLL:-0}" != "1" ]]; then
  if ! command -v inotifywait >/dev/null 2>&1; then
    echo "Missing dependency: inotifywait"
    echo "Install with: sudo apt-get install inotify-tools"
    echo "Or run with: GIT_AUTO_IMMENSE_USE_POLL=1 $(basename "${BASH_SOURCE[0]}")"
    exit 1
  fi
fi

CURRENT_BRANCH="$(git symbolic-ref --quiet --short HEAD 2>/dev/null || true)"
if [[ -z "$CURRENT_BRANCH" ]]; then
  echo "Could not detect current git branch (detached HEAD?)."
  exit 1
fi

if [[ "$CURRENT_BRANCH" != "main" && "$CURRENT_BRANCH" != "master" ]]; then
  echo "Auto-sync is configured for main/master only (current branch: $CURRENT_BRANCH)."
  echo "Switch with: git switch main"
  exit 1
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  echo "Missing git remote 'origin'. Add it first:"
  echo "  git remote add origin <repo-url>"
  exit 1
fi

UPSTREAM_EXISTS="true"
if ! git rev-parse --abbrev-ref --symbolic-full-name "@{u}" >/dev/null 2>&1; then
  UPSTREAM_EXISTS="false"
  echo "No upstream set for '$CURRENT_BRANCH'."
  echo "First successful push will run: git push -u origin $CURRENT_BRANCH"
fi

POLL_INTERVAL="${GIT_AUTO_IMMENSE_POLL_INTERVAL:-3}"

commit_and_push() {
  sleep 1

  git add -A

  if git diff --cached --quiet; then
    return 0
  fi

  COMMIT_MSG="auto: sync $(date '+%Y-%m-%d %H:%M:%S') [$CURRENT_BRANCH]"
  git commit -m "$COMMIT_MSG"

  if [[ "$UPSTREAM_EXISTS" == "true" ]]; then
    git push
  else
    git push -u origin "$CURRENT_BRANCH"
    UPSTREAM_EXISTS="true"
  fi

  echo "Pushed: $COMMIT_MSG"
}

WATCHLIST="$(mktemp)"
trap 'rm -f "$WATCHLIST"' EXIT

write_inotify_watchlist() {
  {
    printf '%s\n' "$WATCH_ROOT"
    find "$WATCH_ROOT" \( -name .git \) -prune -o \( \
      -type d \( \
        -name node_modules -o \
        -name Pods -o \
        -name .gradle -o \ 
        -name .dart_tool -o \
        -name .venv -o \
        -name venv -o \
        -name .next -o \
        -name dist -o \
        -name build -o \
        -name target -o \
        -name __pycache__ \
      \) -print -prune \) | sed 's/^/@/'
  } >"$WATCHLIST"
}

echo "Auto push watcher (full repo): $WATCH_ROOT"
echo "Watcher excludes noisy dirs: node_modules, Pods, build, dist, .venv, .next, …"
echo "Git still honors .gitignore for adds. Press Ctrl+C to stop."

if [[ "${GIT_AUTO_IMMENSE_USE_POLL:-0}" == "1" ]]; then
  echo "Polling every ${POLL_INTERVAL}s (set GIT_AUTO_IMMENSE_POLL_INTERVAL to change)."
  while true; do
    sleep "$POLL_INTERVAL"
    if [[ -z "$(git status --porcelain)" ]]; then
      continue
    fi
    commit_and_push
  done
else
  while true; do
    write_inotify_watchlist
    inotifywait -qq -r \
      -e modify,create,delete,move \
      --fromfile "$WATCHLIST"

    commit_and_push
  done
fi
