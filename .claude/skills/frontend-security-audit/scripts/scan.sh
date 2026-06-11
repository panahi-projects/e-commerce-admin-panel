#!/bin/bash
# ============================================================
# Frontend (Next.js) Security Scanner — Static Analysis Baseline
# Usage: bash scripts/scan.sh <project-root>
# ============================================================

PROJECT_ROOT="${1:-.}"
FINDINGS=0
CRITICAL=0
HIGH=0
MEDIUM=0
LOW=0

RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
RESET='\033[0m'

echo ""
echo "=========================================="
echo "   FRONTEND (NEXT.JS) SECURITY SCANNER"
echo "   Target: $PROJECT_ROOT"
echo "=========================================="
echo ""

crit() { echo -e "${RED}[CRITICAL]${RESET} $1"; ((CRITICAL++)); ((FINDINGS++)); }
high() { echo -e "${RED}[HIGH]${RESET}     $1"; ((HIGH++)); ((FINDINGS++)); }
med()  { echo -e "${YELLOW}[MEDIUM]${RESET}   $1"; ((MEDIUM++)); ((FINDINGS++)); }
low()  { echo -e "${CYAN}[LOW]${RESET}      $1"; ((LOW++)); ((FINDINGS++)); }
ok()   { echo -e "${GREEN}[OK]${RESET}       $1"; }
info() { echo -e "           $1"; }

cd "$PROJECT_ROOT" || { echo "Cannot access $PROJECT_ROOT"; exit 1; }

EXCLUDES="--exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git --exclude-dir=dist --exclude-dir=coverage"
EXTS="--include=*.ts --include=*.tsx --include=*.js --include=*.jsx"

# ============================================================
echo "--- [1/9] NEXT_PUBLIC_ ENV VAR EXPOSURE ---"
# ============================================================

if [ -f ".env" ] || [ -f ".env.local" ] || [ -f ".env.production" ]; then
  for f in .env .env.local .env.production .env.development; do
    if [ -f "$f" ]; then
      echo "  Checking $f ..."
      PUBLIC_VARS=$(grep "^NEXT_PUBLIC_" "$f" 2>/dev/null)
      if [ -n "$PUBLIC_VARS" ]; then
        # Flag suspicious names
        SUSPICIOUS=$(echo "$PUBLIC_VARS" | grep -iE "secret|password|private|token|admin|api_secret")
        if [ -n "$SUSPICIOUS" ]; then
          crit "Suspicious NEXT_PUBLIC_ var names in $f (will be in client bundle!):"
          echo "$SUSPICIOUS" | sed 's/=.*/=<value hidden>/' | while read line; do info "$line"; done
        fi
        echo "$PUBLIC_VARS" | sed 's/=.*/=<value hidden>/' | while read line; do info "  $line"; done
      fi
    fi
  done
fi

# .env in git
if git -C . ls-files --error-unmatch .env 2>/dev/null; then
  crit ".env file is TRACKED by git"
fi
if git -C . ls-files --error-unmatch .env.local 2>/dev/null; then
  crit ".env.local file is TRACKED by git"
fi

# .env not gitignored
if [ -f ".gitignore" ]; then
  if ! grep -qE "^\.env|^\*\.env" .gitignore; then
    high ".env files may not be in .gitignore"
  else
    ok ".env files appear to be in .gitignore"
  fi
fi

# ============================================================
echo ""
echo "--- [2/9] HARDCODED SECRETS / KEYS IN SOURCE ---"
# ============================================================

HARDCODED=$(grep -rn $EXTS $EXCLUDES \
  -E "(sk_live_|sk_test_|AIza[0-9A-Za-z_-]{35}|AKIA[0-9A-Z]{16}|-----BEGIN.*PRIVATE KEY-----)" \
  . 2>/dev/null)
if [ -n "$HARDCODED" ]; then
  crit "Possible hardcoded API keys / secrets / private keys found:"
  echo "$HARDCODED" | head -10 | while read line; do info "$line"; done
else
  ok "No obvious hardcoded API keys found"
fi

