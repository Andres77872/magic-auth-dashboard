/**
 * Email templates pages (ROOT only; routes wrapped in RootOnlyRoute).
 *
 * - EmailTemplatesPage: the catalogue of built-in and custom templates, with
 *   creation of custom templates.
 * - EmailTemplateEditorPage: edits one template (subject/HTML/text) with live
 *   preview, send-test, version history, rollback and disable/enable.
 */

import React, { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, RefreshCw } from 'lucide-react';
import {
  ConfirmDialog,
  ErrorState,
  PageContainer,
  PageHeader,
} from '@/components/common';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CreateEmailTemplateDialog,
  EmailTemplateEditor,
  EmailTemplatesList,
  emailTemplateEditorPath,
  useUnsavedChangesGuard,
} from '@/components/features/email-templates';
import { useSetBreadcrumbLabel } from '@/contexts';
import { useEmailTemplate, useEmailTemplates } from '@/hooks/useEmailTemplates';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import { formatCount } from '@/utils/formatters';
import {
  emailTemplateLabel,
  type EmailTemplateCreateResult,
} from '@/types/email-templates.types';

export function EmailTemplatesPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { templates, isLoading, isRefreshing, error, refetch, createTemplate } =
    useEmailTemplates();
  const [showCreate, setShowCreate] = useState(false);

  const refresh = useCallback(() => void refetch(), [refetch]);

  const handleCreated = (result: EmailTemplateCreateResult): void => {
    setShowCreate(false);
    showToast(
      `Created ${emailTemplateLabel(result.templateCode)}. Version ${result.version} is active.`,
      'success'
    );
    void navigate(emailTemplateEditorPath(result.templateCode));
  };

  const customized = templates.filter(
    (template) => !template.isDynamic && template.isCustomized
  ).length;
  const custom = templates.filter((template) => template.isDynamic).length;
  const disabled = templates.filter((template) => !template.isEnabled).length;
  const subtitle =
    templates.length > 0
      ? [
          formatCount(templates.length, 'template'),
          `${customized} customized`,
          ...(custom > 0 ? [`${custom} custom`] : []),
          ...(disabled > 0 ? [`${disabled} disabled`] : []),
        ].join(' · ')
      : 'Transactional emails for activation, password reset, security and delivery notices';

  return (
    <PageContainer>
      <PageHeader
        title="Email templates"
        subtitle={subtitle}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={refresh}
              disabled={isRefreshing}
              aria-label="Refresh templates"
            >
              <RefreshCw
                className={cn(isRefreshing && 'animate-spin')}
                aria-hidden="true"
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button onClick={() => setShowCreate(true)}>
              <Plus aria-hidden="true" />
              Create template
            </Button>
          </>
        }
      />

      {error && templates.length === 0 ? (
        <ErrorState
          title="Email templates could not be loaded"
          message={error}
          onRetry={refresh}
          retryLabel="Try again"
          isRetrying={isRefreshing}
        />
      ) : (
        <div className={cn('transition-opacity', isRefreshing && 'opacity-70')}>
          <EmailTemplatesList
            templates={templates}
            isLoading={isLoading}
            emptyAction={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowCreate(true)}
              >
                Create template
              </Button>
            }
          />
        </div>
      )}

      <CreateEmailTemplateDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreate={createTemplate}
        onCreated={handleCreated}
      />
    </PageContainer>
  );
}

function EditorSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-4" aria-hidden="true">
      <div className="grid gap-4 xl:grid-cols-2">
        <Skeleton className="h-[640px] w-full rounded-lg" />
        <Skeleton className="h-[640px] w-full rounded-lg" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function EmailTemplateEditorPage(): React.JSX.Element {
  const { templateCode = '' } = useParams<{ templateCode: string }>();
  const {
    template,
    isLoading,
    isRefreshing,
    error,
    refetch,
    save,
    rollback,
    disable,
    sendTest,
  } = useEmailTemplate(templateCode);
  const label = emailTemplateLabel(template?.templateCode ?? templateCode);
  useSetBreadcrumbLabel(label);

  const [isDirty, setIsDirty] = useState(false);
  const guard = useUnsavedChangesGuard(isDirty);

  let content: React.ReactNode;
  if (isLoading) {
    content = (
      <>
        <PageHeader
          title={label}
          subtitle={<Skeleton className="h-4 w-64" />}
        />
        <EditorSkeleton />
      </>
    );
  } else if (!template) {
    content = (
      <>
        <PageHeader
          title={label}
          subtitle={<span className="font-mono text-xs">{templateCode}</span>}
        />
        <ErrorState
          title="This template could not be loaded"
          message={error ?? 'The template was not found.'}
          onRetry={() => void refetch()}
          retryLabel="Try again"
          isRetrying={isRefreshing}
        />
      </>
    );
  } else {
    content = (
      <EmailTemplateEditor
        // Re-initialise the draft whenever the active version changes (save / restore).
        key={`${template.templateCode}:${template.version ?? 'none'}`}
        template={template}
        onSave={save}
        onRollback={rollback}
        onDisable={disable}
        onSendTest={sendTest}
        onDirtyChange={setIsDirty}
      />
    );
  }

  return (
    <PageContainer>
      {content}

      <ConfirmDialog
        isOpen={guard.pendingPath !== null}
        onClose={guard.cancel}
        onConfirm={guard.proceed}
        title="Discard unsaved changes?"
        message="Your edits to this template haven't been saved. Leaving this page discards them."
        variant="warning"
        confirmText="Discard changes"
        cancelText="Keep editing"
      />
    </PageContainer>
  );
}

export default EmailTemplatesPage;
