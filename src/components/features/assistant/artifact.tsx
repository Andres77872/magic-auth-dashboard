import type { ReactNode, JSX } from 'react';
import { CopyButton } from './copy-button';
export function ArtifactPending({ label }: { label: string }): JSX.Element {
  return (
    <div
      className="rounded border border-border p-3 text-xs text-muted-foreground"
      role="status"
    >
      Receiving {label.toLowerCase()}…
    </div>
  );
}
export function ArtifactShell({
  kind,
  title,
  meta,
  source,
  actions,
  children,
  footnotes = [],
}: {
  kind: string;
  title: string | null;
  meta: string | null;
  source: string;
  actions?: ReactNode;
  children: ReactNode;
  footnotes?: string[];
}): JSX.Element {
  return (
    <figure className="my-3 overflow-hidden rounded border border-border bg-card">
      <div className="flex items-start justify-between gap-2 border-b border-border p-2">
        <div>
          <span className="text-xs text-muted-foreground">{kind}</span>
          {title && (
            <figcaption className="text-sm font-medium">{title}</figcaption>
          )}
          {meta && <p className="text-xs text-muted-foreground">{meta}</p>}
        </div>
        <div className="flex items-center gap-1">
          {actions}
          <CopyButton value={source} showLabel={false} />
        </div>
      </div>
      <div className="overflow-x-auto p-3">{children}</div>
      {footnotes.map((note, index) => (
        <p className="px-3 pb-2 text-xs text-muted-foreground" key={index}>
          {note}
        </p>
      ))}
    </figure>
  );
}
export function ArtifactFallback({
  kind,
  error,
  hint,
  source,
  lang,
}: {
  kind: string;
  error: string;
  hint: string | null;
  source: string;
  lang: string;
}): JSX.Element {
  return (
    <ArtifactShell kind={kind} title={error} meta={hint} source={source}>
      <pre className="max-h-72 overflow-auto text-xs">
        <code>{`\`\`\`${lang}\n${source}\n\`\`\``}</code>
      </pre>
    </ArtifactShell>
  );
}
