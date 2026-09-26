import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/utils/routes';
import {
  AccessModel,
  ApiStatusPill,
  CapabilityGrid,
  ConsoleAreas,
  ConsolePreview,
  GithubIcon,
  LANDING_CONTAINER,
  LandingFooter,
  LandingHeader,
  LandingSection,
  RepositoryCards,
  SessionTrace,
  type ConsoleAction,
} from './components';
import { FIGURES, LINKS } from './landing-content';

const HERO_STACK = [
  'FastAPI',
  'MySQL 8',
  'Redis 7',
  'React 19',
  'Tailwind CSS 4',
];

function Hero(): React.JSX.Element {
  return (
    <section aria-labelledby="hero-title" className="relative isolate">
      {/* Faint grid and glow behind the hero; decorative only. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[720px] bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:56px_56px] opacity-50 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_30%,transparent_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[340px] -z-10 h-[360px] w-[min(900px,90vw)] -translate-x-1/2 rounded-full bg-primary/20 blur-[110px]"
      />

      <div className={cn(LANDING_CONTAINER, 'pb-8 pt-16 sm:pt-24')}>
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <ApiStatusPill />
          <h1
            id="hero-title"
            className="m-0 mt-7 text-[36px] font-semibold leading-[1.04] tracking-[-0.035em] text-foreground sm:text-6xl lg:text-[68px]"
          >
            Identity and access, handled once.{' '}
            <span className="block text-muted-foreground">
              Shared by every project.
            </span>
          </h1>
          <p className="m-0 mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Magic Auth is an authentication and authorization service with its
            own management console: platform and project sign-in, rotating
            cookie sessions, groups-of-groups access control, OAuth, API keys,
            billing entitlements and a complete audit trail.
          </p>
          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
            <Button asChild size="xl">
              <a
                href={LINKS.apiReference}
                target="_blank"
                rel="noopener noreferrer"
              >
                <BookOpen aria-hidden="true" />
                Explore the API
                <ArrowUpRight aria-hidden="true" />
              </a>
            </Button>
            <Button asChild size="xl" variant="secondary">
              <a
                href={LINKS.consoleRepo}
                target="_blank"
                rel="noopener noreferrer"
              >
                <GithubIcon size={16} />
                Browse the source
              </a>
            </Button>
          </div>
          <ul className="m-0 mt-6 flex list-none flex-wrap justify-center gap-x-2.5 gap-y-1 p-0 font-mono text-[11px] text-muted-foreground">
            {HERO_STACK.map((item, index) => (
              <li key={item} className="whitespace-nowrap">
                {index > 0 && (
                  <span aria-hidden="true" className="mr-2.5">
                    ·
                  </span>
                )}
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto mt-16 max-w-5xl sm:mt-20">
          <ConsolePreview />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-28 rounded-b-xl bg-linear-to-t from-background to-transparent"
          />
        </div>
      </div>
    </section>
  );
}

function Figures(): React.JSX.Element {
  return (
    <section
      aria-label="By the numbers"
      className={cn(LANDING_CONTAINER, 'pb-20')}
    >
      <dl className="m-0 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border lg:grid-cols-4">
        {FIGURES.map((figure) => (
          <div key={figure.label} className="bg-background px-5 py-6 sm:px-6">
            <dt className="text-sm text-foreground">{figure.label}</dt>
            <dd className="m-0 mt-2 text-3xl font-semibold tracking-[-0.02em] tabular-nums text-foreground sm:text-4xl">
              {figure.value}
            </dd>
            <dd className="m-0 mt-1 text-xs text-muted-foreground">
              {figure.detail}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function ClosingSection({
  consoleAction,
}: {
  consoleAction: ConsoleAction;
}): React.JSX.Element {
  return (
    <section
      aria-labelledby="closing-title"
      className="border-t border-border/70 py-20 sm:py-24"
    >
      <div className={LANDING_CONTAINER}>
        <div className="relative isolate overflow-hidden rounded-2xl border border-border bg-card px-6 py-14 text-center sm:px-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-0 -z-10 h-48 w-[min(640px,80vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/25 blur-[90px]"
          />
          <h2
            id="closing-title"
            className="m-0 text-3xl font-semibold tracking-[-0.025em] text-foreground sm:text-4xl"
          >
            Take a look under the hood.
          </h2>
          <p className="mx-auto m-0 mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
            The API reference documents every endpoint and can call them in
            place. The console signs in root and admin accounts.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to={consoleAction.to}>
                {consoleAction.longLabel}
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <a
                href={LINKS.apiReference}
                target="_blank"
                rel="noopener noreferrer"
              >
                <BookOpen aria-hidden="true" />
                API reference
              </a>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <a href={LINKS.redoc} target="_blank" rel="noopener noreferrer">
                ReDoc
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Public overview of Magic Auth: what the platform does and how it works. Shown
 * at `/` to signed-out visitors and at `/about` to everyone. It calls only the
 * public `GET /system/ping`.
 */
export function LandingPage(): React.JSX.Element {
  const { isAuthenticated } = useAuth();
  const consoleAction: ConsoleAction = isAuthenticated
    ? {
        to: ROUTES.HOME,
        label: 'Open the console',
        longLabel: 'Open the console',
      }
    : {
        to: ROUTES.LOGIN,
        label: 'Sign in',
        longLabel: 'Sign in to the console',
      };

  return (
    <div id="top" className="min-h-screen bg-background text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:text-foreground focus:shadow-md"
      >
        Skip to content
      </a>
      <LandingHeader consoleAction={consoleAction} />

      <main id="main">
        <Hero />
        <Figures />

        <LandingSection
          id="capabilities"
          eyebrow="Capabilities"
          title="Everything between a user and a project."
          description="Sign-in, sessions and permissions sit next to the operational pieces that usually get bolted on later: OAuth providers, API keys, billing, email and auditing."
        >
          <CapabilityGrid />
        </LandingSection>

        <LandingSection
          id="access"
          eyebrow="Access model"
          title="Groups of groups, not access lists."
          description="Access is resolved through groups instead of per-user lists. Reach decides which projects a person can enter; rights decide what they can do there."
        >
          <AccessModel />
        </LandingSection>

        <LandingSection
          id="sessions"
          eyebrow="Sessions"
          title="Short-lived tokens that rotate."
          description="The browser holds two HttpOnly cookies and nothing else. Here is a condensed session as the console sees it."
        >
          <SessionTrace />
        </LandingSection>

        <LandingSection
          id="console"
          eyebrow="Console"
          title="A screen for every part of the API."
          description="Grouped the way the sidebar groups them. Root-only areas are marked, and the API enforces the same boundary."
        >
          <ConsoleAreas />
        </LandingSection>

        <LandingSection
          id="stack"
          eyebrow="Stack"
          title="Three repositories, one system."
          description="The API does the work, this console operates it, and a typed Python client lets other services talk to it."
        >
          <RepositoryCards />
        </LandingSection>

        <ClosingSection consoleAction={consoleAction} />
      </main>

      <LandingFooter />
    </div>
  );
}

export default LandingPage;
