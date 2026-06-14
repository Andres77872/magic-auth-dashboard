/**
 * EmailTemplateEditor
 *
 * Edits a transactional template's subject + HTML + plain-text as one versioned
 * unit, with an allowlisted variable insert menu, live server preview (sandboxed
 * iframe), send-test, reset-to-default, and version history with rollback.
 *
 * The container loads the template; the inner form is keyed by code+version so a
 * fresh load (incl. after save/rollback) re-initialises the draft via lazy
 * useState — no copy-prop-to-state effect required.
 */

import React from 'react';
import { History, RotateCcw, Save, Send } from 'lucide-react';
import { Button, Input } from '@/components/common';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks';
import { useEmailTemplate } from '@/hooks/useEmailTemplates';
import {
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

interface EmailTemplateEditorProps {
  templateCode: string;
}

export function EmailTemplateEditor({ templateCode }: EmailTemplateEditorProps): React.JSX.Element {
  const { template, isLoading, error, save, preview, sendTest, rollback } = useEmailTemplate(templateCode);

  if (isLoading) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Loading template…</div>;
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
    />
  );
}

interface EditorFormProps {
  template: EmailTemplateDetail;
  save: (draft: EmailTemplateDraft) => Promise<number | null>;
  preview: (draft?: EmailTemplateDraft) => Promise<EmailTemplatePreviewData>;
  sendTest: (draft?: EmailTemplateDraft) => Promise<SendTestResult>;
  rollback: (version: number) => Promise<void>;
}

function EditorForm({ template, save, preview, sendTest, rollback }: EditorFormProps): React.JSX.Element {
  const { showToast } = useToast();

  const [draft, setDraft] = React.useState<EmailTemplateDraft>(() => ({
    subjectTemplate: template.subjectTemplate,
    htmlTemplate: template.htmlTemplate,
    textTemplate: template.textTemplate,
  }));
  const [activeTab, setActiveTab] = React.useState<'html' | 'text'>('html');
  const [previewHtml, setPreviewHtml] = React.useState('');
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [previewError, setPreviewError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  const [showHistory, setShowHistory] = React.useState(false);
  const [confirmVersion, setConfirmVersion] = React.useState<number | null>(null);

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

  const isDirty =
    draft.subjectTemplate !== template.subjectTemplate ||
    draft.htmlTemplate !== template.htmlTemplate ||
    draft.textTemplate !== template.textTemplate;

  // Debounced live preview from the backend (authoritative render). All state
  // updates happen inside the async timeout callback, not the effect body.
  const previewValid = validation.valid;
  React.useEffect(() => {
    if (!previewValid) return undefined;
    let cancelled = false;
    const handle = window.setTimeout(() => {
      setPreviewLoading(true);
      preview(draft)
        .then((result) => {
          if (!cancelled) {
            setPreviewHtml(result.html);
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

  const handleSendTest = async (): Promise<void> => {
    setIsSending(true);
    try {
      const result = await sendTest(validation.valid ? draft : undefined);
      showToast(`Test email sent to ${result.recipientMasked}`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to send test email', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleReset = (): void => {
    setDraft({
      subjectTemplate: template.default.subjectTemplate,
      htmlTemplate: template.default.htmlTemplate,
      textTemplate: template.default.textTemplate,
    });
    showToast('Loaded the built-in default. Save to apply it.', 'info');
  };

  const handleRollback = async (version: number): Promise<void> => {
    try {
      await rollback(version);
      setConfirmVersion(null);
      showToast(`Rolled back to v${version}`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Rollback failed', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-mono text-xs">{template.templateCode}</span>
          <span className="rounded bg-muted px-2 py-0.5 text-xs">
            {template.isCustomized ? `Customized · v${template.version}` : 'Built-in default'}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => setShowHistory((v) => !v)}>
            <History size={15} className="mr-1.5" /> History
          </Button>
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw size={15} className="mr-1.5" /> Reset to default
          </Button>
          <Button variant="outline" onClick={() => void handleSendTest()} disabled={isSending}>
            <Send size={15} className="mr-1.5" /> {isSending ? 'Sending…' : 'Send test'}
          </Button>
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
                      <span className="rounded bg-success/10 px-2 py-0.5 text-xs text-success">Active</span>
                    )}
                    <span className="text-foreground">{v.subjectTemplate}</span>
                    {v.createdAt && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(v.createdAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                  {!v.isActive &&
                    (confirmVersion === v.version ? (
                      <span className="flex items-center gap-1">
                        <Button variant="danger" onClick={() => void handleRollback(v.version)}>
                          Confirm
                        </Button>
                        <Button variant="outline" onClick={() => setConfirmVersion(null)}>
                          Cancel
                        </Button>
                      </span>
                    ) : (
                      <Button variant="outline" onClick={() => setConfirmVersion(v.version)}>
                        Restore
                      </Button>
                    ))}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Editor + preview */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-lg border border-border bg-card p-4">
          <div>
            <label htmlFor="tmpl-subject" className="mb-1 block text-xs font-medium text-muted-foreground">
              Subject
            </label>
            <Input
              id="tmpl-subject"
              ref={subjectRef}
              value={draft.subjectTemplate}
              onFocus={() => (lastFocused.current = 'subject')}
              onChange={(e) => setDraft((prev) => ({ ...prev, subjectTemplate: e.target.value }))}
              placeholder="Activate your $app_name email"
            />
          </div>

          <VariableInsertMenu
            variables={template.allowedVariables}
            required={template.requiredVariables}
            onInsert={insertVariable}
          />

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'html' | 'text')}>
            <TabsList>
              <TabsTrigger value="html">HTML body</TabsTrigger>
              <TabsTrigger value="text">Plain text</TabsTrigger>
            </TabsList>
            <TabsContent value="html">
              <Textarea
                ref={htmlRef}
                value={draft.htmlTemplate}
                onFocus={() => (lastFocused.current = 'html')}
                onChange={(e) => setDraft((prev) => ({ ...prev, htmlTemplate: e.target.value }))}
                spellCheck={false}
                className="min-h-[420px] font-mono text-xs leading-relaxed"
              />
            </TabsContent>
            <TabsContent value="text">
              <Textarea
                ref={textRef}
                value={draft.textTemplate}
                onFocus={() => (lastFocused.current = 'text')}
                onChange={(e) => setDraft((prev) => ({ ...prev, textTemplate: e.target.value }))}
                spellCheck={false}
                className="min-h-[420px] font-mono text-xs leading-relaxed"
              />
            </TabsContent>
          </Tabs>

          {!validation.valid && (
            <ul className="space-y-1 rounded-md border border-warning/30 bg-warning/5 p-3 text-xs text-warning">
              {validation.errors.map((err) => (
                <li key={err}>• {err}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="min-h-[520px]">
          {previewError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {previewError}
            </div>
          ) : (
            <EmailTemplatePreview html={previewHtml} isLoading={previewLoading} />
          )}
        </div>
      </div>
    </div>
  );
}

export default EmailTemplateEditor;
