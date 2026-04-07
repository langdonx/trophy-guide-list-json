#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
mkdir -p dist

npx esbuild guide-filter.ts \
  --bundle \
  --format=esm \
  --platform=browser \
  --target=es2022 \
  --outfile=dist/guide-filter.modern.js

echo "Built dist/guide-filter.modern.js"
