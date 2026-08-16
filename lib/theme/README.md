# Theming — how components consume tokens

The public site is restyled from `/admin/settings/theme`. This is what a
component has to do to follow along, and the handful of ways to accidentally
opt out.

## The short version

Use the semantic Tailwind classes you already use. `bg-background`,
`text-foreground`, `text-muted-foreground`, `bg-card`, `border-border`,
`bg-primary`, `text-brand`, `rounded-lg`. That is the whole contract — those
utilities compile to `var(--background)` and friends, and the theme overrides
those variables. Nothing else is needed.

## The rules

**Never hardcode a colour.** Not a hex, not `rgb()`, not a Tailwind palette
class like `bg-green-100`. Those are invisible to the theme, so a restyled site
gets a stripe of the old palette across whatever you wrote. Reach for the
semantic token whose *meaning* matches: `muted` for a recessed panel, `accent`
for a hover ground, `brand` for the accent colour, `destructive` for danger.

**Never pick a foreground yourself.** Every surface token has a matching
foreground — `bg-primary` pairs with `text-primary-foreground`, `bg-brand` with
`text-brand-foreground`, `bg-card` with `text-card-foreground`. Those pairs are
*solved* for WCAG AA contrast when the theme is derived (see `derive.ts`), so
using the pair is what makes a component accessible in every theme. Choosing
`text-white` on a themed fill throws that guarantee away and will fail against
a light brand colour.

**Never set `font-family` to a literal.** Use `--theme-font-body` and
`--theme-font-display`, always with a fallback:

```css
font-family: var(--theme-font-display, var(--font-fraunces), Georgia, serif);
```

The fallback matters: the variable is only defined inside `.site-theme`, so the
same declaration gives themed type on the public site and the house Fraunces on
admin screens, which is deliberate — see "What is not themed" below.

**Watch inline styles.** An inline `style={{ fontFamily: ... }}` or
`style={{ color: ... }}` beats every stylesheet rule, including the theme's. If
a component genuinely needs one, it has to name the token itself. This is not
hypothetical — the hero headline and the logo wordmark both set the display face
inline, and both had to be pointed at `--theme-font-display` before the admin's
font choice did anything at all. Grep for `style={{` before assuming a component
is theme-clean.

**Radius comes from `--radius`.** Use `rounded-sm/md/lg/xl`; all four are
`calc()`ed off the one variable, so a single admin control moves them together.
A literal `rounded-[14px]` opts out.

## What is not themed, on purpose

- **`/admin`** — the dashboard keeps the house palette. The theme block is
  scoped to `:root:has(.site-theme)`, and only the public layout carries that
  wrapper. A theme that made text unreadable must never be able to hide the
  screen where you would fix it.
- **`--sidebar-*` and `--chart-*`** — admin chrome, same reason.
- **`--destructive`** — "danger" has a learned meaning; it is not a matter of
  taste. Fixed in both modes.

## Dark mode

Dark is a parallel token set, not a filter. Write `bg-card text-card-foreground`
once and both modes work — do not add `dark:` variants for colour. A `dark:`
override is a hardcoded decision that a themed dark palette cannot adjust.

Visitors switch light/dark themselves and that choice is theirs; the admin only
sets which one a first-time visitor lands on.

## Adding a token

1. Add the name to `TOKEN_NAMES` in `tokens.ts`.
2. Derive it in `deriveTokens` in `derive.ts` — a surface offset if nothing sits
   on it, a solved contrast pairing if it will ever hold text.
3. Add it to `app/globals.css` (`:root`, `.dark`, and `@theme inline`) so the
   fallback palette and the Tailwind utility both exist.
4. If it holds text, add the pairing to `TEXT_PAIRS` in `derive.test.ts` — that
   sweep is what keeps the accessibility guarantee true.

## Adding a font

Two steps, both required, because `next/font` resolves families at build time
from static literals and can never load a name that came from the database:

1. An entry in `FONTS` in `fonts.ts`.
2. A `next/font/google` declaration in `app/layout.tsx`, with `preload: false`
   unless it is a default, and its variable added to the `<html>` className.

The variables must be declared on `<html>`, not `<body>` — the theme block sets
`--theme-font-*` at `:root`, and a custom property referencing a variable that is
undefined *at that element* is invalid at computed-value time, which silently
collapses the whole declaration to its fallback.
