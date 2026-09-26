import React from 'react';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { ACCESS_LANES, type AccessLane } from '../landing-content';

const ACCESS_FACTS: Array<{ title: string; body: React.ReactNode }> = [
  {
    title: 'Grant once, reach many',
    body: 'Give a project group to a user group and every member can sign in to every project in the bundle.',
  },
  {
    title: 'Scoped administrators',
    body: 'Admins manage only the projects assigned to them. Root sees and manages everything.',
  },
  {
    title: 'Explainable results',
    body: (
      <>
        <code className="break-all font-mono text-[12px] text-foreground">
          GET /permissions/users/me/permission-sources
        </code>{' '}
        lists the path behind every effective permission.
      </>
    ),
  },
];

function Lane({ lane }: { lane: AccessLane }): React.JSX.Element {
  return (
    <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="m-0 text-base font-semibold text-foreground">
          {lane.title}
        </h3>
        <p className="m-0 text-sm text-muted-foreground">{lane.question}</p>
      </div>
      <ol className="m-0 mt-5 flex list-none flex-col p-0 md:flex-row md:items-stretch">
        {lane.nodes.map(({ icon: Icon, label, hint }, index) => (
          <li
            key={label}
            className="flex min-w-0 flex-col items-stretch md:flex-1 md:flex-row md:items-center"
          >
            {index > 0 && (
              <span
                aria-hidden="true"
                className="flex h-7 items-center justify-center text-muted-foreground md:h-auto md:w-9 md:shrink-0"
              >
                <ArrowDown className="h-4 w-4 md:hidden" />
                <ArrowRight className="hidden h-4 w-4 md:block" />
              </span>
            )}
            <div className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-border bg-background/60 px-3 py-2.5 md:h-full">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-subtle text-primary-subtle-foreground">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-medium leading-snug text-foreground">
                  {label}
                </span>
                <span className="block text-xs leading-snug text-muted-foreground">
                  {hint}
                </span>
              </span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** The groups-of-groups model, split into reach (projects) and rights (permissions). */
export function AccessModel(): React.JSX.Element {
  return (
    <div className="space-y-4">
      {ACCESS_LANES.map((lane) => (
        <Lane key={lane.id} lane={lane} />
      ))}
      <dl className="m-0 grid gap-x-8 gap-y-6 pt-6 sm:grid-cols-3">
        {ACCESS_FACTS.map((fact) => (
          <div key={fact.title}>
            <dt className="text-sm font-semibold text-foreground">
              {fact.title}
            </dt>
            <dd className="m-0 mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {fact.body}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default AccessModel;
