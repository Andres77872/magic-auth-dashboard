/**
 * EmailTemplatePreview
 *
 * Renders the server-rendered template output. The HTML body is shown inside a
 * fully sandboxed iframe; the plain-text body is shown verbatim in a <pre>. The
 * rendered subject (with $variables substituted) is shown inbox-style above the
 * body so admins judge the whole message, not just the HTML.
 *
 * SECURITY: `sandbox=""` (empty) disables scripts, forms, popups and same-origin
 * access — so even though the HTML is admin-authored, nothing can execute in the
 * dashboard. We never use dangerouslySetInnerHTML. The HTML always comes from the
 * backend `/preview` endpoint (already validated + rendered exactly as the worker
 * would send it), so preview matches production.
 */

import React from 'react';
import { Monitor, Smartphone, Sun, Moon, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

type PreviewTheme = 'light' | 'dark';
type PreviewWidth = 'desktop' | 'mobile';
type PreviewMode = 'html' | 'text';

interface EmailTemplatePreviewProps {
  /** Rendered HTML body (server output). */
  html: string;
  /** Rendered subject line (server output). */
  subject?: string;
  /** Rendered plain-text body (server output). */
  text?: string;
  /** Which body to show — follows the active editor tab. */
  mode?: PreviewMode;
  isLoading?: boolean;
  /** Non-fatal preview error; shown as a banner without dropping the last render. */
  error?: string | null;
  /** Draft is invalid: freeze the last render and show it's out of date. */
  paused?: boolean;
}

export function EmailTemplatePreview({
  html,
  subject = '',
  text = '',
  mode = 'html',
  isLoading,
  error = null,
  paused = false,
}: EmailTemplatePreviewProps): React.JSX.Element {
  const [theme, setTheme] = React.useState<PreviewTheme>('light');
  const [width, setWidth] = React.useState<PreviewWidth>('desktop');

  const hasContent = mode === 'text' ? Boolean(text) : Boolean(html);

  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-card">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <span className="text-xs font-medium text-muted-foreground">
          Live preview · {mode === 'text' ? 'Plain text' : 'HTML'}
        </span>
        {mode === 'html' && (
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
        )}
      </div>

      {/* Rendered subject (inbox-style) */}
      <div className="flex items-baseline gap-2 border-b border-border px-3 py-2">
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Subject
        </span>
        <span className="truncate text-sm font-medium text-foreground" title={subject}>
          {subject || '—'}
        </span>
      </div>

      {/* Non-destructive preview error banner */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 border-b border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive"
        >
          <AlertTriangle size={14} className="mt-px shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Body */}
      <div
        className={cn(
          'relative flex flex-1 justify-center overflow-auto p-4',
          mode === 'html' && (theme === 'dark' ? 'bg-neutral-900' : 'bg-neutral-100')
        )}
      >
        {isLoading && !hasContent ? (
          <div className="flex items-center text-sm text-muted-foreground">Rendering preview…</div>
        ) : mode === 'text' ? (
          <pre className="m-0 w-full max-w-[680px] whitespace-pre-wrap break-words rounded-md border border-border bg-card p-4 font-mono text-xs leading-relaxed text-foreground shadow-sm">
            {text || '—'}
          </pre>
        ) : (
          <iframe
            title="Email preview"
            // Empty sandbox: no scripts, no same-origin — the sole XSS boundary.
            sandbox=""
            srcDoc={html}
            // Drives the template's prefers-color-scheme media query in the iframe.
            style={{
              colorScheme: theme,
              width: width === 'mobile' ? 390 : '100%',
              maxWidth: width === 'mobile' ? 390 : 680,
            }}
            className="h-full min-h-[480px] w-full rounded-md border border-border bg-white shadow-sm"
          />
        )}

        {/* Out-of-date overlay while the draft is invalid */}
        {paused && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
            <span className="flex items-center gap-1.5 rounded-md border border-warning/30 bg-warning/10 px-3 py-1.5 text-xs font-medium text-warning shadow-sm">
              <AlertTriangle size={13} /> Preview paused — fix the errors to update
            </span>
          </div>
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
