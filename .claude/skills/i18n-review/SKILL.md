---
name: i18n-review
description: Audit a front-end project for internationalization (i18n) and localization (l10n) quality — hardcoded user-facing strings that bypass translation, missing/unused/inconsistent translation keys across locales, broken pluralization and interpolation, RTL correctness (logical CSS, mirrored layouts, directional icons), and locale-correct formatting of dates, numbers, and currency (including Jalali/Shamsi calendars, Toman/Rial, and Persian digits for Farsi). Library-agnostic — it detects next-intl, i18next/next-i18next, react-intl, or a custom setup. Produces a prioritized, file-and-line-specific report. Use this skill whenever the user asks for an i18n or localization review/audit, to find hardcoded or untranslated strings, check translation coverage or missing keys, verify RTL/Farsi correctness, check date/number/currency formatting per locale, or asks "is our app properly internationalized" / "are we missing translations" — even if they don't say "i18n audit."
---

# Internationalization (i18n) Review

Audit a front-end for internationalization quality and return a **prioritized, file-and-line-specific** report. The goal is an app that renders correctly and completely in every supported locale — no leaked source-language strings, no missing keys, correct plurals/interpolation, correct RTL, and locale-correct dates/numbers/currency.

Two pillars, weighted equally:
- **Translation coverage & correctness** — every user-facing string is translatable, every key exists in every locale, plurals and variables work.
- **Localization correctness** — RTL layout, and locale-appropriate formatting of dates (incl. Jalali/Shamsi), numbers, and currency (Toman/Rial, Persian digits).

## Operating principle: detect the setup, then measure completeness and correctness against every locale

You can't judge "missing translation" without knowing the locale set and the i18n mechanism. So phase one is always detection: which library, which locales, where the message catalogs live, how strings are accessed. Phase two measures the codebase against that: what's not translatable, what's missing, what's mis-formatted.

Avoid two failure modes: generic i18n advice unmoored from the actual setup, and a flat list of hundreds of equal-weight string findings. Rank by user impact (a leaked string on the checkout button beats one in a dev-only error) and effort.

## Workflow

### Step 1 — Detect the i18n setup (the source of truth)

Run `scripts/scan_i18n.sh` to surface the setup and candidate issues fast, then confirm by reading config. Detailed guidance in `references/detection.md`. Establish:
- **Library & version** — next-intl, i18next/next-i18next, react-intl (FormatJS), Lingui, or a custom/hand-rolled solution. Each changes the API you look for (`t()`, `useTranslations`, `<FormattedMessage>`, etc.) and the catalog format. If it's custom, infer the access pattern from usage.
- **Supported locales & default** — from config and the catalog directory (e.g. `messages/{en,fa}.json`, `locales/<lng>/*.json`). For this project expect Farsi (`fa`) as a first-class locale; note the default and the fallback.
- **Catalog location & shape** — flat vs nested keys, namespaces, ICU MessageFormat vs i18next interpolation. This determines how you check coverage.
- **Routing & direction wiring** — how locale is selected (path prefix, domain, cookie), and how `dir`/`lang` are set on `<html>`. RTL correctness depends on this being right.

Hold this as the reference set: the locale list, the catalog(s), and the access API. Every later finding is measured against it.

### Step 2 — Audit across the i18n categories

Read the relevant reference file as you reach each category; don't load all up front. Weight toward what the app actually suffers from.

1. **Hardcoded / untranslated strings** → `references/hardcoded-strings.md`
   User-facing text rendered as literals instead of through the translation API: JSX text nodes, `placeholder`/`title`/`aria-label`/`alt` attributes, button labels, toast/error messages, `Intl`-less concatenation. The most common gap; rank by visibility.

2. **Translation coverage & key health** → `references/coverage.md`
   Keys present in the default locale but missing in others (and vice-versa), unused keys, duplicate/inconsistent keys, empty values, keys referenced in code but absent in catalogs. Use `scripts/check_catalogs.py` for an exact diff across locale files.

3. **Plurals, interpolation & message structure** → `references/messages.md`
   Broken or missing pluralization (English-style `+ 's'`), missing ICU plural categories (Persian needs `one`/`other` at minimum; some languages need `few`/`many`), interpolation mismatches (a variable in code not in the message or vice-versa), concatenated sentence fragments that can't translate, hardcoded word order.

4. **RTL correctness** → `references/rtl.md`
   `dir`/`lang` set correctly per locale, logical CSS properties (`ms`/`me` not `ml`/`mr`) instead of physical, mirrored layouts, directional icons flipped, and LTR-pinned islands (numbers, code, addresses) inside RTL. Overlaps the design-system audit but framed here as locale correctness.

5. **Date, number & currency formatting** → `references/formatting.md`
   Locale-aware formatting via `Intl`/the i18n lib instead of hardcoded formats; **Jalali/Shamsi calendar** for Farsi (e.g. `jalali-plugin-dayjs`), **Toman/Rial** currency conventions, **Persian digits** (۰۱۲۳) vs Latin, correct decimal/thousands separators, relative time, and timezone handling.

6. **Setup & runtime correctness** → `references/setup.md`
   Fallback locale behavior, missing-key handling (silent vs visible), SSR/hydration mismatches from locale-dependent formatting, lazy-loading namespaces, and whether the catalog actually ships for each locale. Library-specific notes for next-intl / i18next / react-intl live here.

### Step 3 — Quantify and prioritize

- Counts and spread: "38 hardcoded strings across 14 files"; "`fa.json` is missing 27 of 412 keys present in `en.json`."
- Rank: leaked strings on high-traffic/critical UI and missing keys in shipped locales = top; dev-only or rarely-seen issues = minor.
- Group: one finding per pattern with a count, not one per occurrence.

### Step 4 — Report

Use `references/report-format.md`. Each finding: *What's wrong → Where (files/lines, count) → Correct approach (the key/API/format to use) → Fix → Effort.* Offer to apply mechanical fixes (wrap a literal in `t()`, swap a physical property) on confirmation; flag judgment calls (does this string need a new key? which plural categories?) as review. Keep minor items in a short tail list.

## Honesty notes

- Not every literal is a violation — `dir="ltr"` data, code samples, brand names, and test/dev-only strings may legitimately stay untranslated. Verify intent; mark uncertain ones "review."
- Distinguish verified findings (read the catalog/code) from grep candidates you couldn't confirm.
- Machine-extracting strings and adding keys can change behavior (key collisions, context loss); recommend a human pass on the actual translations — you can scaffold keys but shouldn't invent final Farsi copy without confirmation.
- If there's no i18n setup at all, say so plainly: the first step is introducing one (recommend a library fitting their stack), not auditing against nothing — but still report the RTL/formatting issues that apply regardless.
