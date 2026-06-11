#!/usr/bin/env bash
# scan_i18n.sh — detect the i18n setup and surface candidate issues (hardcoded
# strings, translatable attributes, hardcoded plurals/dates, physical RTL props).
# Candidates only — verify each in context. Pair with check_catalogs.py for
# exact coverage diffs.
#
# Usage: bash scan_i18n.sh [project_dir]   (defaults to current dir)

set -uo pipefail
DIR="${1:-.}"
cd "$DIR" || { echo "Cannot cd to $DIR"; exit 1; }

ROOTS=()
for d in src app components pages lib features; do [ -d "$d" ] && ROOTS+=("$d"); done
[ ${#ROOTS[@]} -eq 0 ] && ROOTS=(".")

EXT=(--include='*.tsx' --include='*.ts' --include='*.jsx' --include='*.js')
EXCL=(--exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist --exclude-dir=build --exclude-dir=.git)
g()  { grep -rnE "${EXT[@]}" "${EXCL[@]}" "$@" "${ROOTS[@]}" 2>/dev/null; }
gf() { grep -rnF "${EXT[@]}" "${EXCL[@]}" "$@" "${ROOTS[@]}" 2>/dev/null; }
sec() { echo; echo "================================================="; echo "$1"; echo "================================================="; }
cnt() { printf '%s\n' "$1" | grep -c . ; }

sec "0. Detected i18n library"
for lib in next-intl react-i18next next-i18next i18next react-intl @lingui/core; do
  grep -q "\"$lib\"" package.json 2>/dev/null && echo "  found dependency: $lib"
done
echo "  translation-call usage:"
g -- "useTranslations|useTranslation|getTranslations|<FormattedMessage|formatMessage|<Trans\b|\bt\(['\"]" | head -8

sec "0b. Locales & catalogs"
grep -rnE "locales?\s*[:=]|defaultLocale|fallbackLng" next.config.* i18n.* "${ROOTS[@]}" 2>/dev/null | head -8
echo "  catalog dirs:"
ls -d messages public/locales src/locales lang locales 2>/dev/null
echo "  catalog files:"
find . -path ./node_modules -prune -o \( -name '*.json' -path '*locale*' -o -name '*.json' -path '*messages*' \) -print 2>/dev/null | grep -vE 'node_modules' | head -20

sec "1. Candidate hardcoded JSX text (>=2 letters between tags)"
HITS=$(g -- '>[[:space:]]*[A-Za-z][A-Za-z ,.!?'\''-]{2,}[[:space:]]*<')
printf '%s\n' "$HITS" | head -40
echo "  [$(cnt "$HITS") candidate hits]"

sec "2. Translatable attributes with literal text (placeholder/title/alt/aria-label)"
HITS=$(g -- '(placeholder|title|alt|aria-label|aria-description)="[^"{]*[A-Za-z]{2,}[^"]*"')
printf '%s\n' "$HITS" | head -40
echo "  [$(cnt "$HITS") candidate hits]"

sec "3. Imperative UI strings (toast/alert/error with literal text)"
HITS=$(g -- '(toast\.[a-z]+|alert|confirm|new Error|notify[A-Za-z]*)\(\s*['\''"][^'\''"]*[A-Za-z]{3,}')
printf '%s\n' "$HITS" | head -25
echo "  [$(cnt "$HITS") candidate hits]"

sec "4. Hardcoded English pluralization (bypasses i18n plural rules)"
HITS=$(g -- "=== 1 \? ''|\? '' :|\bitem\\\$\{|s' :|\(s\)")
printf '%s\n' "$HITS" | head -20
echo "  [$(cnt "$HITS") candidate hits]"

sec "5. Date formatting that may bypass locale/Jalali"
HITS=$(g -- "toLocaleDateString\(|toLocaleString\(|\.format\(['\"][YMD]|moment\(|new Intl\.DateTimeFormat")
printf '%s\n' "$HITS" | head -25
echo "  [$(cnt "$HITS") candidate hits]  -- check Jalali gating for fa vs Gregorian for en"

sec "6. Currency / number formatting (check Toman/Rial + Persian digits)"
HITS=$(g -- "Intl\.NumberFormat|toLocaleString\(|تومان|ریال|Toman|Rial|IRR|IRT")
printf '%s\n' "$HITS" | head -25
echo "  [$(cnt "$HITS") candidate hits]"

sec "7. RTL: physical direction utilities (should be logical for fa)"
HITS=$(g -- '\b(ml|mr|pl|pr)-[0-9a-z]|\b(left|right)-[0-9]|\btext-(left|right)\b|\bborder-(l|r)\b|\brounded-(l|r)-')
printf '%s\n' "$HITS" | head -30
echo "  [$(cnt "$HITS") candidate hits]"

sec "7b. dir= usage (should be locale-driven, not hardcoded everywhere)"
g -- 'dir=' | head -15

echo
echo "NOTE: all CANDIDATES — verify against the detected setup. LTR-pinned data"
echo "(numbers, addresses, code), dev-only strings, and brand names are not violations."
