import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Monitor, Moon, RefreshCw, Sun } from 'lucide-react';
import {
  FactList,
  PageContainer,
  PageHeader,
  Panel,
} from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChangePasswordPanel } from '@/components/features/settings/ChangePasswordPanel';
import { useAuth, useToast } from '@/hooks';
import { useTheme, type Theme } from '@/contexts/ThemeContext';
import { formatDateTime } from '@/utils/formatters';
import { ROUTES } from '@/utils/routes';
import { cn } from '@/lib/utils';

const THEMES: {
  value: Theme;
  label: string;
  description: string;
  icon: typeof Sun;
}[] = [
  {
    value: 'dark',
    label: 'Dark',
    description: 'The default blue-gray “ink” theme.',
    icon: Moon,
  },
  {
    value: 'light',
    label: 'Light',
    description: 'White cards on a soft gray canvas.',
    icon: Sun,
  },
  {
    value: 'system',
    label: 'System',
    description: 'Follow your operating system.',
    icon: Monitor,
  },
];

/** Until-when phrasing for a future timestamp: "in 3h", "in 2d". */
function timeUntil(value: string | null): string | null {
  if (!value) return null;
  const ms = new Date(value).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  if (ms <= 0) return 'expired';
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `in ${Math.max(minutes, 1)}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `in ${hours}h`;
  return `in ${Math.round(hours / 24)}d`;
}

function SessionPanel(): React.JSX.Element {
  const {
    sessionExpiresAt,
    refreshExpiresAt,
    rememberMe,
    refreshSession,
    logout,
  } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [renewing, setRenewing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const renew = async (): Promise<void> => {
    setRenewing(true);
    const ok = await refreshSession();
    setRenewing(false);
    showToast(
      ok
        ? 'Session renewed.'
        : 'The session could not be renewed. Try signing in again.',
      ok ? 'success' : 'error'
    );
  };

  const signOut = async (): Promise<void> => {
    setSigningOut(true);
    try {
      await logout();
      void navigate(ROUTES.LOGIN, { replace: true });
    } catch {
      setSigningOut(false);
      showToast('Sign-out did not complete. Try again.', 'error');
    }
  };

  return (
    <Panel
      title="Session"
      description="Access tokens renew automatically while you use the console"
      actions={
        <Badge variant="success" size="sm" dot>
          Signed in
        </Badge>
      }
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            variant="secondary"
            onClick={() => void renew()}
            loading={renewing}
          >
            <RefreshCw aria-hidden="true" />
            Renew now
          </Button>
          <Button
            variant="destructive"
            onClick={() => void signOut()}
            loading={signingOut}
          >
            <LogOut aria-hidden="true" />
            Sign out
          </Button>
        </div>
      }
    >
      <FactList
        facts={[
          {
            label: 'Signed in until',
            value: refreshExpiresAt ? (
              <span>
                {formatDateTime(refreshExpiresAt)}
                <span className="ml-1.5 text-xs text-muted-foreground">
                  ({timeUntil(refreshExpiresAt)})
                </span>
              </span>
            ) : (
              'Unknown'
            ),
          },
          {
            label: 'Remember me',
            value: rememberMe ? 'On · up to 30 days' : 'Off · up to 72 hours',
          },
          {
            label: 'Access token',
            value: sessionExpiresAt
              ? `Renews ${timeUntil(sessionExpiresAt) === 'expired' ? 'on next request' : timeUntil(sessionExpiresAt)}`
              : 'Renews automatically',
          },
        ]}
      />
      <p className="m-0 mt-4 text-xs text-muted-foreground">
        Signing out ends this session on the server and signs out your other
        open tabs.
      </p>
    </Panel>
  );
}

function AppearancePanel(): React.JSX.Element {
  const { theme, setTheme } = useTheme();
  return (
    <Panel title="Appearance" description="Stored in this browser only">
      <div
        role="radiogroup"
        aria-label="Theme"
        className="grid gap-2 sm:grid-cols-3"
      >
        {THEMES.map(({ value, label, description, icon: Icon }) => {
          const selected = theme === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setTheme(value)}
              className={cn(
                'flex flex-col items-start gap-1 rounded-md border px-3 py-2.5 text-left transition-colors',
                selected
                  ? 'border-primary bg-primary-subtle'
                  : 'border-border hover:bg-accent/50'
              )}
            >
              <span className="flex items-center gap-2 text-[13px] font-medium text-foreground">
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </span>
              <span className="text-xs text-muted-foreground">
                {description}
              </span>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

export function SettingsPage(): React.JSX.Element {
  return (
    <PageContainer maxWidth="lg">
      <PageHeader
        title="Settings"
        subtitle="Your session, password and how the console looks"
      />
      <div className="space-y-6">
        <SessionPanel />
        <ChangePasswordPanel />
        <AppearancePanel />
      </div>
    </PageContainer>
  );
}

export default SettingsPage;