# Generic secret assignment patterns
GENERIC=$(grep -rn $EXTS $EXCLUDES \
  -E "(apiKey|api_key|secret|password)\s*[:=]\s*['\"][A-Za-z0-9_\-]{12,}['\"]" \
  . 2>/dev/null | grep -v "process.env" | grep -v "\.example" | grep -v "test")
if [ -n "$GENERIC" ]; then
  high "Possible hardcoded credentials found:"
  echo "$GENERIC" | head -10 | while read line; do info "$line"; done
fi

# ============================================================
echo ""
echo "--- [3/9] XSS RISK PATTERNS ---"
# ============================================================

DSI=$(grep -rn $EXTS $EXCLUDES "dangerouslySetInnerHTML" . 2>/dev/null)
if [ -n "$DSI" ]; then
  med "dangerouslySetInnerHTML usage found — verify sanitization (DOMPurify):"
  echo "$DSI" | while read line; do info "$line"; done
else
  ok "No dangerouslySetInnerHTML usage found"
fi

EVAL=$(grep -rn $EXTS $EXCLUDES \
  -E "\beval\s*\(|new\s+Function\s*\(|setTimeout\s*\(\s*['\"]|setInterval\s*\(\s*['\"]" \
  . 2>/dev/null)
if [ -n "$EVAL" ]; then
  crit "eval()/Function()/string-based timers found — code injection risk:"
  echo "$EVAL" | while read line; do info "$line"; done
fi

# target=_blank without rel=noopener
BLANK=$(grep -rn $EXTS $EXCLUDES 'target="_blank"' . 2>/dev/null | grep -v "noopener")
if [ -n "$BLANK" ]; then
  low "target=\"_blank\" without rel=\"noopener noreferrer\" found:"
  echo "$BLANK" | head -5 | while read line; do info "$line"; done
fi

# ============================================================
echo ""
echo "--- [4/9] AUTH TOKEN STORAGE ---"
# ============================================================

LOCALSTORAGE_TOKEN=$(grep -rn $EXTS $EXCLUDES \
  -E "localStorage\.(setItem|getItem)\s*\(\s*['\"](.*token|.*jwt|.*auth)" \
  . 2>/dev/null -i)
if [ -n "$LOCALSTORAGE_TOKEN" ]; then
  crit "Auth tokens may be stored in localStorage (XSS = full takeover):"
  echo "$LOCALSTORAGE_TOKEN" | while read line; do info "$line"; done
else
  ok "No obvious auth token storage in localStorage found"
fi

SESSIONSTORAGE_TOKEN=$(grep -rn $EXTS $EXCLUDES \
  -E "sessionStorage\.(setItem|getItem)\s*\(\s*['\"](.*token|.*jwt|.*auth)" \
  . 2>/dev/null -i)
if [ -n "$SESSIONSTORAGE_TOKEN" ]; then
  high "Auth tokens may be stored in sessionStorage:"
  echo "$SESSIONSTORAGE_TOKEN" | while read line; do info "$line"; done
fi

# ============================================================
echo ""
echo "--- [5/9] SECURITY HEADERS (next.config.*) ---"
# ============================================================

NEXTCONFIG=$(ls next.config.* 2>/dev/null | head -1)
if [ -n "$NEXTCONFIG" ]; then
  if grep -q "headers" "$NEXTCONFIG"; then
    ok "headers() function found in $NEXTCONFIG"
    for header in "Content-Security-Policy" "X-Frame-Options" "X-Content-Type-Options" "Strict-Transport-Security" "Referrer-Policy"; do
      if grep -q "$header" "$NEXTCONFIG"; then
        ok "  $header is configured"
      else
        med "  $header is MISSING from $NEXTCONFIG"
      fi
    done
  else
    high "No headers() function found in $NEXTCONFIG — security headers not configured"
  fi

  # Wildcard image domains
  if grep -qE "domains:\s*\[\s*['\"]\*['\"]|hostname:\s*['\"]\*\*?['\"]" "$NEXTCONFIG"; then
    high "Wildcard image domain/hostname found in $NEXTCONFIG"
  fi
