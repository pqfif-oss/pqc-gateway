#!/bin/bash

PGW_DIR=$(cd "$(dirname "$0")" && pwd)

cd "$PGW_DIR"
git submodule update --init
if [ $? -ne 0 ]; then
  echo 'Cannot download Pipy from github.com'
  exit 1
fi

if [ -n "$PGW_VERSION" ]; then
  VERSION="$PGW_VERSION"
else
  VERSION=`git describe --abbrev=0 --tags`
fi

COMMIT=`git log -1 --format=%H`
COMMIT_DATE=`git log -1 --format=%cD`

VERSION_JSON="{
  \"tag\": \"$VERSION\",
  \"commit\": \"$COMMIT\",
  \"date\": \"$COMMIT_DATE\"
}"

echo "$VERSION_JSON" > "$PGW_DIR/src/version.json"
