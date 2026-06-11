#!/bin/bash
# ============================================================
# Security Score Calculator
# Usage: bash scripts/score.sh
# Feed it your manual checklist results to compute a score
# ============================================================
# This script reads a completed hardening-checklist.md and
# counts checked vs unchecked boxes to compute a coverage score.
# Run from the security/ output folder after audit.
# ============================================================

CHECKLIST="${1:-security/frontend-hardening-checklist.md}"

if [ ! -f "$CHECKLIST" ]; then
  echo "Checklist not found: $CHECKLIST"
  echo "Usage: bash scripts/score.sh <path-to-hardening-checklist.md>"
  exit 1
fi

CHECKED=$(grep -c "\- \[x\]" "$CHECKLIST" 2>/dev/null || echo 0)
UNCHECKED=$(grep -c "\- \[ \]" "$CHECKLIST" 2>/dev/null || echo 0)
TOTAL=$((CHECKED + UNCHECKED))

if [ "$TOTAL" -eq 0 ]; then
  echo "No checklist items found in $CHECKLIST"
  exit 1
fi

SCORE=$(echo "scale=1; $CHECKED * 100 / $TOTAL" | bc)

echo ""
echo "=============================="
echo "  SECURITY COVERAGE SCORE"
echo "=============================="
echo "  Checked:   $CHECKED / $TOTAL"
echo "  Unchecked: $UNCHECKED"
echo "  Score:     ${SCORE}%"
echo ""

if (( $(echo "$SCORE >= 90" | bc -l) )); then
  echo "  ✓ PASS — ≥90% coverage achieved"
elif (( $(echo "$SCORE >= 75" | bc -l) )); then
  echo "  ⚠ NEAR — fix remaining HIGH items to reach 90%"
else
  echo "  ✗ FAIL — significant hardening work remains"
fi
echo ""
