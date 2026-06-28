/**
 * EmailTemplateEditor
 *
 * Edits a transactional template's subject + HTML + plain-text as one versioned
 * unit, with an allowlisted variable insert menu, live server preview (sandboxed
 * iframe / plain-text), send-test, reset-to-default, and version history with
 * rollback.
 *
 * The container loads the template; the inner form is keyed by code+version so a
 * fresh load (incl. after save/rollback) re-initialises the draft via lazy
 * useState — no copy-prop-to-state effect required.
 */

import React from 'react';
import { History, RotateCcw, Save, Send } from 'lucide-react';
import { Badge, Button, ConfirmDialog, Input, Skeleton } from '@/components/common';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks';
import { useEmailTemplate } from '@/hooks/useEmailTemplates';
import {
  draftFieldIssues,
  emailTemplateLabel,
  validateTemplateDraft,
  type EmailTemplateDetail,
  type EmailTemplateDraft,
  type EmailTemplatePreview as EmailTemplatePreviewData,
  type SendTestResult,
} from '@/types/email-templates.types';
import { VariableInsertMenu } from './VariableInsertMenu';
import { EmailTemplatePreview } from './EmailTemplatePreview';

type Field = 'subject' | 'html' | 'text';

const SUBJECT_MAX_LENGTH = 255; // mirrors the backend subject limit

interface EmailTemplateEditorProps {
  templateCode: string;
  /** Reports unsaved-edit state up so the page can guard navigation away. */
  onDirtyChange?: (dirty: boolean) => void;
}

export function EmailTemplateEditor({
  templateCode,
  onDirtyChange,
}: EmailTemplateEditorProps): React.JSX.Element {
  const { template, isLoading, error, save, preview, sendTest, rollback } = useEmailTemplate(templateCode);

  if (isLoading) {
    return <EditorSkeleton />;
  }
  if (error || !template) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        {error ?? 'Template not found.'}
      </div>
    );
  }

  return (
    <EditorForm
      key={`${template.templateCode}:${template.version ?? 'code'}`}
      template={template}
      save={save}
      preview={preview}
      sendTest={sendTest}
      rollback={rollback}
      onDirtyChange={onDirtyChange}
    />
  );
}

interface EditorFormProps {
  template: EmailTemplateDetail;
  save: (draft: EmailTemplateDraft) => Promise<number | null>;
  preview: (draft?: EmailTemplateDraft) => Promise<EmailTemplatePreviewData>;
  sendTest: (draft?: EmailTemplateDraft) => Promise<SendTestResult>;
  rollback: (version: number) => Promise<void>;
  onDirtyChange?: (dirty: boolean) => void;
}

