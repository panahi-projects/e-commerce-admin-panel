# Setup & runtime correctness

Beyond strings and formatting, the i18n machinery itself can be misconfigured in ways that cause silent fallbacks, hydration bugs, or locales that don't actually ship.

## Fallback & missing-key behavior

- **Fallback locale.** What renders when a key is missing in the active locale? A sensible fallback (usually the default locale) is fine for resilience but masks coverage gaps — ensure missing keys are *also* reported, not silently hidden. Confirm the fallback is configured intentionally.
- **Missing-key visibility in dev.** In development, missing keys should be visible (warning, or the raw key shown) so they're caught. Silent empty strings in dev let gaps reach production. Check the lib's `missingKeyHandler`/`onError`/`returnNull` settings.
- **Raw-key leakage in prod.** Conversely, ensure production doesn't show raw keys (`checkout.submit`) to users when something's missing — that's worse than a fallback translation.

## SSR / hydration correctness

Locale-dependent output computed differently on server vs client causes React hydration mismatches — a real, common bug with i18n + SSR:
- Date/number/currency formatted with a locale or timezone that differs between server and client.
- Locale resolved from a different source on each side (cookie vs header) producing different initial render.
- `Intl` calls without an explicit locale (falling back to the runtime's default, which differs server↔client).
Check that the active locale and timezone are resolved consistently and passed through to both render passes. Recommend explicit locale args to all `Intl`/formatting calls.

## Catalog shipping & loading

- **Does each locale's catalog actually load?** A locale declared in config but whose catalog isn't imported/bundled/fetched renders entirely as fallback. Verify the wiring for every supported locale, especially `fa`.
- **Namespace lazy-loading.** With i18next namespaces, a component using a namespace that isn't loaded shows keys. Check namespaces are declared/loaded where used.
- **Bundle cost.** Are all locales shipped to every client, or split per locale/route? Large catalogs eagerly loaded for all locales is a perf cost (cross-reference the perf-audit skill) — note if a locale-splitting strategy is missing.

## Locale routing & detection

- Locale selection (path prefix `/fa`, domain, cookie, `Accept-Language`) should be consistent and produce a stable `dir`/`lang`. Check the middleware/config.
- Persisted preference: does the chosen locale survive navigation/refresh? A locale switcher that resets is a common defect.
- `hreflang`/SEO: for public pages, alternate-locale links and correct `lang` aid SEO — note if absent (lower priority unless SEO matters to them).

## Library-specific notes

- **next-intl**: messages provided via `NextIntlClientProvider` / `getMessages`; check server vs client component usage (`useTranslations` client, `getTranslations` server) and that the timezone/now are passed for stable SSR.
- **i18next/next-i18next**: `fallbackLng`, `ns`/`defaultNS`, `react.useSuspense`, and SSR serialization of the store; check keys aren't split across unloaded namespaces.
- **react-intl**: messages compiled and passed to `IntlProvider`; `onError` handling; `defaultRichTextElements` for shared formatting.
- **custom**: verify the homegrown loader handles missing keys, fallback, and SSR consistency — custom setups most often miss these.

## How to report

Lead with anything that breaks rendering or silently drops a locale (catalog not loading, hydration mismatch, `dir` not locale-driven). Then dev-experience gaps (missing-key invisibility) and routing/persistence defects. Tie each to a concrete symptom ("`fa` selected but English renders because its catalog isn't imported in X").
