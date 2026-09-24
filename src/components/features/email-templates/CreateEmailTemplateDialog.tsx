/**
 * CreateEmailTemplateDialog
 *
 * Creates a dynamic (non-built-in) template through `POST /admin/email-templates`.
 * The backend limits dynamic templates to internal purposes, requires a new
 * snake_case code, and validates the first version like any save; this form
 * mirrors those rules for instant feedback and shows the backend message when
 * the server still rejects it.
 */

import React, { useId, useMemo, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  BUILT_IN_EMAIL_TEMPLATE_CODES,
  EMAIL_TEMPLATE_CODE_PATTERN,
  EMAIL_TEMPLATE_DYNAMIC_PURPOSES,
  EMAIL_TEMPLATE_LIMITS,
  EMAIL_TEMPLATE_VARIABLE_PATTERN,
  emailTemplatePurposeLabel,
  parseVariableList,
  validateTemplateDraft,
  type EmailTemplateCreateInput,
  type EmailTemplateCreateResult,
  type EmailTemplateDynamicPurpose,
} from '@/types/email-templates.types';
import { VariableInsertMenu } from './VariableInsertMenu';
import { insertAtCaret } from './caret';

const PURPOSE_DESCRIPTIONS: Record<EmailTemplateDynamicPurpose, string> = {
  delivery_operation:
    'Operational notices, such as delivery or status updates.',
  security_notification: 'Account security alerts sent to the account owner.',
};

type BodyField = 'subject' | 'html' | 'text';

export interface CreateEmailTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (
    input: EmailTemplateCreateInput
  ) => Promise<EmailTemplateCreateResult>;
  /** Called after the API confirms the template was created. */
  onCreated: (result: EmailTemplateCreateResult) => void;
}

