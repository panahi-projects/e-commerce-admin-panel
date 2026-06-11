# Translation coverage & key health

Even when strings are translatable, the catalogs may be incomplete or inconsistent across locales. Use `scripts/check_catalogs.py` for an exact diff; this file explains what to look for and how to interpret it.

## What to check

**Missing keys per locale.** Keys present in the default locale (e.g. `en.json`) but absent in another (`fa.json`) render as the fallback or the raw key — a visible defect in the shipped locale. Also check the reverse (keys in `fa` not in `en`) — usually stale or orphaned. For this project, completeness of `fa` is first-class, not optional.

**Keys referenced in code but absent from catalogs.** A `t('checkout.submit')` with no `checkout.submit` in any catalog → renders the key or empty. Cross-reference code key usage against the catalogs. This catches typos and renamed keys.

**Unused keys.** Keys in catalogs never referenced in code — dead weight that bloats bundles and confuses translators. Lower priority, but worth listing for cleanup. (Be careful: dynamically-built keys like `t(`status.${x}`)` can make a key look unused when it isn't — note this limitation.)

**Empty / placeholder values.** `""`, `"TODO"`, `"[fa] Submit"`, or a value identical to the key. Often a half-done translation; in the shipped locale it's a visible blank.

**Untranslated values (copy-paste from default).** A `fa` value identical to the `en` value may be a genuine cognate/brand term — or an untranslated placeholder someone forgot. Flag as "review": same-as-default values in `fa` for ordinary UI text are suspicious.

**Structural inconsistency.** Nesting/namespace shape differs between locale files; the same concept under different keys in different files; duplicate keys (last-wins, silent). The catalogs should be structurally parallel.

**Interpolation/plural parity.** A key whose default value has `{name}` or plural categories but whose translation drops them (or vice-versa) will break at runtime. (Deeper coverage in `messages.md`; the catalog check can flag variable-set mismatches per key.)

## How to interpret the diff

`check_catalogs.py` outputs, per locale pair: keys missing, keys extra, empty values, and value-equals-key cases, plus totals and a coverage percentage. Lead the report with the shipped locale's missing-key count and percentage ("`fa` is 93.4% covered — 27 keys missing"), then the specific high-visibility missing keys.

## How to report

Numbers first: total keys, per-locale coverage %, counts of missing/empty/unused. Then the actionable lists: missing keys in shipped locales (highest priority, with the English source so they can be translated), code-referenced-but-missing keys (likely bugs), and a cleanup list of unused keys. Scaffolding missing keys (copying structure, leaving values to fill) is safe to offer; the Farsi values themselves need a human/confirmed source.
