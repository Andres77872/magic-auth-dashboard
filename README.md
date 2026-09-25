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

## Root AI assistant

Root accounts have a floating **AI assistant** button. Open its settings to enable the assistant,
choose an Ollama, OpenAI-compatible, or Anthropic-compatible connection, and select a model that
supports tool calling. Several saved connections can be enabled together, with a default and a
per-conversation choice. Provider keys remain on the backend; blank replacement keys preserve the
saved credential.

All read tools and domain skills start enabled. Write access starts disabled and requires both the
master write switch and individual change tools. The panel and closed launcher warn while write
access is active, and proposed changes require approval. Settings group tools under users, groups,
projects, security, audit, analytics, billing, Patreon, email, and system skills. Planning, memory,
and clarification are configurable; subagents remain available.

Conversations, activity logs, task progress, provider usage, and interrupted questions are stored by
the API. Closing the panel, switching conversations, or restarting the browser does not stop a run.
The client reconnects using an atomic snapshot and durable event cursor. An interrupted connection
never automatically resends a command. Stop requests cancel a run explicitly. Server process failures
are surfaced for review rather than replaying potentially completed changes.

While a run is active the chat shows a live progress card (current step, plan checklist, tool steps,
elapsed time and tokens) and the send button becomes **Stop**. Approvals show the tool's method, path
and arguments, and can be approved or rejected with an optional reason in one step. Failed runs
offer Retry, Edit message, and a shortcut to connection settings. The launcher shows **Working**,
**Needs input**, or **New reply** while the panel is closed. The transcript stays pinned to the
latest output until you scroll up; a **Jump to latest** button re-pins it.

The assistant uses the cookie-authenticated `/admin/assistant/ws` endpoint derived from
`VITE_API_BASE_URL`. The deployment must forward WebSocket upgrades, allow the dashboard's exact
origin, and install the backend's `requirements-assistant.txt`. Local Ollama must be reachable from
the API server; custom provider hosts must be allowed in backend `ASSISTANT_PROVIDER_HOSTS`.
General FAQs do not require loading application skills. Markdown is rendered as React nodes;
Mermaid flowcharts, sequences and pies and validated chart fences render as SVG/DOM with data-table
fallbacks. Model HTML and executable diagram directives are never injected.

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
