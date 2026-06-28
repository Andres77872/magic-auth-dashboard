# design-sync notes — Meridian Admin Design System

Repo is an **app** (`magic-auth-dashboard`), not a published component library. The
design system is the shadcn/ui-style primitives in `src/components/ui/`, styled with
**Meridian** Tailwind v4 tokens in `src/styles/tailwind.css`.

## Build approach (package shape, synth-entry)

- There is **no library build** — `dist/` is the built *app*, not a component library.
  We use the converter's **synth-entry mode**, scoped to `src/components/ui`.
- The `--entry` flag points at a **non-existent path** (`./dist/__synth_entry_does_not_exist.js`)
  on purpose: it (1) forces the converter's package-root walk-up to land on the repo root
  (where `src/` lives), and (2) is missing, so `resolveDistEntry` returns null and the
  synth-from-src fallback fires. Expect a `[NO_DIST] --entry ... doesn't exist` line — that
  is intentional, not an error.
- `cfg.srcDir = "src/components/ui"` scopes discovery to the UI primitives (without it,
  synth would pull in the whole app — pages, services, etc.).
- `cfg.tsconfig = "tsconfig.app.json"` lets esbuild resolve `@/...` path aliases.
- Components are discovered as **PascalCase value exports** across the `.tsx` files →
  **83 components** (every compound sub-part: Dialog*, Select*, Table*, DropdownMenu*, …).
  All land in group `general` (synth grouping can't infer better here).

## CSS / tokens

- `cfg.cssEntry = "dist/ds-styles.css"` — a **stable copy** of the Tailwind v4 compiled
  stylesheet. `cfg.buildCmd` does `vite build` then `cp dist/assets/index-*.css dist/ds-styles.css`.
  Raw `src/styles/tailwind.css` is NOT usable directly (it's a Tailwind v4 source with
  `@import 'tailwindcss'` + `@theme` that needs the compiler).
- Compiled CSS only contains utility classes **used somewhere in the app**. Component
  classes are all present (the app uses them). Authored-preview *layout glue* should stick
  to classes the components already use, or use inline styles.

## Fonts

- Geist / Geist Mono load via a **remote Google Fonts `@import`** baked into the compiled
  CSS → `[FONT_REMOTE]`, informational, nothing to ship. (JetBrains Mono also referenced as
  a mono fallback in the font stack — same remote story.)

## Scope decisions

- Synced the **public UI barrel** (per user). Popover + SearchableSelect excluded via
  `componentSrcMap` nulls (they exist in `src/components/ui/` but are not re-exported from
  the barrel).
- spinner.tsx also exports CircleSpinner / DotsSpinner / PulseSpinner (not in the barrel,
  but real file-level exports) — kept, since synth reads files. Harmless extra spinners.

## .d.ts contracts (fork)

- `.design-sync/overrides/dts.mjs` forks the bundled extractor to load `src/components/ui/*.tsx`
  into the ts-morph project (this repo ships no `.d.ts`). Result: the 20 primitives with a named
  `<Name>Props` interface (Button, Input, Card*, Badge, Avatar, Checkbox, Switch, Tooltip,
  Textarea, Progress, Slider, Skeleton, Spinner, Label) emit real prop contracts (e.g. Button
  `variant`/`size` literal unions). The ~63 Radix-forwarding compound sub-parts (Dialog*, Select*,
  Sheet*, Tabs*, DropdownMenu*, Table*) have no named `*Props` interface → they stay generic
  `[key: string]: unknown` (they forward Radix props; acceptable). Needs the
  `.design-sync/node_modules -> ../.ds-sync/node_modules` symlink (gitignored — recreate per clone).

## Previews authored (28, all graded good — first sync)

- 21 logical primitives + 7 fragment sub-parts (CardContent/Footer/Header, TableCaption/Cell/Head,
  DropdownMenuLabel). 52 compound sub-parts ship the floor card by design (the agreed baseline).
- Import convention: `import { X } from 'magic-auth-dashboard'` (shimmed to window.Meridian).
  Layout glue uses inline `style` with `var(--color-*)`/`var(--font-mono)` tokens (NOT new Tailwind
  utility classes — Tailwind v4 prunes unused ones).
- **Overlays** (Dialog, Sheet, Select, DropdownMenu, DropdownMenuLabel, Tooltip): authored with
  `open`/`defaultOpen` so the open state renders statically; Radix Popper positions correctly in
  headless chromium. Config `cfg.overrides.<Name> = {cardMode:single, viewport, primaryStory}`.
  Tooltip needs `<TooltipProvider>` wrapped in the preview (done per-preview, not via cfg.provider).
- **Wide components** use `cfg.overrides.<Name> = {cardMode:column}`: Table + Table fragments,
  Card, CardHeader, Tabs, Textarea.
- Component quirks: Checkbox indeterminate = `checked="indeterminate"` (string); Slider uncontrolled
  = `defaultValue={[n]}` (array); Tabs needs `defaultValue` to show a panel statically; Avatar tint
  is name-derived (vary `name` for distinct colors), `xs` too small for 2 initials (faithful).

## Known render warns (triaged — re-sync should expect these, not treat as new)

- First (floor) build flagged 15 `bad` (RENDER_BLANK/THIN) on the leaf primitives + 7 fragments;
  ALL cleared once previews were authored. Final build: render check 83/83 clean, 0 `bad`.
- `[RENDER_THIN] CircleSpinner` — an unauthored spinner-variant floor card (a tiny spinner that
  paints little). Intentional floor card, not a failure.
- `[GRID_OVERFLOW]` on Table family / Card / CardHeader / Tabs / Textarea is RESOLVED by
  `cardMode:column` overrides (column cards can't re-flag wide by construction).
- `[FONT_REMOTE]` Geist / Geist Mono / JetBrains Mono — remote @import, expected.

## Re-sync risks

- The `--entry <nonexistent>` + `srcDir` synth trick is load-bearing. If a future converter
  version changes synth-entry behavior, revisit.
- `dist/ds-styles.css` is regenerated by `buildCmd`; it is gitignored. Always run `buildCmd`
  before the converter on re-sync.
- Tailwind v4 prunes unused utilities — if a NEW component uses a class no existing component
  used, recompiled CSS will include it (it's in the app), but a class used ONLY in an authored
  preview wrapper may be absent. Prefer inline styles for preview-only layout.
- The `dts.mjs` fork hardcodes `src/components/ui` as the source scope. If the DS source moves,
  update the fork (and keep `cfg.srcDir` in sync). On re-sync, diff the fork against the bundled
  `lib/dts.mjs` and merge upstream changes. The fork needs the gitignored node_modules symlink —
  recreate it on a fresh clone: `ln -sfn ../.ds-sync/node_modules .design-sync/node_modules`.
- Overlay previews depend on Radix `open`/`defaultOpen` + Popper positioning rendering in headless
  chromium. If a Radix major bump changes this, the overlay cards may need re-checking.
- If new compound components are added upstream, they'll discover as generic `[key:string]:unknown`
  unless they export a named `<Name>Props` interface — expected, same as the current 63.
