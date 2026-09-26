import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Key, Lock, LogIn, Mail, RefreshCw, ShieldCheck } from 'lucide-react';
import { NavIcon } from '@/components/navigation/NavIcon';
import { cn } from '@/lib/utils';
import { NAVIGATION_SECTIONS } from '@/utils/routes';

interface HealthTile {
  label: string;
  bars: number[];
}

// Component names mirror `GET /system/health`; bar heights are decorative.
const HEALTH_TILES: HealthTile[] = [
  { label: 'Database', bars: [5, 7, 6, 8, 7, 9, 8, 7, 9, 8, 10, 9] },
  { label: 'Redis', bars: [4, 5, 4, 6, 5, 5, 7, 6, 5, 6, 7, 6] },
  { label: 'Email outbox', bars: [3, 6, 4, 7, 5, 8, 6, 9, 7, 6, 8, 7] },
  { label: 'Billing sync', bars: [6, 5, 7, 6, 8, 7, 6, 8, 9, 7, 8, 9] },
];

interface ActivityRow {
  icon: LucideIcon;
  label: string;
  subject: string;
  when: string;
}

const ACTIVITY: ActivityRow[] = [
  { icon: LogIn, label: 'Signed in', subject: 'usr-7c21…', when: '2m' },
  {
    icon: RefreshCw,
    label: 'Session refreshed',
    subject: 'usr-7c21…',
    when: '14m',
  },
  {
    icon: ShieldCheck,
    label: 'Permission group assigned',
    subject: 'user group',
    when: '1h',
  },
  { icon: Key, label: 'API key created', subject: 'proj-a3f0…', when: '3h' },
  {
    icon: Mail,
    label: 'Template published',
    subject: 'password_reset',
    when: '1d',
  },
];

const PROVIDERS: Array<{ name: string; enabled: boolean }> = [
  { name: 'Password', enabled: true },
  { name: 'Google', enabled: true },
  { name: 'GitHub', enabled: true },
  { name: 'Discord', enabled: false },
  { name: 'Microsoft', enabled: false },
];

function PreviewPanel({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div
      className={cn(
        'min-w-0 rounded-lg border border-border bg-background/40',
        className
      )}
    >
      <p className="m-0 border-b border-border px-3.5 py-2.5 text-[12px] font-semibold text-foreground">
        {title}
      </p>
      {children}
    </div>
  );
}

/**
 * Illustration of the console overview. Built from the real navigation so the
 * sidebar stays in step with the product; the content is representative only.
 */
export function ConsolePreview(): React.JSX.Element {
  return (
    <div
      role="img"
      aria-label="Illustration of the Magic Auth console: sidebar navigation, service health tiles, recent activity and sign-in providers."
      className="relative overflow-hidden rounded-xl border border-border bg-card text-left shadow-xl"
    >
      {/* Window chrome */}
      <div className="flex h-10 items-center gap-3 border-b border-border px-4">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
        </div>
        <div className="mx-auto flex items-center gap-1.5 rounded-md bg-muted px-3 py-1 font-mono text-[11px] text-muted-foreground">
          <Lock className="h-3 w-3" />
          console / overview
        </div>
        <div className="w-[42px]" />
      </div>

      <div className="grid md:grid-cols-[208px_minmax(0,1fr)]">
        {/* Sidebar */}
        <div className="hidden border-r border-border bg-surface-secondary/60 px-2.5 py-3 md:block">
          {NAVIGATION_SECTIONS.map((section) => (
            <div key={section.id} className="mb-3 last:mb-0">
              <p className="ds-overline m-0 px-2 pb-1.5 text-[10px] text-muted-foreground">
                {section.label}
              </p>
              {section.items.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-2 py-[5px] text-[12px]',
                    item.id === 'home'
                      ? 'bg-primary-subtle font-medium text-primary-subtle-foreground'
                      : 'text-muted-foreground'
                  )}
                >
                  <NavIcon icon={item.icon} className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Overview content */}
        <div className="min-w-0 space-y-4 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="m-0 text-[15px] font-semibold text-foreground">
                Overview
              </p>
              <p className="m-0 mt-0.5 text-[12px] text-muted-foreground">
                Platform totals, activity and health
              </p>
            </div>
            <div className="hidden rounded-md border border-border p-0.5 text-[11px] sm:flex">
              {['24h', '7d', '30d'].map((range) => (
                <span
                  key={range}
                  className={cn(
                    'rounded-[4px] px-2 py-0.5',
                    range === '7d'
                      ? 'bg-accent text-foreground'
                      : 'text-muted-foreground'
                  )}
                >
                  {range}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {HEALTH_TILES.map((tile) => (
              <div
                key={tile.label}
                className="rounded-lg border border-border bg-background/40 p-3"
              >
                <p className="m-0 text-[11px] text-muted-foreground">
                  {tile.label}
                </p>
                <p className="m-0 mt-1 flex items-center gap-1.5 text-[13px] font-medium text-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  Healthy
                </p>
                <div className="mt-3 flex h-7 items-end gap-[3px]">
                  {tile.bars.map((height, index) => (
                    <span
                      key={index}
                      className="flex-1 rounded-[2px] bg-primary/35"
                      style={{ height: `${height * 10}%` }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <PreviewPanel title="Recent activity">
              <ul className="m-0 list-none p-0">
                {ACTIVITY.map(({ icon: Icon, label, subject, when }) => (
                  <li
                    key={label}
                    className="flex items-center gap-2.5 border-b border-border/70 px-3.5 py-2 last:border-0"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted-subtle text-muted-subtle-foreground">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[12px] text-foreground">
                      {label}
                    </span>
                    <span className="hidden font-mono text-[11px] text-muted-foreground sm:inline">
                      {subject}
                    </span>
                    <span className="w-8 text-right text-[11px] tabular-nums text-muted-foreground">
                      {when}
                    </span>
                  </li>
                ))}
              </ul>
            </PreviewPanel>

            <PreviewPanel title="Sign-in providers" className="hidden sm:block">
              <ul className="m-0 list-none p-0">
                {PROVIDERS.map(({ name, enabled }) => (
                  <li
                    key={name}
                    className="flex items-center justify-between border-b border-border/70 px-3.5 py-2 text-[12px] last:border-0"
                  >
                    <span className="text-foreground">{name}</span>
                    <span
                      className={cn(
                        'relative h-4 w-7 rounded-full transition-colors',
                        enabled ? 'bg-primary' : 'bg-input'
                      )}
                    >
                      <span
                        className={cn(
                          'absolute top-0.5 h-3 w-3 rounded-full bg-white',
                          enabled ? 'left-[14px]' : 'left-0.5'
                        )}
                      />
                    </span>
                  </li>
                ))}
              </ul>
            </PreviewPanel>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConsolePreview;
