import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LINKS } from '../landing-content';
import { LANDING_CONTAINER } from './LandingSection';

const LINK_GROUPS: Array<{
  title: string;
  links: Array<{ label: string; href: string }>;
}> = [
  {
    title: 'API',
    links: [
      { label: 'Reference (Swagger)', href: LINKS.apiReference },
      { label: 'Reference (ReDoc)', href: LINKS.redoc },
    ],
  },
  {
    title: 'Source',
    links: [
      { label: 'api.auth', href: LINKS.apiRepo },
      { label: 'magic-auth-dashboard', href: LINKS.consoleRepo },
      { label: 'magic_auth_client', href: LINKS.sdkRepo },
    ],
  },
  {
    title: 'Elsewhere',
    links: [
      { label: 'arz.ai', href: 'https://arz.ai' },
      { label: 'arizmendi.io', href: 'https://arizmendi.io' },
    ],
  },
];

export function LandingFooter(): React.JSX.Element {
  return (
    <footer className="border-t border-border/70">
      <div
        className={cn(
          LANDING_CONTAINER,
          'flex flex-col gap-10 py-12 md:flex-row md:justify-between'
        )}
      >
        <div className="max-w-xs">
          <p className="m-0 flex items-center gap-2.5 text-[15px] font-semibold text-foreground">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            </span>
            Magic Auth
          </p>
          <p className="m-0 mt-3 text-sm leading-relaxed text-muted-foreground">
            Authentication, access control and auditing, shared by every
            connected project.
          </p>
        </div>

        <nav
          aria-label="Footer"
          className="grid grid-cols-2 gap-8 sm:grid-cols-3"
        >
          {LINK_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="ds-overline m-0 text-muted-foreground">
                {group.title}
              </p>
              <ul className="m-0 mt-3 list-none space-y-2 p-0">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground no-underline transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="border-t border-border/70">
        <p
          className={cn(
            LANDING_CONTAINER,
            'm-0 py-6 text-xs text-muted-foreground'
          )}
        >
          Andrés Arizmendi · {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}

export default LandingFooter;
