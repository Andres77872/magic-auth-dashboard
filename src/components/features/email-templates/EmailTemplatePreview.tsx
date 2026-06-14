/**
 * EmailTemplatePreview
 *
 * Renders server-rendered template HTML inside a fully sandboxed iframe.
 * SECURITY: `sandbox=""` (empty) disables scripts, forms, popups and same-origin
 * access — so even though the HTML is admin-authored, nothing can execute in the
 * dashboard. We never use dangerouslySetInnerHTML. The HTML always comes from the
 * backend `/preview` endpoint (already validated + rendered exactly as the worker
 * would send it), so preview matches production.
 */

import React from 'react';
import { Monitor, Smartphone, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

type PreviewTheme = 'light' | 'dark';
type PreviewWidth = 'desktop' | 'mobile';

interface EmailTemplatePreviewProps {
  html: string;
  isLoading?: boolean;
}

export function EmailTemplatePreview({ html, isLoading }: EmailTemplatePreviewProps): React.JSX.Element {
  const [theme, setTheme] = React.useState<PreviewTheme>('light');
  const [width, setWidth] = React.useState<PreviewWidth>('desktop');

  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <span className="text-xs font-medium text-muted-foreground">Live preview</span>
        <div className="flex items-center gap-1">
          <ToggleButton active={width === 'desktop'} onClick={() => setWidth('desktop')} label="Desktop">
            <Monitor size={15} />
          </ToggleButton>
          <ToggleButton active={width === 'mobile'} onClick={() => setWidth('mobile')} label="Mobile">
            <Smartphone size={15} />
          </ToggleButton>
          <span className="mx-1 h-4 w-px bg-border" />
          <ToggleButton active={theme === 'light'} onClick={() => setTheme('light')} label="Light">
            <Sun size={15} />
          </ToggleButton>
          <ToggleButton active={theme === 'dark'} onClick={() => setTheme('dark')} label="Dark">
            <Moon size={15} />
          </ToggleButton>
        </div>
      </div>
      <div
        className={cn(
          'flex flex-1 justify-center overflow-auto p-4',
          theme === 'dark' ? 'bg-neutral-900' : 'bg-neutral-100'
        )}
      >
        {isLoading && !html ? (
          <div className="flex items-center text-sm text-muted-foreground">Rendering preview…</div>
        ) : (
          <iframe
            title="Email preview"
            // Empty sandbox: no scripts, no same-origin — the sole XSS boundary.
            sandbox=""
            srcDoc={html}
            // Drives the template's prefers-color-scheme media query in the iframe.
            style={{ colorScheme: theme, width: width === 'mobile' ? 390 : '100%', maxWidth: width === 'mobile' ? 390 : 680 }}
            className="h-full min-h-[480px] w-full rounded-md border border-border bg-white shadow-sm"
          />
        )}
      </div>
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
        active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent'
      )}
    >
      {children}
    </button>
  );
}

export default EmailTemplatePreview;
