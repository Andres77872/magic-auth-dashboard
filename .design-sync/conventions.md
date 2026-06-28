# Meridian — building with this design system

Meridian is the component library for a **user-management admin console** (members,
roles, permissions, sessions, audit log, groups). The feel is **dense, calm, technical —
a control surface, not a brochure**. No decorative motion.

## Setup & wrapping

- Components are the real compiled React components on **`window.Meridian`** (imported from
  the bundle). Compose them with the props documented in each `<Name>.d.ts` / `<Name>.prompt.md`.
- **Theme is class-based.** Two themes share one blue-gray hue (256): a dark **"ink"** theme
  and a light theme. Light is the default; **add `class="dark"` to a root element (e.g. `<html>`
  or the app shell) to get the dark "ink" theme** (the product's usual mode). Every color is a
  CSS variable that flips with the theme — never hard-code hex.
- **Tooltips require a provider:** wrap tooltip trees in `<TooltipProvider>` or nothing renders.
  Other components are self-contained (no global provider needed).
- **Fonts:** `font-sans` is **Geist** (UI); **`font-mono` is Geist Mono** — use it for IDs, IPs,
  timestamps, tokens, anything copy-pasteable. Loaded by the stylesheet; no setup needed.

## Styling idiom — Tailwind v4 utilities mapped to semantic tokens

Style with **utility classes bound to Meridian's semantic tokens** (NOT raw hex, NOT invented
class names). The real families (all resolve to theme-aware `var(--color-*)`):

| Purpose | Classes |
|---|---|
| Surfaces | `bg-background` (app canvas) · `bg-card` · `bg-popover` · `bg-muted` · `bg-secondary` |
| Text | `text-foreground` · `text-muted-foreground` (secondary) · `text-card-foreground` |
| Accent (use sparingly) | `bg-primary` / `text-primary` / `text-primary-foreground` (the single azure) |
| Borders / focus | `border-border` · `border-input` · `ring-ring` |
| Quiet status tints | `bg-success-subtle` `text-success-subtle-foreground` · same for `warning`/`destructive`/`info`/`primary`/`muted` |
| Radius | `rounded-sm` `rounded-md` `rounded-lg` (4/6/8/12px) · `rounded-full` (pills) |
| Type helpers | `.ds-display` `.ds-h1` `.ds-h2` `.ds-h3` · `.ds-overline` (11px uppercase tracked eyebrow) |

For inline styles, the same tokens are CSS variables: `var(--color-muted-foreground)`,
`var(--font-mono)`, `var(--radius-lg)`, etc.

**Brand rules that make a design read as Meridian:**
- **Sentence case everywhere** (buttons, menus, headers, columns) — never Title Case. Acronyms
  stay capped (SSO, API, MFA, RBAC). Buttons are **verbs** ("Invite member", "Revoke access").
- **Azure accent used sparingly** — primary buttons, active nav, focus rings, key metrics. If
  everything is blue, nothing is.
- **Semantic colors are quiet tints, never solid fills** — status pills/alerts use `*-subtle`
  bg + saturated text (Meridian has no solid red/green button fills). Status language: **Active /
  Invited / Pending / Suspended / Deactivated**.
- **Borders do the work, not shadows** (shadows are for overlays only). **No gradients.**
- Numerals always ("3 roles"); tabular figures in number columns; relative time in lists ("2h ago").

## Where the truth lives

Read the bound stylesheet `styles.css` (it `@import`s `_ds_bundle.css`, which defines every
token and component style) before styling, and each component's `<Name>.d.ts` (prop contract)
and `<Name>.prompt.md` (usage) before composing it.

## Idiomatic example

```tsx
// A member row — library components for the controls, token classes for layout glue.
<Card className="p-4">
  <div className="flex items-center justify-between">
    <div>
      <div className="font-medium text-foreground">Dana Whitfield</div>
      <div className="text-sm text-muted-foreground font-mono">usr_8Kd2p · 2h ago</div>
    </div>
    <div className="flex items-center gap-3">
      <Badge variant="success" dot>Active</Badge>
      <Button variant="secondary" size="sm">Edit role</Button>
      <Button variant="destructive" size="sm">Suspend user</Button>
    </div>
  </div>
</Card>
```
