import type { LucideIcon } from 'lucide-react';
import {
  CreditCard,
  FolderKanban,
  HeartHandshake,
  History,
  Key,
  KeyRound,
  Layers,
  LogIn,
  Mail,
  ShieldCheck,
  User,
  UserCog,
  Users,
} from 'lucide-react';
import { API_CONFIG } from '@/utils/constants';

/**
 * Copy for the public overview page. Figures and behaviour come from the
 * api.auth repository (routes, schemas, test suites) and this console; update
 * them together when either side changes.
 */

export const LINKS = {
  apiReference: `${API_CONFIG.BASE_URL}/docs`,
  redoc: `${API_CONFIG.BASE_URL}/redoc`,
  consoleRepo: 'https://github.com/Andres77872/magic-auth-dashboard',
  apiRepo: 'https://github.com/Andres77872/api.auth',
  sdkRepo: 'https://github.com/Andres77872/magic_auth_client',
} as const;

export const SECTIONS = [
  { id: 'capabilities', label: 'Capabilities' },
  { id: 'access', label: 'Access model' },
  { id: 'sessions', label: 'Sessions' },
  { id: 'console', label: 'Console' },
  { id: 'stack', label: 'Stack' },
] as const;

export interface Figure {
  value: string;
  label: string;
  detail: string;
}

export const FIGURES: Figure[] = [
  { value: '246', label: 'HTTP endpoints', detail: 'across 28 route modules' },
  {
    value: '2,000+',
    label: 'Backend tests',
    detail: 'unit, integration and end-to-end',
  },
  {
    value: '318',
    label: 'Stored procedures',
    detail: 'plus 125 triggers on MySQL 8',
  },
  {
    value: '5',
    label: 'OAuth providers',
    detail: 'Google, GitHub, Discord, Microsoft, OIDC',
  },
];

export interface Capability {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  /** Short technical tags rendered in mono. */
  tags: string[];
  /** Spans two grid columns on wide screens. */
  wide?: boolean;
}

export const CAPABILITIES: Capability[] = [
  {
    id: 'sessions',
    icon: KeyRound,
    title: 'Sign-in and sessions',
    description:
      'Root and admin operators sign in to the platform; everyone else signs in to a project. Access tokens last 15 minutes, refresh tokens rotate on every use, and both travel only as HttpOnly cookies.',
    tags: [
      'POST /auth/platform/login',
      'POST /auth/login',
      'SameSite=Strict',
      'Argon2id',
    ],
    wide: true,
  },
  {
    id: 'roles',
    icon: ShieldCheck,
    title: 'Roles and permissions',
    description:
      'Global roles bundle permission groups, and each project keeps its own role catalog. The API can explain where every effective permission came from.',
    tags: ['/roles', '/permissions', 'permission-sources'],
  },
  {
    id: 'oauth',
    icon: LogIn,
    title: 'OAuth sign-in',
    description:
      'Provider connections are bound per project and use PKCE (S256), a nonce and single-use state. Client secrets are encrypted and write-only.',
    tags: ['Google', 'GitHub', 'Discord', 'Microsoft', 'OIDC'],
  },
  {
    id: 'api-keys',
    icon: Key,
    title: 'API keys',
    description:
      'Project-scoped keys for server-to-server calls. The secret is shown once, stored as a peppered HMAC-SHA-256 digest, and expired keys are swept automatically.',
    tags: ['sk_{public_id}.{secret}'],
  },
  {
    id: 'billing',
    icon: CreditCard,
    title: 'Billing',
    description:
      'Stripe billing groups with their own encrypted credentials, a product catalog and signature-checked webhooks. Checkout accepts an Idempotency-Key.',
    tags: ['Stripe', 'Idempotency-Key', 'webhooks'],
  },
  {
    id: 'email',
    icon: Mail,
    title: 'Transactional email',
    description:
      'Versioned templates with preview, test sends and rollback. Delivery runs through a durable outbox with leases and backoff.',
    tags: ['Resend', 'outbox', 'verify · reset'],
  },
  {
    id: 'patreon',
    icon: HeartHandshake,
    title: 'Patreon entitlements',
    description:
      'Linked memberships map to tiers and entitlements, kept current by verified webhooks and a background sync worker.',
    tags: ['webhooks', 'tier map', 'sync worker'],
  },
  {
    id: 'audit',
    icon: History,
    title: 'Audit trail',
    description:
      'Request middleware and database triggers record activity and security events, filterable by user, type and time and exportable as CSV or JSON.',
    tags: ['security events', 'CSV', 'JSON'],
  },
];

export interface AccessNode {
  icon: LucideIcon;
  label: string;
  hint: string;
}

