# Magic Auth Dashboard

Admin console for the [Magic Auth](https://github.com/Andres77872/api.auth) platform. Root and admin
operators use it to manage users, user groups, projects, project groups, global roles, permission
groups, API keys, billing, OAuth connections and the audit trail. Consumers never sign in here.

## Stack

- **React 19** + **TypeScript 6** (strict)
- **Vite 8**
- **Tailwind CSS 4** with the Meridian design tokens (`src/styles/tailwind.css`)
- **Radix UI** primitives wrapped as shadcn-style components (`src/components/ui`)
- **React Router 7**
- **Lucide React** icons
- **Vitest** + **Testing Library** + **fast-check**

## Quick start

This project uses **[pnpm](https://pnpm.io/) 11** (pinned via `packageManager`).

```bash
corepack enable          # one-time: makes the pinned pnpm available
pnpm install
pnpm dev                 # http://localhost:5780
```

Point `VITE_API_BASE_URL` (see `.env.development`) at the running api.auth instance. The API must list
`http://localhost:5780` in `ALLOWED_ORIGINS`, because every request sends cookies.

## Scripts

| Command             | Description                                 |
| ------------------- | ------------------------------------------- |
| `pnpm dev`          | Development server on port 5780             |
| `pnpm build`        | Type-check the projects, then build         |
| `pnpm preview`      | Preview the production build (port 4173)    |
| `pnpm type-check`   | `tsc -b` over the app and tooling projects  |
| `pnpm lint`         | ESLint, zero warnings allowed               |
| `pnpm lint:fix`     | ESLint with auto-fix                        |
| `pnpm format`       | Prettier                                    |
| `pnpm format:check` | Prettier check                              |
| `pnpm test`         | Vitest (watch)                              |
| `pnpm test:run`     | Vitest (single run)                         |

## What's in the console

| Area                 | Route                                  | Notes                                                        |
| -------------------- | -------------------------------------- | ------------------------------------------------------------ |
| Overview             | `/`                                    | Platform totals, users by type, activity, service health     |
| Users                | `/users`, `/users/:hash`               | Filters in the URL, bulk actions, profile with access tabs   |
| User groups          | `/groups`, `/groups/:hash`             | Members, project-group grants, permission-group grants       |
| Projects             | `/projects`, `/projects/:hash`         | Members, groups, administrators, sign-in, catalog, settings  |
| Project groups       | `/groups?tab=project-groups`           | Projects and the user groups they are granted to             |
| Roles & permissions  | `/permissions`                         | Roles, permission groups, permissions, user-group grants     |
| API keys             | `/tokens`                              |                                                              |
| Audit log            | `/audit`                               | Activity for everyone; security and statistics for root      |
| Billing, OAuth       | `/billing`, `/oauth`                   |                                                              |
| System (root)        | `/system`, `/email-templates`, `/system/patreon` |                                                    |
| Personal             | `/profile`, `/settings`                | Your access and your session                                 |

Press <kbd>⌘K</kbd> / <kbd>Ctrl K</kbd> anywhere to jump to a page or search users, projects and groups.

## Project structure

```
src/
├── components/
│   ├── auth/          # Sign-in form
│   ├── common/        # App primitives: PageHeader, Panel, DataView, TablePager, TabNavigation, …
│   ├── features/      # Domain UI (users, groups, projects, permissions, audit, billing, oauth, …)
│   ├── guards/        # Route guards (admin, root-only, public)
│   ├── layout/        # App shell: sidebar, top bar, breadcrumbs
│   ├── navigation/    # Sidebar navigation, account menu, command palette
│   └── ui/            # Radix/shadcn primitives
├── contexts/          # Auth, theme, toast, breadcrumb label
├── hooks/             # Data hooks (useAsyncData, useTabParam, domain hooks)
├── pages/             # Route-level pages
├── services/          # api.auth clients (request.ts helpers over api.client.ts)
├── styles/            # Tailwind 4 theme + globals
├── types/             # API contract types
└── utils/             # Routes, formatters, activity labels, permissions helpers
```

## Documentation

- [docs/UI_CONVENTIONS.md](docs/UI_CONVENTIONS.md): how pages, primitives and the data layer fit together.
- [docs/README.md](docs/README.md): documentation index, API usage guides and archived material.
- [AGENTS.md](AGENTS.md): working agreement for contributors and coding agents.

---

**License**: MIT
