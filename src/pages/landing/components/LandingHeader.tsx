import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Moon, ShieldCheck, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { LINKS, SECTIONS } from '../landing-content';
import { GithubIcon } from './GithubIcon';
import { LANDING_CONTAINER } from './LandingSection';

export interface ConsoleAction {
  to: string;
  /** Short label for the header button. */
  label: string;
  /** Longer label for in-page calls to action. */
  longLabel: string;
}

/** Sticky top bar: brand, section anchors, source link, theme and sign-in. */
export function LandingHeader({
  consoleAction,
}: {
  consoleAction: ConsoleAction;
}): React.JSX.Element {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/75 backdrop-blur-md">
      <div className={cn(LANDING_CONTAINER, 'flex h-14 items-center gap-6')}>
        <a
          href="#top"
          className="flex items-center gap-2.5 text-foreground no-underline"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="text-[15px] font-semibold tracking-[-0.01em]">
            Magic Auth
          </span>
        </a>

        <nav aria-label="Page sections" className="hidden md:block">
          <ul className="m-0 flex list-none items-center gap-0.5 p-0">
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="rounded-md px-2.5 py-1.5 text-[13px] text-muted-foreground no-underline transition-colors hover:bg-accent hover:text-foreground"
                >
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <a
            href={LINKS.consoleRepo}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Source on GitHub"
            className="flex h-[34px] w-[34px] items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <GithubIcon size={16} />
          </a>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={
              resolvedTheme === 'dark'
                ? 'Switch to light theme'
                : 'Switch to dark theme'
            }
            className="flex h-[34px] w-[34px] items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
          <Button asChild variant="secondary" size="md" className="ml-1.5">
            <Link to={consoleAction.to}>
              {consoleAction.label}
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

export default LandingHeader;
