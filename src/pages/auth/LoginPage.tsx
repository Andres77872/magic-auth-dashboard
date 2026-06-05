import React from 'react';
import { LoginForm } from '@/components/forms';
import { Shield, ShieldCheck, User, FolderKanban, Activity } from 'lucide-react';

const features = [
  {
    icon: User,
    title: '3-Tier User Management',
    description: 'Hierarchical access control',
  },
  {
    icon: ShieldCheck,
    title: 'Role-Based Access Control',
    description: 'Granular permissions',
  },
  {
    icon: FolderKanban,
    title: 'Project Management',
    description: 'Multi-tenant support',
  },
  {
    icon: Activity,
    title: 'System Health Monitoring',
    description: 'Real-time diagnostics',
  },
] as const;

const accessLevels = [
  {
    badge: 'ROOT',
    badgeClass: 'bg-destructive/10 text-destructive border-destructive/30',
    label: 'System Administrator',
    description: 'Full system access',
  },
  {
    badge: 'ADMIN',
    badgeClass: 'bg-warning/10 text-warning border-warning/30',
    label: 'Project Manager',
    description: 'Project-level access',
  },
] as const;

export function LoginPage(): React.JSX.Element {
  return (
    <div className="relative flex min-h-screen items-stretch bg-background">
      {/* Animated background grid - subtle, theme-aware */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.4] [background-image:linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
        aria-hidden="true"
      />

      <div className="relative z-10 grid w-full lg:grid-cols-2">
        {/* Left side - Branding (hidden on small screens) */}
        <aside
          className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 p-10 text-primary-foreground lg:flex xl:p-12"
          aria-label="Magic Auth"
        >
          {/* Decorative orbs */}
          <div
            className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-black/10 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative space-y-10">
            <header className="space-y-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 shadow-lg ring-1 ring-white/20 backdrop-blur">
                <Shield size={36} aria-hidden="true" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight xl:text-4xl">Magic Auth</h1>
                <div className="flex items-center gap-2 text-primary-100">
                  <ShieldCheck size={16} aria-hidden="true" />
                  <p className="text-base font-medium">Admin Dashboard</p>
                </div>
              </div>
              <p className="max-w-sm text-base leading-relaxed text-primary-100">
                Enterprise-grade authentication management for secure access control.
              </p>
            </header>

            <ul className="space-y-4" aria-label="Key features">
              {features.map(({ icon: Icon, title, description }) => (
                <li key={title} className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15"
                    aria-hidden="true"
                  >
                    <Icon size={18} />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-sm font-semibold">{title}</span>
                    <span className="text-sm text-primary-100">{description}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <footer className="relative space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-primary-200">
              Authorized Access Levels
            </h2>
            <ul className="space-y-2.5" aria-label="Available access levels">
              {accessLevels.map(({ badge, badgeClass, label, description }) => (
                <li key={badge} className="flex items-center gap-3">
                  <span
                    className={`inline-flex min-w-[3.5rem] justify-center rounded-md border px-2 py-0.5 text-xs font-bold tracking-wide ${badgeClass}`}
                  >
                    {badge}
                  </span>
                  <span className="flex flex-col">
                    <span className="text-sm font-medium">{label}</span>
                    <span className="text-xs text-primary-200">{description}</span>
                  </span>
                </li>
              ))}
            </ul>
          </footer>
        </aside>

        {/* Right side - Login form */}
        <main
          className="flex items-center justify-center px-4 py-12 sm:px-8"
          aria-label="Sign in"
        >
          <div className="w-full max-w-md">
            {/* Compact brand header for mobile (branding panel is hidden) */}
            <div className="mb-8 flex flex-col items-center gap-3 text-center lg:hidden">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
                <Shield size={30} aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Magic Auth</h1>
                <p className="text-sm text-muted-foreground">Admin Dashboard</p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
              <header className="mb-6 space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h2>
                <p className="text-sm text-muted-foreground">
                  Sign in to access the Magic Auth Dashboard
                </p>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                  <ShieldCheck size={14} aria-hidden="true" />
                  <span>Secure connection</span>
                </div>
              </header>

              <LoginForm />
            </div>

            <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <span>Pro tip: press</span>
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[0.7rem] font-medium text-foreground">
                Enter
              </kbd>
              <span>to sign in</span>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

export default LoginPage;
