/**
 * EmailTemplatesList
 *
 * Lists every transactional email template with its status (built-in default vs
 * customized version) and a link into the editor.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Pencil } from 'lucide-react';
import { Button, EmptyState, ErrorState } from '@/components/common';
import { useEmailTemplates } from '@/hooks/useEmailTemplates';
import { ROUTES } from '@/utils/routes';
import { emailTemplateLabel } from '@/types/email-templates.types';

export function EmailTemplatesList(): React.JSX.Element {
  const { templates, isLoading, error, refetch } = useEmailTemplates();

  if (isLoading) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Loading email templates…</div>;
  }
  if (error) {
    return <ErrorState title="Couldn't load templates" message={error} onRetry={() => void refetch()} />;
  }
  if (templates.length === 0) {
    return (
      <EmptyState
        icon={<Mail />}
        title="No templates"
        description="No transactional email templates were returned."
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {templates.map((t) => (
        <div
          key={t.templateCode}
          className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Mail size={18} className="text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{emailTemplateLabel(t.templateCode)}</h3>
                <p className="font-mono text-xs text-muted-foreground">{t.templateCode}</p>
              </div>
            </div>
            <span
              className={
                t.isCustomized
                  ? 'rounded bg-info/10 px-2 py-0.5 text-xs text-info'
                  : 'rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground'
              }
            >
              {t.isCustomized ? `Customized · v${t.version}` : 'Default'}
            </span>
          </div>

          <p className="line-clamp-2 text-sm text-muted-foreground">
            <span className="text-muted-foreground/70">Subject: </span>
            {t.subjectTemplate}
          </p>

          <div className="mt-auto flex items-center justify-between gap-2 pt-1">
            <span className="text-xs text-muted-foreground">
              {t.requiredVariables.length > 0
                ? `Requires ${t.requiredVariables.map((v) => '$' + v).join(', ')}`
                : 'No required variables'}
            </span>
            <Link to={`${ROUTES.EMAIL_TEMPLATES}/${t.templateCode}`}>
              <Button variant="outline">
                <Pencil size={14} className="mr-1.5" /> Edit
              </Button>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

export default EmailTemplatesList;