function EditorForm({
  template,
  save,
  preview,
  sendTest,
  rollback,
  onDirtyChange,
}: EditorFormProps): React.JSX.Element {
  const { showToast } = useToast();

  const [draft, setDraft] = React.useState<EmailTemplateDraft>(() => ({
    subjectTemplate: template.subjectTemplate,
    htmlTemplate: template.htmlTemplate,
    textTemplate: template.textTemplate,
  }));
  const [activeTab, setActiveTab] = React.useState<'html' | 'text'>('html');
  const [previewData, setPreviewData] = React.useState<EmailTemplatePreviewData>({
    subject: '',
    html: '',
    text: '',
  });
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [previewError, setPreviewError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  const [isRollingBack, setIsRollingBack] = React.useState(false);
  const [showHistory, setShowHistory] = React.useState(false);
  const [confirmVersion, setConfirmVersion] = React.useState<number | null>(null);
  const [resetOpen, setResetOpen] = React.useState(false);

  const subjectRef = React.useRef<HTMLInputElement>(null);
  const htmlRef = React.useRef<HTMLTextAreaElement>(null);
  const textRef = React.useRef<HTMLTextAreaElement>(null);
  const lastFocused = React.useRef<Field>('html');

  const validation = React.useMemo(
    () =>
      validateTemplateDraft(draft, {
        allowedVariables: template.allowedVariables,
        requiredVariables: template.requiredVariables,
      }),
    [draft, template]
  );

  const fieldIssues = React.useMemo(
    () => draftFieldIssues(draft, { allowedVariables: template.allowedVariables }),
    [draft, template.allowedVariables]
  );

  const isDirty =
    draft.subjectTemplate !== template.subjectTemplate ||
    draft.htmlTemplate !== template.htmlTemplate ||
    draft.textTemplate !== template.textTemplate;

  const isAtDefault =
    draft.subjectTemplate === template.default.subjectTemplate &&
    draft.htmlTemplate === template.default.htmlTemplate &&
    draft.textTemplate === template.default.textTemplate;

  // Report dirty state up (page guards navigation); clear it on unmount.
  React.useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);
  React.useEffect(() => {
    return (): void => onDirtyChange?.(false);
  }, [onDirtyChange]);

  // Warn on tab close / reload while there are unsaved edits. (The app uses a
  // non-data <BrowserRouter>, so in-app navigation is guarded by the page.)
  React.useEffect(() => {
    if (!isDirty) return undefined;
    const handler = (event: BeforeUnloadEvent): void => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return (): void => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // Debounced live preview from the backend (authoritative render). All state
  // updates happen inside the async timeout callback, not the effect body. While
  // the draft is invalid we keep the last render (shown as "paused") and skip.
  const previewValid = validation.valid;
  React.useEffect(() => {
    if (!previewValid) return undefined;
    let cancelled = false;
    const handle = window.setTimeout(() => {
      setPreviewLoading(true);
      preview(draft)
        .then((result) => {
          if (!cancelled) {
            setPreviewData({ subject: result.subject, html: result.html, text: result.text });
            setPreviewError(null);
          }
        })
        .catch((err: unknown) => {
          if (!cancelled) setPreviewError(err instanceof Error ? err.message : 'Preview failed');
        })
        .finally(() => {
          if (!cancelled) setPreviewLoading(false);
        });
    }, 500);
    return (): void => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [draft, previewValid, preview]);

  const insertVariable = (token: string): void => {
    const field = lastFocused.current;
    const ref =
      field === 'subject' ? subjectRef.current : field === 'text' ? textRef.current : htmlRef.current;
    const key: keyof EmailTemplateDraft =
      field === 'subject' ? 'subjectTemplate' : field === 'text' ? 'textTemplate' : 'htmlTemplate';
    const current = draft[key];
    const start = ref?.selectionStart ?? current.length;
    const end = ref?.selectionEnd ?? current.length;
    const next = current.slice(0, start) + token + current.slice(end);
    setDraft((prev) => ({ ...prev, [key]: next }));
    requestAnimationFrame(() => {
      if (ref) {
        const pos = start + token.length;
        ref.focus();
        ref.setSelectionRange(pos, pos);
      }
    });
  };

  const handleSave = async (): Promise<void> => {
    if (!validation.valid) return;
    setIsSaving(true);
    try {
      const version = await save(draft);
      showToast(
        `Saved ${emailTemplateLabel(template.templateCode)}${version ? ` (v${version})` : ''}`,
        'success'
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save template', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Disabled while a dirty draft is invalid, so admins can't unknowingly test the
  // active version instead of their edits.
  const sendTestDisabled = isSending || (isDirty && !validation.valid);
  const sendTestHint =
    isDirty && !validation.valid
      ? 'Fix the validation errors before sending a test of your draft.'
      : isDirty
        ? 'Sends a rendered test of your unsaved draft to your verified email.'
        : 'Sends the active version to your verified email address.';

  const handleSendTest = async (): Promise<void> => {
    if (sendTestDisabled) return;
    setIsSending(true);
    try {
      // Dirty + valid → test the draft; clean → test the active version.
      const result = await sendTest(isDirty ? draft : undefined);
      showToast(`Test email sent to ${result.recipientMasked}`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to send test email', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const confirmReset = (): void => {
    setDraft({
      subjectTemplate: template.default.subjectTemplate,
      htmlTemplate: template.default.htmlTemplate,
      textTemplate: template.default.textTemplate,
    });
    setResetOpen(false);
    showToast('Loaded the built-in default. Save to apply it.', 'info');
  };

  const handleRollback = async (version: number): Promise<void> => {
    setIsRollingBack(true);
    try {
      await rollback(version);
      setConfirmVersion(null);
      showToast(`Rolled back to v${version}`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Rollback failed', 'error');
    } finally {
      setIsRollingBack(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="font-mono text-xs">{template.templateCode}</span>
          <Badge variant={template.isCustomized ? 'info' : 'secondary'} size="sm">
            {template.isCustomized ? `Customized · v${template.version}` : 'Built-in default'}
          </Badge>
          {isDirty && (
            <Badge variant="warning" size="sm" dot>
              Unsaved changes
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => setShowHistory((v) => !v)}>
            <History size={15} className="mr-1.5" /> History
          </Button>
          <Button variant="outline" onClick={() => setResetOpen(true)} disabled={isAtDefault}>
            <RotateCcw size={15} className="mr-1.5" /> Reset to default
          </Button>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                {/* span keeps the tooltip reachable even when the button is disabled */}
                <span className="inline-flex">
                  <Button
                    variant="outline"
                    onClick={() => void handleSendTest()}
                    disabled={sendTestDisabled}
                  >
                    <Send size={15} className="mr-1.5" /> {isSending ? 'Sending…' : 'Send test'}
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>{sendTestHint}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button
            variant="primary"
            onClick={() => void handleSave()}
            disabled={!validation.valid || !isDirty || isSaving}
          >
            <Save size={15} className="mr-1.5" /> {isSaving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Version history */}
      {showHistory && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Version history</h3>
          {template.versions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No saved versions yet — this template uses the built-in default.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {template.versions.map((v) => (
                <li key={v.version} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">v{v.version}</span>
                    {v.isActive && (
                      <Badge variant="success" size="sm">
                        Active
                      </Badge>
                    )}
                    <span className="text-foreground">{v.subjectTemplate}</span>
                    {v.createdAt && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(v.createdAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                  {!v.isActive && (
                    <Button variant="outline" onClick={() => setConfirmVersion(v.version)}>
                      Restore
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Editor + preview */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-lg border border-border bg-card p-4">
          <Input
            id="tmpl-subject"
            ref={subjectRef}
            fullWidth
            label="Subject"
            value={draft.subjectTemplate}
            maxLength={SUBJECT_MAX_LENGTH}
            showCharCount
            helperText="Single line. Insert $variables from the menu below."
            onFocus={() => (lastFocused.current = 'subject')}
            onChange={(e) => setDraft((prev) => ({ ...prev, subjectTemplate: e.target.value }))}
            placeholder="Activate your $app_name email"
          />

          <VariableInsertMenu
            variables={template.allowedVariables}
            required={template.requiredVariables}
            onInsert={insertVariable}
          />

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'html' | 'text')}>
            <TabsList>
              <TabsTrigger value="html">
                HTML body
                {fieldIssues.html && (
                  <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-warning" aria-hidden="true" />
                )}
              </TabsTrigger>
              <TabsTrigger value="text">
                Plain text
                {fieldIssues.text && (
                  <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-warning" aria-hidden="true" />
                )}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="html">
              <Textarea
                ref={htmlRef}
                aria-label="HTML body"
                value={draft.htmlTemplate}
                onFocus={() => (lastFocused.current = 'html')}
                onChange={(e) => setDraft((prev) => ({ ...prev, htmlTemplate: e.target.value }))}
                spellCheck={false}
                className="min-h-[480px] font-mono text-xs leading-relaxed"
              />
            </TabsContent>
            <TabsContent value="text">
              <Textarea
                ref={textRef}
                aria-label="Plain text body"
                value={draft.textTemplate}
                onFocus={() => (lastFocused.current = 'text')}
                onChange={(e) => setDraft((prev) => ({ ...prev, textTemplate: e.target.value }))}
                spellCheck={false}
                className="min-h-[480px] font-mono text-xs leading-relaxed"
              />
            </TabsContent>
          </Tabs>

          {!validation.valid && (
            <ul
              role="alert"
              aria-live="polite"
              className="space-y-1 rounded-md border border-warning/30 bg-warning/5 p-3 text-xs text-warning"
            >
              {validation.errors.map((err) => (
                <li key={err}>• {err}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="min-h-[520px]">
          <EmailTemplatePreview
            subject={previewData.subject}
            html={previewData.html}
            text={previewData.text}
            mode={activeTab}
            isLoading={previewLoading}
            error={previewError}
            paused={!validation.valid}
          />
        </div>
      </div>

      <ConfirmDialog
        isOpen={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={confirmReset}
        title="Load built-in default?"
        message="This replaces the editor contents with the built-in default. Unsaved edits will be lost — save afterwards to apply it."
        variant="warning"
        confirmText="Load default"
        cancelText="Cancel"
      />

      <ConfirmDialog
        isOpen={confirmVersion !== null}
        onClose={() => setConfirmVersion(null)}
        onConfirm={() => confirmVersion !== null && void handleRollback(confirmVersion)}
        title={confirmVersion !== null ? `Roll back to v${confirmVersion}?` : 'Roll back?'}
        message="This re-activates the selected version. It becomes the version sent to users."
        variant="warning"
        confirmText="Roll back"
        isLoading={isRollingBack}
      />
    </div>
  );
}

function EditorSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-5 w-56" />
        <div className="flex gap-2">
          <Skeleton variant="button" />
          <Skeleton variant="button" />
          <Skeleton variant="button" />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[520px] w-full rounded-lg" />
        <Skeleton className="h-[520px] w-full rounded-lg" />
      </div>
    </div>
  );
}

export default EmailTemplateEditor;
