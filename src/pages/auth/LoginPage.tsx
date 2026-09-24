import React from 'react';
import {
  BookOpen,
  FolderKanban,
  History,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { SignInForm } from '@/components/auth/SignInForm';
import { useTheme } from '@/contexts/ThemeContext';
import { API_CONFIG } from '@/utils/constants';

const HIGHLIGHTS = [
  { icon: Users, text: 'Users, user groups and the projects they can reach' },
  { icon: ShieldCheck, text: 'Global roles, permission groups and grants' },
  {
    icon: FolderKanban,
    text: 'Projects, sign-in providers, billing and API keys',
  },
  { icon: History, text: 'Audit trail and live service health' },
];

/** Sign-in screen for root and admin operators. */
export function LoginPage(): React.JSX.Element {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <div className="grid min-h-screen grid-cols-1 bg-background lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <aside className="relative hidden flex-col justify-between border-r border-border bg-card px-12 py-10 lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheck className="h-[18px] w-[18px]" aria-hidden="true" />
          </span>
          <span className="text-[15px] font-semibold tracking-[-0.01em] text-foreground">
            Magic Auth
          </span>
        </div>

        <div className="max-w-md">
          <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
            Admin console
          </p>
          <h1 className="m-0 mt-3 text-[28px] font-semibold leading-tight tracking-[-0.01em] text-foreground">
            Manage who can access every project.
          </h1>
          <ul className="m-0 mt-8 list-none space-y-3.5 p-0">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li
                key={text}
                className="flex items-center gap-3 text-[13px] text-muted-foreground"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary-subtle text-primary-subtle-foreground">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <a
          href={`${API_CONFIG.BASE_URL}/docs`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-fit items-center gap-2 text-xs text-muted-foreground no-underline hover:text-foreground"
        >
          <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
          API reference
        </a>
      </aside>

      <main className="flex flex-col px-6 py-8 sm:px-10">
        <div className="flex items-center justify-between lg:justify-end">
          <span className="flex items-center gap-2 lg:hidden">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold text-foreground">
              Magic Auth
            </span>
          </span>
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            {resolvedTheme === 'dark' ? 'Light theme' : 'Dark theme'}
          </button>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">
            <h2 className="m-0 text-[22px] font-semibold tracking-[-0.01em] text-foreground">
              Sign in
            </h2>
            <p className="m-0 mb-6 mt-1 text-[13px] text-muted-foreground">
              Root and admin accounts only. Project users sign in through their
              app.
            </p>
            <SignInForm />
          </div>
        </div>

        <p className="m-0 text-center text-xs text-muted-foreground">
          Forgot your password? Ask a root administrator to send you a reset
          link.
        </p>
      </main>
    </div>
  );
}

export default LoginPage;
