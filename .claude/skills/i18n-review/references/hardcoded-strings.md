# Hardcoded / untranslated strings

User-facing text rendered as literals instead of going through the translation API. The most common i18n gap — these strings stay in the source language no matter the locale. Rank by how visible the string is to users.

## Where they hide

**JSX text nodes.** `<button>Submit</button>`, `<h1>Welcome</h1>`, `<p>No results found</p>`. The obvious case. Should be `t('...')` / `<FormattedMessage>` / `<Trans>`.

**Translatable attributes.** Easy to miss because they're not between tags:
- `placeholder="Search"`, `title="Close"`, `alt="Profile photo"`
- `aria-label="Menu"`, `aria-description`, `aria-placeholder`
- `value`/`label` on options, `<option>Choose…</option>`
These are user-facing (alt/aria especially for accessibility) and must be translated.

**Imperative strings.** Text created in JS, not JSX:
- `toast.success('Saved!')`, `alert('Are you sure?')`
- thrown/displayed error messages shown to users
- `confirm()`/dialog copy, notification text
- chart labels, table headers built in code, dynamically constructed option lists

**Concatenation & template literals.** `` `Hello ${name}` `` or `'Welcome ' + name` — not just untranslated but unstructured; must become a message with interpolation (`t('welcome', {name})`) so translators control word order. See `messages.md`.

**Enums / constant maps rendered to UI.** Status labels, category names, role names stored as English constants and shown directly. These need a key mapping per value.

## What is NOT a violation (verify before flagging)

- Content explicitly LTR/locale-neutral: code samples, URLs, emails, wallet addresses, IDs.
- Brand/product names that stay constant across locales (confirm — some brands localize).
- Developer-only strings: `console.log`, error messages never shown to users, test fixtures, comments.
- `data-*` attributes and non-visible technical values.

Mark ambiguous cases "review" rather than asserting they must be translated.

## How to detect

`scripts/scan_i18n.sh` greps for JSX text and translatable attributes containing letters, then filters obvious non-UI. Treat hits as candidates: open the file and confirm the string is user-facing and not already wrapped. A high-signal heuristic: a literal with two+ words and a space, inside JSX or a UI-rendering call, that isn't passed to `t()`.

## How to report

Group by area/component with counts: "38 hardcoded strings — 22 JSX text, 11 attributes (placeholder/aria), 5 toast/error — across 14 files." List the highest-visibility ones explicitly (primary buttons, headings, checkout/auth flows). Wrapping a bare literal in the project's `t()` with a new key is largely mechanical and safe to offer to apply — but the actual translated value (especially Farsi copy) needs a human or a confirmed source, so scaffold the key and mark the translation "to fill."