else
  med "No next.config.js/ts found — using Next.js defaults (no custom security headers)"
fi

# ============================================================
echo ""
echo "--- [6/9] API ROUTES / ROUTE HANDLERS / SERVER ACTIONS ---"
# ============================================================

ROUTE_HANDLERS=$(find . -path ./node_modules -prune -o -path ./.next -prune -o \
  \( -path "*/app/api/*/route.ts" -o -path "*/app/api/*/route.js" -o -path "*/pages/api/*" \) -print 2>/dev/null)
if [ -n "$ROUTE_HANDLERS" ]; then
  echo "  Found $(echo "$ROUTE_HANDLERS" | wc -l) API route file(s)."
  NO_VALIDATION=0
  for f in $ROUTE_HANDLERS; do
    if ! grep -qE "zod|class-validator|joi|yup|\.parse\(|\.safeParse\(" "$f" 2>/dev/null; then
      ((NO_VALIDATION++))
    fi
  done
  if [ "$NO_VALIDATION" -gt 0 ]; then
    med "$NO_VALIDATION API route(s) may lack input validation (no zod/joi/yup/class-validator detected) — manual review needed"
  fi
else
  info "No API routes / Route Handlers found"
fi

SERVER_ACTIONS=$(grep -rln $EXTS $EXCLUDES "'use server'" . 2>/dev/null)
if [ -n "$SERVER_ACTIONS" ]; then
  echo "  Found Server Action file(s):"
  echo "$SERVER_ACTIONS" | while read f; do info "$f"; done
  info "  -> Manually verify each Server Action validates input and re-checks authorization"
fi

# ============================================================
echo ""
echo "--- [7/9] PRODUCTION BUILD CONFIG ---"
# ============================================================

if [ -n "$NEXTCONFIG" ]; then
  if grep -q "ignoreDuringBuilds.*true" "$NEXTCONFIG"; then
    low "ESLint errors are ignored during build — may hide security-relevant lint issues"
  fi
  if grep -q "ignoreBuildErrors.*true" "$NEXTCONFIG"; then
    low "TypeScript errors are ignored during build — may hide type-safety issues"
  fi
fi

# ============================================================
echo ""
echo "--- [8/9] DEPENDENCY AUDIT ---"
# ============================================================

if [ -f "package.json" ]; then
  echo "Running npm audit (this may take a moment)..."
  npm audit --audit-level=moderate 2>&1 | tail -20

  NEXT_VERSION=$(grep '"next"' package.json | head -1)
  echo "  Next.js version declared: $NEXT_VERSION"
  info "  -> Verify against https://github.com/vercel/next.js/security/advisories for known CVEs"
fi

# ============================================================
echo ""
echo "--- [9/9] SOURCE MAPS & DEBUG ARTIFACTS ---"
# ============================================================

if [ -n "$NEXTCONFIG" ]; then
  if grep -q "productionBrowserSourceMaps.*true" "$NEXTCONFIG"; then
    med "productionBrowserSourceMaps is enabled — source maps will be public in production"
  else
    ok "productionBrowserSourceMaps not explicitly enabled (default: false)"
  fi
fi

# ============================================================
echo ""
echo "=========================================="
echo "   SCAN COMPLETE — SUMMARY"
echo "=========================================="
echo -e "${RED}  CRITICAL: $CRITICAL${RESET}"
echo -e "${RED}  HIGH:     $HIGH${RESET}"
echo -e "${YELLOW}  MEDIUM:   $MEDIUM${RESET}"
echo -e "${CYAN}  LOW:      $LOW${RESET}"
echo "  TOTAL:    $FINDINGS findings"
echo ""

if [ $CRITICAL -gt 0 ]; then
  echo -e "${RED}  ⚠  CRITICAL issues found — immediate action required${RESET}"
elif [ $HIGH -gt 0 ]; then
  echo -e "${YELLOW}  ⚠  HIGH issues found — fix before production${RESET}"
else
  echo -e "${GREEN}  ✓  No critical/high automated findings — proceed to manual audit${RESET}"
fi
echo ""
