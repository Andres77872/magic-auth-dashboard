/**
 * EmailTemplateEditor
 *
 * Edits a template's subject + HTML + plain text as one versioned unit:
 * page header with the primary Save action, a content panel with an
 * allowlisted variable insert menu, a live server preview, version history
 * with restore, sample data, and reset / disable / enable.
 *
 * The page loads the template and passes the mutations in; it re-mounts this
 * component (via `key`) whenever the active version changes, so the draft is
 * initialised once from props — no prop-to-state syncing effect.
 */

import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  History,
  MoreHorizontal,
  Power,
  RotateCcw,
  Send,
} from 'lucide-react';
import {
  ActionsMenu,
  ConfirmDialog,
  FactList,
  PageHeader,
  Panel,
  TabNavigation,
  type ActionMenuItem,
} from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/useToast';
import { useEmailTemplatePreview } from '@/hooks/useEmailTemplates';
import { formatDateTime, formatRelativeTime } from '@/utils/formatters';
import {
  EMAIL_TEMPLATE_LIMITS,
  draftFieldIssues,
  emailTemplateLabel,
  emailTemplatePurposeLabel,
  emailTemplateSourceBadge,
  emailTemplateStatusBadge,
  validateTemplateDraft,
  type EmailTemplateDetail,
  type EmailTemplateDraft,
  type EmailTemplateVersion,
  type SendTestResult,
} from '@/types/email-templates.types';
import {
  EmailTemplatePreview,
  type EmailPreviewMode,
} from './EmailTemplatePreview';
import { VariableInsertMenu } from './VariableInsertMenu';
import { insertAtCaret } from './caret';

type Field = 'subject' | EmailPreviewMode;

export interface EmailTemplateEditorProps {
  template: EmailTemplateDetail;
  onSave: (draft: EmailTemplateDraft) => Promise<number | null>;
  onRollback: (version: number) => Promise<void>;
  onDisable: () => Promise<void>;
  onSendTest: (draft?: EmailTemplateDraft) => Promise<SendTestResult>;
  /** Reports unsaved-edit state so the page can guard navigation away. */
  onDirtyChange?: (dirty: boolean) => void;
}

