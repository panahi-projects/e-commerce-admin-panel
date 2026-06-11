#!/usr/bin/env bash
# scan_consistency.sh — surface candidate design-system consistency violations.
# Greps for the common drift patterns so the audit has concrete file:line hits to
# verify. It does NOT decide validity — every hit must be confirmed in context
# (some arbitrary values are legitimate). Output is grouped by category.
#
# Usage: bash scan_consistency.sh [project_dir]   (defaults to current dir)

set -uo pipefail
DIR="${1:-.}"
cd "$DIR" || { echo "Cannot cd to $DIR"; exit 1; }

# Pick search roots that exist
ROOTS=()
for d in src app components pages lib features ui packages; do
  [ -d "$d" ] && ROOTS+=("$d")
done
[ ${#ROOTS[@]} -eq 0 ] && ROOTS=(".")

# Restrict to source files; skip noise. Arrays so flags aren't word-split wrong.
EXT=(--include='*.tsx' --include='*.ts' --include='*.jsx' --include='*.js' --include='*.css' --include='*.scss')
EXCL=(--exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist --exclude-dir=build --exclude-dir=.git --exclude-dir=coverage)
# Wrapper: recursive grep with the standard includes/excludes applied.
g() { grep -rnE "${EXT[@]}" "${EXCL[@]}" "$@" "${ROOTS[@]}" 2>/dev/null; }
# Fixed-string variant for literal tokens containing regex metachars like '('.
gf() { grep -rnF "${EXT[@]}" "${EXCL[@]}" "$@" "${ROOTS[@]}" 2>/dev/null; }

section() { echo; echo "==================================================="; echo "$1"; echo "==================================================="; }
count()   { local n; n=$(printf '%s\n' "$1" | grep -c . ); echo "  [$n hits]"; }

section "1. Raw colors (hex / rgb / hsl literals) — should map to color tokens"
HITS=$(g -- '#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(' \
  | grep -vE '\-\-[a-z]' )   # crude: skip lines defining CSS vars themselves
printf '%s\n' "$HITS" | head -40
count "$HITS"

section "2. Arbitrary Tailwind values — [..] — should map to scale/tokens"
HITS=$(g -- '(bg|text|border|p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|w|h|gap|rounded|shadow|z|leading|tracking)-\[')
printf '%s\n' "$HITS" | head -40
count "$HITS"

section "3. RTL: physical direction utilities — should be logical (ms/me/ps/pe/start/end)"
HITS=$(g -- '\b(ml|mr|pl|pr)-[0-9a-z]|\b(left|right)-[0-9]|\btext-(left|right)\b|\bborder-(l|r)\b|\brounded-(l|r)-|\bfloat-(left|right)\b')
printf '%s\n' "$HITS" | head -40
count "$HITS"

section "3b. RTL in raw CSS — physical properties"
HITS=$(g -- '(margin|padding)-(left|right)|(^|[^-])\b(left|right)\s*:|text-align\s*:\s*(left|right)|border-(left|right)')
printf '%s\n' "$HITS" | head -25
count "$HITS"

section "4. Heavy / namespace imports & duplicate-prone raw elements"
echo "-- namespace imports (defeat tree-shaking, sometimes wrapper drift):"
g -- 'import \* as ' | head -15
echo "-- raw <button>/<input> usage (candidate duplicates of primitives):"
g -- '<button|<input' | head -25

section "5. Class-composition inconsistency (cn vs clsx vs classnames)"
for tok in 'cn(' 'clsx(' 'classNames(' 'classnames('; do
  n=$(gf -- "$tok" | grep -c .)
  echo "  $tok -> $n files/hits"
done

section "6. Import-path styles for ui components (consistency)"
echo "-- alias imports:"
g -- "from '@/components/ui" | grep -c . | sed 's/^/  alias: /'
echo "-- relative ui imports:"
g -- "from '\.\..*components/ui" | grep -c . | sed 's/^/  relative: /'

echo
echo "NOTE: these are CANDIDATES. Verify each in context against the discovered canon"
echo "before reporting — some arbitrary values / physical props are legitimately one-off."
