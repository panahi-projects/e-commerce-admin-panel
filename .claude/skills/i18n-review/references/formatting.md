# Date, number & currency formatting

Locale-correct formatting is where Farsi localization most often falls short: Gregorian dates shown to Persian users, Latin digits where Persian digits are expected, or currency in the wrong convention. Hardcoded formats are the enemy.

## Dates & times

**Hardcoded/Gregorian formatting for Farsi.** `date.toLocaleDateString('en-US')`, manual `MM/DD/YYYY`, or `dayjs().format('YYYY-MM-DD')` without the Jalali plugin all show the wrong calendar to Persian users. Persian users expect the **Jalali/Shamsi** calendar.
- This project uses `jalali-plugin-dayjs` — verify it's applied wherever dates render for `fa`, and that the *Gregorian* path is used for `en`. A common bug: Jalali applied globally (English users see Shamsi) or never (Persian users see Gregorian).
- Prefer locale-aware APIs: `Intl.DateTimeFormat('fa-IR', { calendar: 'persian' })`, or the dayjs Jalali plugin gated on locale. Flag manual format strings that bypass locale.
- **Persian digits in dates**: Shamsi dates for `fa` typically use Persian numerals (۱۴۰۳/۰۹/۲۱). Check the digit rendering matches the locale expectation.
- Relative time ("3 days ago") must be localized — `Intl.RelativeTimeFormat`, not English-only strings.
- Timezone: ensure dates are formatted in the user's expected zone (Iran is UTC+3:30, a half-hour offset that naive handling gets wrong).

## Numbers

**Persian vs Latin digits.** Farsi UI commonly renders numerals as Persian (۰۱۲۳۴۵۶۷۸۹). Check whether the project's convention is Persian digits for `fa`, and that it's applied consistently (a util or `toLocaleString('fa-IR')`) — not Persian in some places, Latin in others. Conversely, keep digits LTR/Latin where required (e.g. precise crypto amounts, addresses) and pinned `dir="ltr"`.

**Separators.** Decimal and thousands separators differ by locale. `Intl.NumberFormat(locale)` handles this; hardcoded `,`/`.` insertion does not. Flag manual separator logic.

**Percentages, units.** Use `Intl.NumberFormat` with `style: 'percent'`/`unit` rather than appending symbols, so placement/format follows locale.

## Currency

**Toman vs Rial.** Iranian currency has a convention wrinkle: prices are often displayed in **Toman** (1 Toman = 10 Rial) even when stored in Rial. Verify the display unit matches the project's convention and is labeled (تومان / ریال) — a 10× error here is a serious, user-visible bug. Check conversions are consistent across the app.
- For a crypto exchange, also check crypto amounts: correct decimal precision per asset, no locale digit-grouping inside a precise token value, amounts pinned LTR.
- Use the i18n lib's currency formatting or `Intl.NumberFormat(locale, { style: 'currency', currency })` where applicable; note that `IRR`/`IRT` handling may need custom formatting since Toman isn't an ISO code.

## How to report

Lead with anything that produces a *wrong value or wrong calendar* for a shipped locale (Gregorian dates for `fa`, Toman/Rial mismatch — these are correctness bugs, top priority), then digit-convention inconsistencies (Persian vs Latin applied unevenly), then separator/relative-time/timezone issues. Name the file, the current formatting, and the locale-aware replacement. Distinguish "wrong value" (urgent) from "wrong style" (polish).