function sameDraft(a: EmailTemplateDraft, b: EmailTemplateDraft): boolean {
  return (
    a.subjectTemplate === b.subjectTemplate &&
    a.htmlTemplate === b.htmlTemplate &&
    a.textTemplate === b.textTemplate
  );
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

export function EmailTemplateEditor({
  template,
  onSave,
  onRollback,
  onDisable,
  onSendTest,
  onDirtyChange,
}: EmailTemplateEditorProps): React.JSX.Element {
  const { showToast } = useToast();
  const label = emailTemplateLabel(template.templateCode);

  const saved = React.useMemo<EmailTemplateDraft>(
    () => ({
      subjectTemplate: template.subjectTemplate,
      htmlTemplate: template.htmlTemplate,
      textTemplate: template.textTemplate,
    }),
    [template.subjectTemplate, template.htmlTemplate, template.textTemplate]
  );
  const [draft, setDraft] = React.useState<EmailTemplateDraft>(saved);
  const [body, setBody] = React.useState<EmailPreviewMode>('html');
  const [pending, setPending] = React.useState<
    'save' | 'send' | 'rollback' | 'disable' | 'enable' | null
  >(null);
  const [confirm, setConfirm] = React.useState<
    'reset' | 'disable' | 'enable' | null
  >(null);
  const [restoreVersion, setRestoreVersion] = React.useState<number | null>(
    null
  );

  const subjectRef = React.useRef<HTMLInputElement>(null);
  const bodyRef = React.useRef<HTMLTextAreaElement>(null);
  const lastFocused = React.useRef<Field>('html');

  const variableRules = React.useMemo(
    () => ({
      allowedVariables: template.allowedVariables,
      requiredVariables: template.requiredVariables,
    }),
    [template.allowedVariables, template.requiredVariables]
  );
  const validation = React.useMemo(
    () => validateTemplateDraft(draft, variableRules),
    [draft, variableRules]
  );
  const fieldIssues = React.useMemo(
    () => draftFieldIssues(draft, variableRules),
    [draft, variableRules]
  );

  const isDirty = !sameDraft(draft, saved);
  const isAtDefault =
    template.builtInDefault !== null &&
    sameDraft(draft, template.builtInDefault);
  const activeVersion =
    template.versions.find((version) => version.isActive) ?? null;

  const {
    preview,
    isLoading: previewLoading,
    error: previewError,
  } = useEmailTemplatePreview(template.templateCode, draft, {
    enabled: validation.valid,
  });

  // Report dirty state up (the page guards navigation); clear it on unmount.
  React.useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);
  React.useEffect(() => () => onDirtyChange?.(false), [onDirtyChange]);

  const insertVariable = (token: string): void => {
    const target: Field = lastFocused.current === 'subject' ? 'subject' : body;
    const key: keyof EmailTemplateDraft =
      target === 'subject'
        ? 'subjectTemplate'
        : target === 'text'
          ? 'textTemplate'
          : 'htmlTemplate';
    const field = target === 'subject' ? subjectRef.current : bodyRef.current;
    const { next, restore } = insertAtCaret(field, draft[key], token);
    setDraft((prev) => ({ ...prev, [key]: next }));
    requestAnimationFrame(restore);
  };

  const run = async (
    kind: NonNullable<typeof pending>,
    action: () => Promise<string>,
    failure: string
  ): Promise<boolean> => {
    setPending(kind);
    try {
      showToast(await action(), 'success');
      return true;
    } catch (err) {
      showToast(errorMessage(err, failure), 'error');
      return false;
    } finally {
      setPending(null);
    }
  };

  const handleSave = (): void => {
    if (!validation.valid || !isDirty || pending) return;
    void run(
      'save',
      async () => {
        const version = await onSave(draft);
        return version !== null
          ? `Saved ${label} as version ${version}.`
          : `Saved ${label}.`;
      },
      'The template could not be saved.'
    );
  };

  // A dirty draft is what gets tested, so an invalid draft blocks the test
  // (otherwise the active version would be sent instead of the edits).
  const sendBlockedReason = !template.isEnabled
    ? 'Enable the template before sending a test.'
    : isDirty && !validation.valid
      ? 'Fix the problems in the draft before sending a test of it.'
      : null;
  const sendHint =
    sendBlockedReason ??
    (isDirty
      ? 'Sends your unsaved draft to your own verified email address.'
      : 'Sends the active version to your own verified email address.');

  const handleSendTest = (): void => {
    if (sendBlockedReason || pending) return;
    void run(
      'send',
      async () => {
        const result = await onSendTest(isDirty ? draft : undefined);
        return `Test email sent to ${result.recipientMasked}.`;
      },
      'The test email could not be sent.'
    );
  };

  const handleRestore = async (version: number): Promise<void> => {
    const ok = await run(
      'rollback',
      async () => {
        await onRollback(version);
        return `Version ${version} is active again.`;
      },
      'The version could not be restored.'
    );
    if (ok) setRestoreVersion(null);
  };

  const handleDisable = async (): Promise<void> => {
    const ok = await run(
      'disable',
      async () => {
        await onDisable();
        return `${label} is disabled.`;
      },
      'The template could not be disabled.'
    );
    if (ok) setConfirm(null);
  };

  // Re-activating the current stored version re-enables without a new version;
  // a built-in default has no stored version, so enabling saves it as one.
  const canEnable =
    !template.isEnabled &&
    (template.version !== null || template.source === 'code');
  const handleEnable = async (): Promise<void> => {
    const ok = await run(
      'enable',
      async () => {
        if (template.version !== null) await onRollback(template.version);
        else await onSave(saved);
        return `${label} is enabled.`;
      },
      'The template could not be enabled.'
    );
    if (ok) setConfirm(null);
  };

  const menuItems: ActionMenuItem[] = [];
  if (template.builtInDefault !== null) {
    menuItems.push({
      key: 'reset',
      label: 'Load built-in default',
      icon: <RotateCcw />,
      onClick: () => setConfirm('reset'),
      disabled: isAtDefault || pending !== null,
    });
  }
  if (template.isEnabled) {
    menuItems.push({
      key: 'disable',
      label: 'Disable template',
      icon: <Power />,
      onClick: () => setConfirm('disable'),
      disabled: pending !== null,
      destructive: true,
    });
  }

  const statusBadge = emailTemplateStatusBadge(template);
  const sourceBadge = emailTemplateSourceBadge(template);

  const subtitle = (
    <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
      <span className="font-mono text-xs">{template.templateCode}</span>
      {template.isDynamic && (
        <span>· {emailTemplatePurposeLabel(template.purpose)}</span>
      )}
      <span aria-hidden="true">·</span>
      {activeVersion ? (
        <span title={formatDateTime(activeVersion.createdAt)}>
          Version {activeVersion.version} saved{' '}
          {formatRelativeTime(activeVersion.createdAt)}
        </span>
      ) : template.source === 'code' ? (
        <span>Sending the built-in default</span>
      ) : (
        <span>No saved version</span>
      )}
    </span>
  );

  return (
    <>
      <PageHeader
        title={label}
        subtitle={subtitle}
        badge={
          <>
            <Badge variant={statusBadge.variant} size="sm" dot>
              {statusBadge.label}
            </Badge>
            <Badge variant={sourceBadge.variant} size="sm">
              {sourceBadge.label}
            </Badge>
            {isDirty && (
              <Badge variant="warning" size="sm">
                Unsaved changes
              </Badge>
            )}
          </>
        }
        actions={
          <>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  {/* The span keeps the hint reachable while the button is disabled. */}
                  <span
                    className="inline-flex"
                    tabIndex={sendBlockedReason ? 0 : -1}
                  >
                    <Button
                      variant="secondary"
                      onClick={handleSendTest}
                      disabled={Boolean(sendBlockedReason) || pending !== null}
                      loading={pending === 'send'}
                    >
                      <Send aria-hidden="true" />
                      Send test
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>{sendHint}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {menuItems.length > 0 && (
              <ActionsMenu
                ariaLabel="More template actions"
                triggerIcon={<MoreHorizontal className="h-4 w-4" />}
                triggerClassName="h-[34px] w-[34px] border border-input bg-card"
                items={menuItems}
              />
            )}
            <Button
              onClick={handleSave}
              disabled={!validation.valid || !isDirty || pending !== null}
              loading={pending === 'save'}
            >
              Save
            </Button>
          </>
        }
      />

      <div className="space-y-4">
        {!template.isEnabled && (
          <div
            role="status"
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive-subtle px-4 py-3"
          >
            <div className="flex min-w-0 items-start gap-2.5 text-[13px] text-destructive-subtle-foreground">
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              <p className="m-0">
                This template is disabled
                {template.disabledAt && (
                  <span title={formatDateTime(template.disabledAt)}>
                    {' '}
                    ({formatRelativeTime(template.disabledAt)})
                  </span>
                )}
                . Emails that use it are cancelled instead of sent.{' '}
                {canEnable
                  ? 'Enable it, save a new version or restore one from the history.'
                  : 'Save a version to enable it.'}
              </p>
            </div>
            {canEnable && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  template.version !== null
                    ? void handleEnable()
                    : setConfirm('enable')
                }
                disabled={pending !== null}
                loading={pending === 'enable'}
              >
                Enable template
              </Button>
            )}
          </div>
        )}

        <div className="grid gap-4 xl:grid-cols-2">
          <Panel
            title="Content"
            description="Subject, HTML and plain text are saved together as one version."
            actions={
              <TabNavigation
                variant="segmented"
                size="sm"
                ariaLabel="Body to edit"
                activeTab={body}
                onChange={(id) => setBody(id === 'text' ? 'text' : 'html')}
                tabs={[
                  {
                    id: 'html',
                    label: 'HTML',
                    icon: fieldIssues.html ? (
                      <AlertCircle className="text-warning" />
                    ) : undefined,
                  },
                  {
                    id: 'text',
                    label: 'Plain text',
                    icon: fieldIssues.text ? (
                      <AlertCircle className="text-warning" />
                    ) : undefined,
                  },
                ]}
              />
            }
          >
            <div className="space-y-3">
              <Input
                ref={subjectRef}
                fullWidth
                label="Subject"
                value={draft.subjectTemplate}
                maxLength={EMAIL_TEMPLATE_LIMITS.subject}
                showCharCount
                validationState={fieldIssues.subject ? 'warning' : null}
                onFocus={() => (lastFocused.current = 'subject')}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    subjectTemplate: event.target.value,
                  }))
                }
                placeholder="Activate your $app_name email"
              />

              <VariableInsertMenu
                variables={template.allowedVariables}
                required={template.requiredVariables}
                onInsert={insertVariable}
              />

              <Textarea
                key={body}
                ref={bodyRef}
                aria-label={body === 'html' ? 'HTML body' : 'Plain-text body'}
                value={
                  body === 'html' ? draft.htmlTemplate : draft.textTemplate
                }
                validationState={fieldIssues[body] ? 'warning' : null}
                onFocus={() => (lastFocused.current = body)}
                onChange={(event) => {
                  const value = event.target.value;
                  setDraft((prev) =>
                    body === 'html'
                      ? { ...prev, htmlTemplate: value }
                      : { ...prev, textTemplate: value }
                  );
                }}
                spellCheck={false}
                className="min-h-[440px] font-mono text-xs leading-relaxed"
              />

              {!validation.valid && (
                <ul
                  role="alert"
                  className="m-0 list-none space-y-1 rounded-md border border-warning/30 bg-warning-subtle px-3 py-2 text-xs text-warning-subtle-foreground"
                >
                  {validation.errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              )}
            </div>
          </Panel>

          <EmailTemplatePreview
            subject={preview?.subject ?? ''}
            html={preview?.html ?? ''}
            text={preview?.text ?? ''}
            mode={body}
            isLoading={
              previewLoading ||
              (validation.valid && preview === null && previewError === null)
            }
            error={previewError}
            paused={!validation.valid}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <VersionHistoryPanel
            versions={template.versions}
            usesBuiltInDefault={template.source === 'code'}
            disabled={pending !== null}
            onRestore={setRestoreVersion}
          />
          <Panel
            title="Sample data"
            description="Values the server substitutes in previews and test sends."
          >
            {preview && Object.keys(preview.sampleVariables).length > 0 ? (
              <FactList
                facts={Object.entries(preview.sampleVariables).map(
                  ([name, value]) => ({
                    label: `$${name}`,
                    value: <span className="break-all">{value}</span>,
                    mono: true,
                  })
                )}
              />
            ) : (
              <p className="m-0 text-[13px] text-muted-foreground">
                {preview
                  ? 'This template has no variables.'
                  : 'Sample values appear with the first preview.'}
              </p>
            )}
          </Panel>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirm === 'reset'}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          if (template.builtInDefault) setDraft(template.builtInDefault);
          setConfirm(null);
          showToast(
            'Loaded the built-in default. Save to make it the active version.',
            'info'
          );
        }}
        title="Load the built-in default?"
        message="The editor is replaced with the built-in subject, HTML and plain text. Nothing changes until you save; unsaved edits are lost."
        variant="warning"
        confirmText="Load default"
      />

      <ConfirmDialog
        isOpen={restoreVersion !== null}
        onClose={() => setRestoreVersion(null)}
        onConfirm={() =>
          restoreVersion !== null && void handleRestore(restoreVersion)
        }
        title={`Restore version ${restoreVersion ?? ''}?`}
        message={
          <>
            Version {restoreVersion} becomes the active version and is sent from
            now on. The current version stays in the history.
            {!template.isEnabled && ' The template is enabled again.'}
            {isDirty && ' Your unsaved edits are discarded.'}
          </>
        }
        variant="warning"
        confirmText="Restore version"
        isLoading={pending === 'rollback'}
      />

      <ConfirmDialog
        isOpen={confirm === 'disable'}
        onClose={() => setConfirm(null)}
        onConfirm={() => void handleDisable()}
        title={`Disable ${label}?`}
        message={
          <>
            No one receives these emails while the template is disabled: queued
            messages that use it are cancelled and test sends are blocked.
            Saving a version or restoring one enables it again.
          </>
        }
        confirmText="Disable template"
        confirmationPhrase={
          template.isDynamic ? undefined : template.templateCode
        }
        isLoading={pending === 'disable'}
      />

      <ConfirmDialog
        isOpen={confirm === 'enable'}
        onClose={() => setConfirm(null)}
        onConfirm={() => void handleEnable()}
        title={`Enable ${label}?`}
        message="The built-in default is saved as version 1 and becomes active, so these emails are sent again."
        variant="info"
        confirmText="Enable template"
        isLoading={pending === 'enable'}
      />
    </>
  );
}