export interface AccessLane {
  id: string;
  title: string;
  question: string;
  nodes: AccessNode[];
}

export const ACCESS_LANES: AccessLane[] = [
  {
    id: 'reach',
    title: 'Reach',
    question: 'Which projects can this person sign in to?',
    nodes: [
      { icon: User, label: 'User', hint: 'root, admin or consumer' },
      { icon: Users, label: 'User group', hint: 'people who share access' },
      { icon: Layers, label: 'Project group', hint: 'a bundle of projects' },
      { icon: FolderKanban, label: 'Project', hint: 'where apps sign in' },
    ],
  },
  {
    id: 'rights',
    title: 'Rights',
    question: 'What can they do once inside?',
    nodes: [
      { icon: Users, label: 'User or group', hint: 'direct or inherited' },
      { icon: UserCog, label: 'Role', hint: 'global or per project' },
      {
        icon: ShieldCheck,
        label: 'Permission group',
        hint: 'a named set of grants',
      },
      { icon: Key, label: 'Permission', hint: 'one allowed action' },
    ],
  },
];

export interface TraceStep {
  method: 'GET' | 'POST';
  path: string;
  status: number;
  tone: 'success' | 'warning' | 'destructive';
  note: string;
}

/** A condensed session, as the console experiences it. */
export const SESSION_TRACE: TraceStep[] = [
  {
    method: 'POST',
    path: '/auth/platform/login',
    status: 200,
    tone: 'success',
    note: 'session_token (15 min) + refresh_token (path /auth), HttpOnly',
  },
  {
    method: 'GET',
    path: '/auth/validate',
    status: 200,
    tone: 'success',
    note: 'session restored on load, no token in JavaScript',
  },
  {
    method: 'GET',
    path: '/users/list',
    status: 401,
    tone: 'warning',
    note: 'access token expired',
  },
  {
    method: 'POST',
    path: '/auth/refresh',
    status: 200,
    tone: 'success',
    note: 'refresh token rotated, one refresh shared by every tab',
  },
  {
    method: 'GET',
    path: '/users/list',
    status: 200,
    tone: 'success',
    note: 'original request retried once',
  },
  {
    method: 'POST',
    path: '/auth/refresh',
    status: 401,
    tone: 'destructive',
    note: 'spent token replayed, whole family revoked',
  },
];

export interface SessionCookie {
  name: string;
  path: string;
  lifetime: string;
}

export const SESSION_COOKIES: SessionCookie[] = [
  { name: 'session_token', path: '/', lifetime: '15 min' },
  { name: 'refresh_token', path: '/auth', lifetime: 'rotates' },
];

export interface SessionPoint {
  title: string;
  body: string;
}

export const SESSION_POINTS: SessionPoint[] = [
  {
    title: 'Tokens stay out of JavaScript',
    body: 'Both cookies are HttpOnly, Secure and SameSite=Strict. The console keeps no token in storage, URLs or rendered state.',
  },
  {
    title: 'Rotation with reuse detection',
    body: 'Every refresh issues a new refresh token. Presenting a spent one outside a short grace window revokes its entire family.',
  },
  {
    title: 'One refresh at a time',
    body: 'Refreshes are serialized within a tab and coordinated across tabs, so parallel requests never look like token reuse.',
  },
  {
    title: 'Retries only where safe',
    body: 'A request gets a single refresh-and-retry after a 401. Automatic transport retries are limited to GET and HEAD.',
  },
];

export interface Repository {
  name: string;
  role: string;
  description: string;
  href: string;
  stack: string[];
}

export const REPOSITORIES: Repository[] = [
  {
    name: 'api.auth',
    role: 'API',
    description:
      'Authentication, authorization, billing, email and audit. Workers handle the email outbox, Patreon sync and billing sync.',
    href: LINKS.apiRepo,
    stack: ['Python 3.12', 'FastAPI', 'MySQL 8', 'Redis 7', 'Stripe', 'Resend'],
  },
  {
    name: 'magic-auth-dashboard',
    role: 'Console',
    description:
      'This site. A browser client over the same documented endpoints, with cookie sessions and cross-tab refresh coordination.',
    href: LINKS.consoleRepo,
    stack: [
      'React 19',
      'TypeScript',
      'Vite',
      'Tailwind CSS 4',
      'Radix UI',
      'Vitest',
    ],
  },
  {
    name: 'magic_auth_client',
    role: 'Python client',
    description:
      'Async, typed client that connected services use to log in, validate sessions, refresh and check API keys.',
    href: LINKS.sdkRepo,
    stack: ['Python 3.10+', 'httpx', 'Pydantic 2', 'asyncio'],
  },
];
