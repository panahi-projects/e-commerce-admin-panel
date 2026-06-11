# Report format

The report drives cleanup. Lead with the highest impact-to-effort findings, attribute every finding to specific files with counts, and always name the canonical replacement.

## Structure

```
# Design-System Consistency Audit — <app/scope>

## Summary
- Canon: <N tokens, M primitives discovered> (source: tailwind.config + globals.css + components/ui)
- Headline: 1–2 sentences — the biggest source of inconsistency and the cleanup upside.
- Totals: e.g. "112 token violations · 6 duplicate components · 63 RTL violations · 9 variant clusters"

## Top findings (ranked by impact ÷ effort)
For each (grouped, not one-per-occurrence):

### N. <short title>  ·  [Quick win | Medium | Larger effort]  ·  <count> occurrences / <files> files
- **Drift:** what deviates from the system, in one line.
- **Where:** representative file:line refs + the count/spread.
- **Canonical:** the exact token or component it should use instead.
- **Fix:** the replacement (often mechanical: `ml-4` → `ms-4`, `#0F172A` → `bg-primary`).
- **Auto-applyable?:** yes (exact mechanical mapping) / needs review (judgment call).

## Minor / later
One-line items for low-impact one-offs and structural nits.

## Suggested cleanup order
A short ordered plan: mechanical safe replacements first (tokens, RTL swaps),
then variant consolidation, then component de-duplication (highest risk, needs visual review).

## How to verify
Commands to re-scan and confirm violations are gone (re-run scan_consistency.sh),
plus a note to visually review any component consolidation.
```

## Rules

- **Group, don't spam.** 47 instances of the same hex→token map is ONE finding with a count, not 47 findings.
- **Always name the canonical replacement.** A finding without "use X instead" is not actionable — cut it or mark it "review: no existing token, decide whether to add one."
- **Rank by impact-to-effort.** Widespread + mechanical = top. Component duplication = high impact (ranks up) but high effort/risk (flag the risk). Single-file one-offs = minor.
- **Separate mechanical from judgment.** Mark which fixes are safe direct replacements (offer to apply them on confirmation) vs. which need a human decision (new token? merge these components?).
- **Be honest about risk.** Token/RTL swaps are low-risk; component consolidation and variant alignment can cause visual regressions — say so and recommend a visual pass.
- **Right-size it.** "Check this file for hardcoded colors" → tight focused answer. "Audit our whole design system" → the full structure.
