# Report format

The report drives localization fixes. Lead with what breaks a shipped locale, attribute every finding to files with counts, and always name the correct key/API/format.

## Structure

```
# i18n / Localization Review — <app/scope>

## Summary
- Setup: <library> · locales <en, fa, ...> (default <x>, fallback <y>) · catalogs <path/shape>
- Coverage: <fa 93.4% — 27/412 keys missing>, <N hardcoded strings>, <key formatting/RTL issues>
- Headline: 1–2 sentences — the biggest barrier to a correct Farsi experience and the upside.

## Top findings (ranked by impact ÷ effort)
Grouped, not one-per-occurrence. For each:

### N. <short title>  ·  [Quick win | Medium | Larger effort]  ·  <count> / <files>
- **Issue:** what's wrong for the user, in one line (which locale it breaks).
- **Where:** representative file:line refs + count/spread.
- **Correct approach:** the key/API/format to use (e.g. wrap in `t('...')`, `Intl.DateTimeFormat('fa-IR',{calendar:'persian'})`, `ms-4`).
- **Fix:** concrete change.
- **Auto-applyable?:** yes (mechanical: wrap literal, swap property) / needs review (Farsi copy, plural categories, component merge).

## Coverage detail
- Per-locale coverage table/list, missing keys in shipped locales (with English source), code-referenced-but-missing keys (likely bugs), unused keys (cleanup).

## Minor / later
One-line low-impact items (SEO hreflang, unused keys, dev-only strings).

## Suggested fix order
Mechanical & correctness-critical first (locale-driven `dir`, Toman/Rial, Gregorian→Jalali, missing shipped-locale keys, t()-wrapping), then RTL property swaps, then message restructuring and component-level changes (need review/testing).

## How to verify
Commands to re-check (rerun scan_i18n.sh, check_catalogs.py), plus a note to visually
review RTL/formatting in the Farsi locale and to get human-confirmed translations.
```

## Rules

- **Correctness bugs outrank polish.** A wrong calendar or a Toman/Rial 10× error or a non-loading locale ranks above a missing aria-label. Lead with value-wrong issues.
- **Group, don't spam.** 38 hardcoded strings = one finding with a breakdown, not 38.
- **Always name the correct approach.** "This is hardcoded" without "wrap in `t('checkout.submit')`" isn't actionable.
- **Separate mechanical from judgment.** Wrapping literals and swapping properties are safe to offer to apply; inventing Farsi copy, choosing plural categories, and merging components need a human/confirmation — scaffold, don't fabricate.
- **Tie to a locale.** Each finding says which locale it breaks and how — that's why it's prioritized.
- **Right-size it.** "Find hardcoded strings in this file" → tight answer. "Full i18n audit" → the complete structure.
```
