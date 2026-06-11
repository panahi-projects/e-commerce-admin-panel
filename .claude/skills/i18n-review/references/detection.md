# Detection: identifying the i18n setup

Before judging coverage or correctness, determine which mechanism the project uses, the locale set, and where messages live. Everything else is measured against this.

## Identify the library

Check `package.json` dependencies and grep usage:

| Library | Dependency | Usage signals | Catalog format |
|---------|-----------|---------------|----------------|
| **next-intl** | `next-intl` | `useTranslations`, `getTranslations`, `NextIntlClientProvider`, `messages/*.json` | ICU MessageFormat, nested JSON |
| **next-i18next / i18next** | `i18next`, `react-i18next`, `next-i18next` | `useTranslation`, `t('ns:key')`, `i18n.changeLanguage`, `public/locales/<lng>/<ns>.json` | i18next interpolation `{{var}}`, namespaces |
| **react-intl (FormatJS)** | `react-intl` | `useIntl`, `<FormattedMessage>`, `intl.formatMessage`, `defineMessages` | ICU, often `lang/*.json` compiled |
| **Lingui** | `@lingui/core` | `<Trans>`, `t` macro, `.po`/`.json` catalogs | ICU, macro-extracted |
| **Custom** | none of the above | a local hook/util like `useT`, a `translations` object, `t(key)` from a homegrown module | whatever they invented — infer it |

If custom: find the access function and the catalog object/files by following an example string from UI back to its source. Treat that function as the "translation API" for the rest of the audit.

## Find locales, default, and fallback

```bash
# config files that usually declare locales
grep -rnE "locales?\s*[:=]|defaultLocale|fallbackLng|i18n\s*[:=]" \
  next.config.* i18n.* src app 2>/dev/null | head
# catalog directories
ls messages 2>/dev/null; ls -R public/locales 2>/dev/null | head; ls src/locales lang 2>/dev/null
```

Record: the full locale list, the default locale, and the fallback. Expect Farsi (`fa`) here; confirm it's actually wired (config + catalog + routing), not half-added.

## Find catalogs and their shape

Open one catalog per locale and note: flat (`"home.title"`) vs nested (`{ "home": { "title": ... }}`), namespaced or single-file, and the interpolation/plural syntax (ICU `{count, plural, one {#} other {#}}` vs i18next `{{count}}` + `_plural` suffix keys). Coverage checks in `coverage.md` depend on matching this shape.

## Find direction & locale wiring

```bash
grep -rnE 'dir=|lang=|setLocale|usePathname|locale\b' app src 2>/dev/null | grep -iE 'dir|lang|locale' | head
```
Confirm `<html lang>` and `dir` are set per active locale (RTL for `fa`), and how locale is detected (path prefix `/fa/...`, cookie, domain, header). RTL and SSR-correctness findings build on this.

## Output of detection

A compact setup summary: library + version, locale list (default/fallback), catalog location/shape, translation API, and direction wiring. Note anything half-configured — those are findings in themselves.
