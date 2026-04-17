# Magic Auth Dashboard

Admin dashboard for the Magic Auth authentication system with 3-tier user management (ROOT, ADMIN, CONSUMER) and comprehensive RBAC support.

## Stack

- **React 19** + **TypeScript 5.8**
- **Vite 7** (build tool)
- **Tailwind CSS 4** + **shadcn/ui** (22 components)
- **Radix UI** primitives
- **React Router 7**
- **React Hook Form**
- **Lucide React** icons
- **Vitest** + **Testing Library** + **fast-check** (testing)

## Quick Start

```bash
npm install
npm run dev          # Start dev server (http://localhost:5173)
```

## Scripts

| Command                | Description                         |
| ---------------------- | ----------------------------------- |
| `npm run dev`          | Start development server            |
| `npm run build`        | TypeScript check + production build |
| `npm run preview`      | Preview production build            |
| `npm run type-check`   | TypeScript type checking only       |
| `npm run lint`         | ESLint with strict warnings         |
| `npm run lint:fix`     | ESLint with auto-fix                |
| `npm run format`       | Prettier format                     |
| `npm run format:check` | Prettier check                      |
| `npm run test`         | Vitest (watch mode)                 |
| `npm run test:run`     | Vitest (single run)                 |

## Project Structure

```
src/
├── components/
│   ├── auth/          # Auth-related UI
│   ├── common/        # Shared components (DataView, ErrorBoundary, etc.)
│   ├── features/      # Feature-specific components (users, projects, groups, permissions)
│   ├── forms/         # Form components
│   ├── guards/        # Route protection
│   ├── layout/        # Dashboard layout (sidebar, header, breadcrumbs)
│   ├── navigation/    # Navigation components
│   └── ui/            # shadcn/ui components (22)
├── contexts/          # React contexts (Auth)
├── hooks/             # Custom hooks
├── lib/               # Shared utilities
├── pages/             # Page components (auth, dashboard, users, projects, groups, permissions)
├── services/          # API client and services
├── styles/            # globals.css + tailwind.css (@theme config)
├── test/              # Test utilities
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```

## Documentation

See [docs/README.md](docs/README.md) for the full documentation index, including API usage guides, feature specs, and archived historical docs.

---

**License**: MIT