export function CreateEmailTemplateDialog({
  open,
  onOpenChange,
  onCreate,
  onCreated,
}: CreateEmailTemplateDialogProps): React.JSX.Element {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !isSubmitting && onOpenChange(next)}
    >
      <DialogContent size="lg" className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create template</DialogTitle>
          <DialogDescription>
            Custom templates are sent by internal services for delivery updates
            and security notices. Version 1 is active as soon as it is created.
          </DialogDescription>
        </DialogHeader>
        {/* Rendered only while open, so every opening starts from a blank form. */}
        {open && (
          <CreateTemplateForm
            isSubmitting={isSubmitting}
            setIsSubmitting={setIsSubmitting}
            onCancel={() => onOpenChange(false)}
            onCreate={onCreate}
            onCreated={onCreated}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface CreateTemplateFormProps {
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;
  onCancel: () => void;
  onCreate: CreateEmailTemplateDialogProps['onCreate'];
  onCreated: CreateEmailTemplateDialogProps['onCreated'];
}

function CreateTemplateForm({
  isSubmitting,
  setIsSubmitting,
  onCancel,
  onCreate,
  onCreated,
}: CreateTemplateFormProps): React.JSX.Element {
  const baseId = useId();
  const [code, setCode] = useState('');
  const [purpose, setPurpose] =
    useState<EmailTemplateDynamicPurpose>('delivery_operation');
  const [variablesInput, setVariablesInput] = useState('');
  const [requiredChoice, setRequiredChoice] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState('');
  const [text, setText] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const subjectRef = useRef<HTMLInputElement>(null);
  const htmlRef = useRef<HTMLTextAreaElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const lastFocused = useRef<BodyField>('html');

  const variables = useMemo(
    () => parseVariableList(variablesInput),
    [variablesInput]
  );
  const validVariables = variables.filter((name) =>
    EMAIL_TEMPLATE_VARIABLE_PATTERN.test(name)
  );
  const invalidVariables = variables.filter(
    (name) => !EMAIL_TEMPLATE_VARIABLE_PATTERN.test(name)
  );
  const required = requiredChoice.filter((name) =>
    validVariables.includes(name)
  );

  const normalizedCode = code.trim().toLowerCase();
  const codeError = !normalizedCode
    ? 'Enter a code.'
    : normalizedCode.length > EMAIL_TEMPLATE_LIMITS.code
      ? `Use at most ${EMAIL_TEMPLATE_LIMITS.code} characters.`
      : !EMAIL_TEMPLATE_CODE_PATTERN.test(normalizedCode)
        ? 'Use lowercase snake_case: letters and digits separated by single underscores.'
        : BUILT_IN_EMAIL_TEMPLATE_CODES.includes(normalizedCode)
          ? 'This code belongs to a built-in template.'
          : null;
  const variablesError = invalidVariables.length
    ? `Not a valid variable name: ${invalidVariables.join(', ')}.`
    : null;

  const draftValidation = validateTemplateDraft(
    { subjectTemplate: subject, htmlTemplate: html, textTemplate: text },
    { allowedVariables: validVariables, requiredVariables: required }
  );
  const isValid = !codeError && !variablesError && draftValidation.valid;

  const insertVariable = (token: string): void => {
    const field = lastFocused.current;
    const el =
      field === 'subject'
        ? subjectRef.current
        : field === 'text'
          ? textRef.current
          : htmlRef.current;
    const current =
      field === 'subject' ? subject : field === 'text' ? text : html;
    const setter =
      field === 'subject' ? setSubject : field === 'text' ? setText : setHtml;
    const { next, restore } = insertAtCaret(el, current, token);
    setter(next);
    requestAnimationFrame(restore);
  };

  const toggleRequired = (name: string, checked: boolean): void => {
    setRequiredChoice((prev) =>
      checked
        ? [...new Set([...prev, name])]
        : prev.filter((item) => item !== name)
    );
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();
    setShowErrors(true);
    if (!isValid) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const result = await onCreate({
        templateCode: normalizedCode,
        purpose,
        allowedVariables: validVariables,
        requiredVariables: required,
        subjectTemplate: subject,
        htmlTemplate: html,
        textTemplate: text,
      });
      setIsSubmitting(false);
      onCreated(result);
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'The template could not be created.'
      );
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="space-y-5"
      noValidate
    >
      {submitError && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-[13px] text-destructive"
        >
          {submitError}
        </div>
      )}

      <Input
        label="Code"
        fullWidth
        value={code}
        onChange={(event) => setCode(event.target.value)}
        placeholder="ops_incident_notice"
        className="font-mono"
        autoComplete="off"
        spellCheck={false}
        maxLength={EMAIL_TEMPLATE_LIMITS.code}
        error={showErrors ? (codeError ?? undefined) : undefined}
        helperText="Lowercase snake_case. Services send the template by this code; it can't be changed later."
        disabled={isSubmitting}
      />

      <fieldset className="space-y-2" disabled={isSubmitting}>
        <legend className="mb-1.5 text-sm font-medium text-foreground">
          Purpose
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {EMAIL_TEMPLATE_DYNAMIC_PURPOSES.map((option) => (
            <label
              key={option}
              className={cn(
                'flex cursor-pointer items-start gap-2.5 rounded-md border px-3 py-2.5 transition-colors',
                purpose === option
                  ? 'border-primary bg-primary-subtle/40'
                  : 'border-border hover:bg-accent/40'
              )}
            >
              <input
                type="radio"
                name={`${baseId}-purpose`}
                value={option}
                checked={purpose === option}
                onChange={() => setPurpose(option)}
                className="mt-0.5 accent-primary"
              />
              <span className="min-w-0">
                <span className="block text-[13px] font-medium text-foreground">
                  {emailTemplatePurposeLabel(option)}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {PURPOSE_DESCRIPTIONS[option]}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-2">
        <Input
          label="Variables"
          fullWidth
          value={variablesInput}
          onChange={(event) => setVariablesInput(event.target.value)}
          placeholder="notice, ticket_id"
          className="font-mono"
          autoComplete="off"
          spellCheck={false}
          error={variablesError ?? undefined}
          helperText="Placeholder names the template may use, separated by commas or spaces. Callers supply the values."
          disabled={isSubmitting}
        />
        {validVariables.length > 0 && (
          <fieldset
            className="rounded-md border border-border px-3 py-2.5"
            disabled={isSubmitting}
          >
            <legend className="px-1 text-xs text-muted-foreground">
              Required — must appear in every version
            </legend>
            <div className="flex flex-wrap gap-x-4 gap-y-2 font-mono">
              {validVariables.map((name) => (
                <Checkbox
                  key={name}
                  id={`${baseId}-required-${name}`}
                  label={`$${name}`}
                  checked={required.includes(name)}
                  onCheckedChange={(checked) =>
                    toggleRequired(name, checked === true)
                  }
                  disabled={isSubmitting}
                />
              ))}
            </div>
          </fieldset>
        )}
      </div>

      <div className="space-y-3">
        <Input
          ref={subjectRef}
          label="Subject"
          fullWidth
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          onFocus={() => (lastFocused.current = 'subject')}
          maxLength={EMAIL_TEMPLATE_LIMITS.subject}
          placeholder="Notice $ticket_id"
          disabled={isSubmitting}
        />
        <VariableInsertMenu
          variables={validVariables}
          required={required}
          onInsert={insertVariable}
          disabled={isSubmitting}
        />
        <Textarea
          ref={htmlRef}
          label="HTML body"
          value={html}
          onChange={(event) => setHtml(event.target.value)}
          onFocus={() => (lastFocused.current = 'html')}
          rows={6}
          spellCheck={false}
          placeholder="<p>$notice</p>"
          className="font-mono text-xs"
          disabled={isSubmitting}
        />
        <Textarea
          ref={textRef}
          label="Plain-text body"
          value={text}
          onChange={(event) => setText(event.target.value)}
          onFocus={() => (lastFocused.current = 'text')}
          rows={4}
          spellCheck={false}
          placeholder="$notice"
          className="font-mono text-xs"
          disabled={isSubmitting}
        />
      </div>

      {showErrors && !draftValidation.valid && (
        <ul
          role="alert"
          className="m-0 list-none space-y-1 rounded-md border border-warning/30 bg-warning-subtle px-3 py-2 text-xs text-warning-subtle-foreground"
        >
          {draftValidation.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}

      <DialogFooter>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Create template
        </Button>
      </DialogFooter>
    </form>
  );
}

export default CreateEmailTemplateDialog;
