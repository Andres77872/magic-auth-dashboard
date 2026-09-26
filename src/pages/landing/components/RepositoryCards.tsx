import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { REPOSITORIES } from '../landing-content';
import { GithubIcon } from './GithubIcon';

/** The three repositories that make up the system, each linking to its source. */
export function RepositoryCards(): React.JSX.Element {
  return (
    <ul className="m-0 grid list-none gap-4 p-0 md:grid-cols-3">
      {REPOSITORIES.map((repo) => (
        <li key={repo.name} className="min-w-0">
          <a
            href={repo.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex h-full flex-col rounded-xl border border-border bg-card p-6 text-inherit no-underline transition-colors hover:border-primary/40"
          >
            <span className="flex items-center justify-between">
              <span className="ds-overline text-primary">{repo.role}</span>
              <GithubIcon
                size={16}
                className="text-muted-foreground transition-colors group-hover:text-foreground"
              />
            </span>
            <span className="mt-4 flex items-center gap-1.5 font-mono text-[15px] font-medium text-foreground">
              {repo.name}
              <ArrowUpRight
                className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-primary"
                aria-hidden="true"
              />
            </span>
            <span className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {repo.description}
            </span>
            <span className="mt-auto flex flex-wrap gap-1.5 pt-5">
              {repo.stack.map((item) => (
                <span
                  key={item}
                  className="rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground"
                >
                  {item}
                </span>
              ))}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export default RepositoryCards;
