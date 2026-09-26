import React from 'react';
import { cn } from '@/lib/utils';
import {
  CAPABILITIES,
  SESSION_COOKIES,
  type Capability,
} from '../landing-content';

function CookieList(): React.JSX.Element {
  return (
    <dl className="m-0 grid gap-2 self-center rounded-lg border border-border bg-background/60 p-3 font-mono text-[11.5px]">
      {SESSION_COOKIES.map((cookie) => (
        <div
          key={cookie.name}
          className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-0.5"
        >
          <dt className="truncate text-foreground">{cookie.name}</dt>
          <dd className="m-0 text-right text-primary">{cookie.lifetime}</dd>
          <dd className="col-span-2 m-0 text-muted-foreground">
            HttpOnly · Secure · SameSite=Strict · Path={cookie.path}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function CapabilityCard({
  capability,
}: {
  capability: Capability;
}): React.JSX.Element {
  const { icon: Icon, title, description, tags, wide } = capability;
  return (
    <li
      className={cn(
        'flex min-w-0 flex-col rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/40',
        wide && 'lg:col-span-2'
      )}
    >
      <div
        className={cn(
          'flex flex-1 flex-col gap-6',
          wide && 'lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]'
        )}
      >
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-subtle text-primary-subtle-foreground">
            <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
          </span>
          <h3 className="m-0 mt-5 text-base font-semibold text-foreground">
            {title}
          </h3>
          <p className="m-0 mt-2 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
          <ul className="m-0 mt-auto flex list-none flex-wrap gap-1.5 p-0 pt-5">
            {tags.map((tag) => (
              <li
                key={tag}
                className="rounded-md border border-border bg-muted/40 px-2 py-0.5 font-mono text-[11px] text-muted-foreground"
              >
                {tag}
              </li>
            ))}
          </ul>
        </div>
        {wide && <CookieList />}
      </div>
    </li>
  );
}

/** What the platform handles, one card per area. */
export function CapabilityGrid(): React.JSX.Element {
  return (
    <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
      {CAPABILITIES.map((capability) => (
        <CapabilityCard key={capability.id} capability={capability} />
      ))}
    </ul>
  );
}

export default CapabilityGrid;