interface VersionHistoryPanelProps {
  versions: EmailTemplateVersion[];
  usesBuiltInDefault: boolean;
  disabled: boolean;
  onRestore: (version: number) => void;
}

function VersionHistoryPanel({
  versions,
  usesBuiltInDefault,
  disabled,
  onRestore,
}: VersionHistoryPanelProps): React.JSX.Element {
  return (
    <Panel
      title="Version history"
      description={
        versions.length > 0
          ? `${versions.length} saved ${versions.length === 1 ? 'version' : 'versions'}, newest first`
          : undefined
      }
      padding="none"
    >
      {versions.length === 0 ? (
        <div className="flex items-center gap-2.5 px-5 py-6 text-[13px] text-muted-foreground">
          <History className="h-4 w-4 shrink-0" aria-hidden="true" />
          {usesBuiltInDefault
            ? 'No saved versions. The built-in default is sent until you save one.'
            : 'No saved versions.'}
        </div>
      ) : (
        <ul className="m-0 max-h-[360px] list-none divide-y divide-border overflow-y-auto p-0">
          {versions.map((version) => (
            <li
              key={version.version}
              className="flex items-center gap-3 px-5 py-2.5"
            >
              <span className="w-10 shrink-0 font-mono text-xs text-muted-foreground">
                v{version.version}
              </span>
              <div className="min-w-0 flex-1">
                <span
                  className="block truncate text-[13px] text-foreground"
                  title={version.subjectTemplate}
                >
                  {version.subjectTemplate}
                </span>
                <span
                  className="block text-xs text-muted-foreground"
                  title={formatDateTime(version.createdAt)}
                >
                  {formatRelativeTime(version.createdAt)}
                </span>
              </div>
              {version.isActive ? (
                <Badge variant="success" size="sm">
                  Active
                </Badge>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onRestore(version.version)}
                  disabled={disabled}
                  aria-label={`Restore version ${version.version}`}
                >
                  Restore
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export default EmailTemplateEditor;
