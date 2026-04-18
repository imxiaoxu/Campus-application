#!/usr/bin/env bash

set -euo pipefail

BUILD_DIR="${BUILD_DIR:-dist}"
TARGET_BRANCH="${TARGET_BRANCH:-gitee-pages}"
WORK_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$WORK_DIR"
}

trap cleanup EXIT

if [[ -z "${GITEE_REMOTE:-}" ]]; then
  echo "GITEE_REMOTE is required." >&2
  exit 1
fi

if [[ ! -d "$BUILD_DIR" ]]; then
  echo "Build directory '$BUILD_DIR' does not exist." >&2
  exit 1
fi

cp -R "$BUILD_DIR"/. "$WORK_DIR"/

cd "$WORK_DIR"

git init -b "$TARGET_BRANCH"
git config user.name "${GITEE_GIT_USER_NAME:-github-actions[bot]}"
git config user.email "${GITEE_GIT_USER_EMAIL:-41898282+github-actions[bot]@users.noreply.github.com}"

git add -A

if git diff --cached --quiet; then
  echo "No static files to publish."
  exit 0
fi

git commit -m "Deploy ${GITHUB_SHA:-local-build}"
git remote add origin "$GITEE_REMOTE"
git push --force origin "HEAD:${TARGET_BRANCH}"
