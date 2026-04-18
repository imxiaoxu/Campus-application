#!/usr/bin/env bash

set -euo pipefail

BUILD_DIR="${BUILD_DIR:-dist}"
OSS_PREFIX="${OSS_PREFIX:-}"
OSS_DELETE="${OSS_DELETE:-false}"

if [[ -z "${OSS_ACCESS_KEY_ID:-}" ]]; then
  echo "OSS_ACCESS_KEY_ID is required." >&2
  exit 1
fi

if [[ -z "${OSS_ACCESS_KEY_SECRET:-}" ]]; then
  echo "OSS_ACCESS_KEY_SECRET is required." >&2
  exit 1
fi

if [[ -z "${OSS_BUCKET:-}" ]]; then
  echo "OSS_BUCKET is required." >&2
  exit 1
fi

if [[ -z "${OSS_ENDPOINT:-}" ]]; then
  echo "OSS_ENDPOINT is required." >&2
  exit 1
fi

if [[ ! -d "$BUILD_DIR" ]]; then
  echo "Build directory '$BUILD_DIR' does not exist." >&2
  exit 1
fi

DESTINATION="oss://${OSS_BUCKET}"

if [[ -n "$OSS_PREFIX" ]]; then
  NORMALIZED_PREFIX="${OSS_PREFIX#/}"
  NORMALIZED_PREFIX="${NORMALIZED_PREFIX%/}"
  DESTINATION="${DESTINATION}/${NORMALIZED_PREFIX}"
fi

DESTINATION="${DESTINATION}/"

SYNC_ARGS=(
  sync
  "${BUILD_DIR}/"
  "$DESTINATION"
  -f
  -e "$OSS_ENDPOINT"
  -i "$OSS_ACCESS_KEY_ID"
  -k "$OSS_ACCESS_KEY_SECRET"
)

if [[ "$OSS_DELETE" == "true" ]]; then
  SYNC_ARGS+=(--delete)
fi

ossutil "${SYNC_ARGS[@]}"
