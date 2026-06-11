# Inconsistent variants of one thing

The same semantic element rendered with slightly different styling across the app: buttons with three different paddings, cards with four different shadows, headings at inconsistent sizes. Usually a symptom of a variant API that's missing or not being used.

## What to look for

**Drifting instances of one primitive.** The canonical `Button` exists, but call sites override it inconsistently: `<Button className="rounded-full">` here, `<Button className="px-6 py-3">` there, a `<Button className="bg-green-500">` somewhere else. Each override is a small drift from the variant set.

**Bespoke restyles that match an existing variant.** A custom-styled element that is effectively a variant the primitive already offers — `<button className="bg-transparent hover:bg-muted ...">` is just `<Button variant="ghost">`. The fix is using the variant, not the bespoke classes.

**Missing variants that should exist.** If the same non-canonical styling recurs across many places (e.g. a "subtle" button appears 15 times via ad-hoc classes), that's signal the primitive needs a new official variant, after which all 15 sites use it. Recurrence is the difference between "fold into an existing variant" and "promote to a new variant."

**Inconsistent scales for the same role.** Headings using `text-xl` / `text-[22px]` / `text-2xl` interchangeably for the same level; inconsistent gap rhythm between similar sections; cards with `shadow-sm` / `shadow-md` / custom shadow for the same card type. Pick the canonical value per role and align them.

**Color-role inconsistency.** The same semantic intent expressed with different tokens — destructive actions sometimes `text-red-500`, sometimes `text-destructive`, sometimes a hex. Consolidate to the semantic token.

## How to report

Cluster by element/role: "Button has 6 distinct styling patterns across 40 usages → 4 map to existing variants (default/ghost/outline/link); 2 recurring patterns warrant new variants (`subtle`, `pill`)." Show, per cluster, which instances collapse into which canonical variant and which justify a new one. Prioritize by how visible the inconsistency is to users (primary actions, headings) over rarely-seen surfaces. Note that aligning variants can shift appearance slightly — worth a visual pass.
