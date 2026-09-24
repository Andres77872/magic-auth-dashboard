/**
 * EmailTemplatePreview
 *
 * Shows the server-rendered template (subject + HTML or plain-text body) in a
 * Panel. The HTML body is rendered inside a fully sandboxed iframe; the
 * plain-text body is shown verbatim in a <pre>.
 *
 * SECURITY: `sandbox=""` (empty) disables scripts, forms, popups, top-level
 * navigation and same-origin access, so nothing in the HTML can run in or
 * reach the dashboard. The HTML is passed via `srcDoc`; it is never injected
 * into the dashboard DOM (no dangerouslySetInnerHTML).
 */

import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Panel, TabNavigation } from '@/components/common';
import { cn } from '@/lib/utils';

type PreviewTheme = 'light' | 'dark';
type PreviewWidth = 'desktop' | 'mobile';
export type EmailPreviewMode = 'html' | 'text';

const WIDTH_TABS = [
  { id: 'desktop', label: 'Desktop' },
  { id: 'mobile', label: 'Mobile' },
];

const THEME_TABS = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
];

interface EmailTemplatePreviewProps {
  /** Rendered HTML body (server output). */
  html: string;
  /** Rendered subject line (server output). */
  subject?: string;
  /** Rendered plain-text body (server output). */
  text?: string;
  /** Which body to show — follows the editor's body switch. */
  mode?: EmailPreviewMode;
  isLoading?: boolean;
  /** Non-fatal render error; shown as a banner while the last render stays visible. */
  error?: string | null;
  /** The draft is invalid: the last render is out of date and is not refreshed. */
  paused?: boolean;
  className?: string;
}

export function EmailTemplatePreview({
  html,
  subject = '',
  text = '',
  mode = 'html',
  isLoading = false,
  error = null,
  paused = false,
  className,
}: EmailTemplatePreviewProps): React.JSX.Element {
  const [theme, setTheme] = React.useState<PreviewTheme>('light');
  const [width, setWidth] = React.useState<PreviewWidth>('desktop');

  const hasContent = mode === 'text' ? Boolean(text) : Boolean(html);

  return (
    <Panel
      title="Preview"
      description={
        mode === 'text'
          ? 'Plain-text body rendered with sample data'
          : 'HTML body rendered with sample data'
      }
      padding="none"
      className={className}
      actions={
        mode === 'html' ? (
          <>
            <TabNavigation
              variant="segmented"
              size="sm"
              ariaLabel="Preview width"
              tabs={WIDTH_TABS}
              activeTab={width}
              onChange={(id) =>
                setWidth(id === 'mobile' ? 'mobile' : 'desktop')
              }
            />
            <TabNavigation
              variant="segmented"
              size="sm"
              ariaLabel="Preview colour scheme"
              tabs={THEME_TABS}
              activeTab={theme}
              onChange={(id) => setTheme(id === 'dark' ? 'dark' : 'light')}
            />
          </>
        ) : undefined
      }
    >
      <div className="flex h-full flex-col">
        {/* Rendered subject, inbox-style */}
        <div className="flex items-center gap-3 border-b border-border px-5 py-2.5">
          <span className="shrink-0 text-xs text-muted-foreground">
            Subject
          </span>
          <span
            className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground"
            title={subject}
          >
            {subject || '—'}
          </span>
          {isLoading && hasContent && (
            <span
              className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground"
              role="status"
            >
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
              Updating
            </span>
          )}
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 border-b border-destructive/30 bg-destructive/5 px-5 py-2 text-xs text-destructive"
          >
            <AlertTriangle
              className="mt-px h-3.5 w-3.5 shrink-0"
              aria-hidden="true"
            />
            <span>{error}</span>
          </div>
        )}

        <div
          className={cn(
            'relative flex min-h-[520px] flex-1 justify-center overflow-auto rounded-b-lg p-4',
            // Fixed canvas colours on purpose: this simulates a light or dark
            // mail client, independent of the dashboard theme.
            mode === 'html'
              ? theme === 'dark'
                ? 'bg-neutral-900'
                : 'bg-neutral-100'
              : 'bg-secondary/40'
          )}
        >
          {isLoading && !hasContent ? (
            <div
              className="flex items-center gap-2 text-sm text-muted-foreground"
              role="status"
            >
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Rendering preview…
            </div>
          ) : mode === 'text' ? (
            <pre className="m-0 w-full max-w-[680px] whitespace-pre-wrap break-words rounded-md border border-border bg-card p-4 font-mono text-xs leading-relaxed text-foreground">
              {text || '—'}
            </pre>
          ) : (
            <iframe
              title="Email preview"
              // Empty sandbox: no scripts, no same-origin — the XSS boundary.
              sandbox=""
              srcDoc={html}
              referrerPolicy="no-referrer"
              // Drives the template's prefers-color-scheme media query.
              style={{
                colorScheme: theme,
                maxWidth: width === 'mobile' ? 390 : 680,
              }}
              className="min-h-[480px] w-full rounded-md border border-border bg-white"
            />
          )}

          {paused && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-warning/30 bg-warning-subtle px-3 py-1.5 text-xs font-medium text-warning-subtle-foreground">
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                Preview paused — fix the problems in the draft to update it
              </span>
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}

export default EmailTemplatePreview;
