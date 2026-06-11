# Plurals, interpolation & message structure

Messages that are technically translated but structurally broken: wrong plurals, mismatched variables, or sentences assembled from fragments that can't translate. These produce grammatically wrong output even at 100% key coverage.

## Pluralization

**English-style pluralization in code.** `` `${n} item${n === 1 ? '' : 's'}` `` hardcodes English plural rules and bypasses translation entirely. Must use the i18n lib's plural support (ICU `{count, plural, ...}` or i18next `_one`/`_other` keys).

**Missing/incorrect plural categories.** Different languages have different plural category sets. The message must provide the categories the *target* languages need:
- English: `one`, `other`.
- **Persian/Farsi**: CLDR defines `one` and `other` (Persian's plural rules are simple, but still go through the plural mechanism — don't hardcode). Ensure `fa` plural messages exist where `en` has them.
- Languages like Arabic (`zero/one/two/few/many/other`) or Russian (`one/few/many/other`) need more — if those locales are supported, a message with only `one/other` is incomplete.
Flag plural messages that don't cover the categories their locales require.

**ICU syntax errors.** Malformed `{count, plural, one {# item} other {# items}}` — unbalanced braces, missing `other` (required), wrong keyword — fails at runtime. Validate the ICU in catalogs.

## Interpolation

**Variable mismatch.** A code call `t('greeting', { name })` whose message has no `{name}`, or a message with `{count}` that code never supplies. Both render wrong. Cross-check the variable set in each key's value against the call sites, and across locales (the `fa` value must use the same variables as `en`).

**Wrong interpolation syntax for the lib.** ICU `{name}` vs i18next `{{name}}` vs react-intl `{name}` — a value using the wrong delimiters for the configured library won't substitute. Verify catalogs match the lib.

**Unescaped HTML / rich text.** Messages needing bold/links handled by raw HTML injection (XSS risk) instead of the lib's rich-text mechanism (`<Trans>` components, ICU tags, `b: (chunks) => ...`). Flag string concatenation building markup.

## Sentence structure

**Concatenated fragments.** Building a sentence from multiple `t()` calls or `t()` + variable + `t()` bakes in source-language word order and grammar. RTL/Farsi especially breaks here. The whole sentence should be one message with placeholders so translators control order:
- Bad: `{t('you have')} {count} {t('messages')}`
- Good: `t('inbox.count', { count })` → `"شما {count} پیام دارید"` / ICU plural.

**Gender/context assumptions.** Strings that assume a gender or grammatical context the target language inflects differently. Note where a single key is reused in contexts that need different translations (same English word, different translation) — those need separate keys.

## How to report

Group: hardcoded plurals (count, files), ICU/syntax errors (must-fix, break at runtime), variable mismatches (likely bugs), and concatenated sentences (need restructuring into single messages). Mark runtime-breaking issues (bad ICU, missing `other`, variable mismatch) as high priority; sentence restructuring as medium (correct but more work). Restructuring messages changes keys and translations — recommend a human pass, don't silently rewrite Farsi grammar.
