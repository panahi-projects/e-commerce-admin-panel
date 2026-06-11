#!/usr/bin/env bash
# analyze_bundle.sh — produce a real bundle breakdown for a front-end project.
# This script DETECTS the toolchain and prints the right commands/output.
# It does not assume network access; if install/build can't run, it falls back
# to inspecting any existing build output.
#
# Usage: bash analyze_bundle.sh [project_dir]   (defaults to current dir)

set -uo pipefail
DIR="${1:-.}"
cd "$DIR" || { echo "Cannot cd to $DIR"; exit 1; }

echo "== Project detection =="
if [ ! -f package.json ]; then
  echo "No package.json found in $DIR — is this the project root?"
  exit 1
fi

# Identify framework
FRAMEWORK="unknown"
grep -q '"next"' package.json && FRAMEWORK="next"
grep -q '"vite"' package.json && FRAMEWORK="vite"
grep -q '"react-scripts"' package.json && FRAMEWORK="cra"
grep -q '"@remix-run' package.json && FRAMEWORK="remix"
echo "Framework guess: $FRAMEWORK"
echo

echo "== Heaviest dependencies (installed size, if node_modules present) =="
if [ -d node_modules ]; then
  du -sh node_modules/* 2>/dev/null | sort -rh | head -20
else
  echo "node_modules not installed. Run your package manager install first for sizes."
fi
echo

echo "== Existing build output (if any) =="
for out in .next dist build out; do
  if [ -d "$out" ]; then
    echo "Found ./$out — largest JS/CSS assets:"
    find "$out" -type f \( -name '*.js' -o -name '*.css' \) -printf '%s\t%p\n' 2>/dev/null \
      | sort -rn | head -20 | awk '{printf "%.1f KB\t%s\n", $1/1024, $2}'
    echo
  fi
done

echo "== Recommended next commands (run locally for real numbers) =="
case "$FRAMEWORK" in
  next)
    echo "  # Option A: official analyzer"
    echo "  npm i -D @next/bundle-analyzer"
    echo "  # wrap next.config with withBundleAnalyzer, then:"
    echo "  ANALYZE=true npm run build"
    echo
    echo "  # Option B: build and read the per-route First Load JS table that"
    echo "  #           'next build' prints — flag routes with large First Load JS."
    echo "  npm run build"
    ;;
  vite)
    echo "  npx vite-bundle-visualizer        # interactive treemap"
    echo "  # or add rollup-plugin-visualizer to the Vite config and build."
    ;;
  cra)
    echo "  npx source-map-explorer 'build/static/js/*.js'"
    ;;
  remix)
    echo "  npm run build   # then inspect build/ assets above; add a rollup visualizer if needed"
    ;;
  *)
    echo "  Identify the bundler, then use its analyzer (rollup-plugin-visualizer,"
    echo "  webpack-bundle-analyzer, source-map-explorer, etc.)."
    ;;
esac
echo
echo "== Quick checks for known-heavy imports =="
echo "Searching source for common bloat patterns..."
SRC_GLOB=( "src" "app" "components" "pages" "lib" )
PAT='import _ from .lodash.|from .moment.|import \* as .* from'
for d in "${SRC_GLOB[@]}"; do
  [ -d "$d" ] && grep -rnE "$PAT" "$d" 2>/dev/null | head -20
done
echo
echo "Done. Feed the largest modules + per-route First Load JS into the audit report."
