/**
 * Email Templates types
 *
 * DB-managed, versioned transactional email templates edited by ROOT admins.
 * Placeholders use `$name` / `${name}` (string.Template on the backend); the
 * server is the authoritative validator/renderer — these helpers give the
 * editor instant feedback only.
 */

// ─── Raw (snake_case, as returned by the API) ──────────────────────────────
export interface RawEmailTemplateSummary {
  template_code: string;
  purpose: string;
  subject_template: string;
  source: 'db' | 'code';
  version: number | null;
  is_customized: boolean;
  required_variables: string[];
  allowed_variables: string[];
}

export interface RawEmailTemplateVersion {
  version: number;
  subject_template: string;
  is_active: boolean;
  created_at: string | null;
}

export interface RawEmailTemplateDetail extends RawEmailTemplateSummary {
  html_template: string;
  text_template: string;
  default: {
    subject_template: string;
    html_template: string;
    text_template: string;
  };
  versions: RawEmailTemplateVersion[];
}

export interface RawEmailTemplatesListResponse {
  templates: RawEmailTemplateSummary[];
  generated_at: string;
}

export interface RawEmailTemplatePreviewResponse {
  template_code: string;
  subject: string;
  html: string;
  text: string;
  sample_variables: Record<string, string>;
  generated_at: string;
}

export interface RawUpdateEmailTemplateResponse {
  success: boolean;
  template_code: string;
  version: number | null;
  used_variables?: string[];
  updated_at: string;
}

export interface RawSendTestResponse {
  success: boolean;
  template_code: string;
  recipient_masked: string;
  provider: string;
  sent_at: string;
}

// ─── Domain (camelCase) ────────────────────────────────────────────────────
export interface EmailTemplateSummary {
  templateCode: string;
  purpose: string;
  subjectTemplate: string;
  source: 'db' | 'code';
  version: number | null;
  isCustomized: boolean;
  requiredVariables: string[];
  allowedVariables: string[];
}

export interface EmailTemplateVersion {
  version: number;
  subjectTemplate: string;
  isActive: boolean;
  createdAt: string | null;
}

export interface EmailTemplateDetail extends EmailTemplateSummary {
  htmlTemplate: string;
  textTemplate: string;
  default: {
    subjectTemplate: string;
    htmlTemplate: string;
    textTemplate: string;
  };
  versions: EmailTemplateVersion[];
}

export interface EmailTemplateDraft {
  subjectTemplate: string;
  htmlTemplate: string;
  textTemplate: string;
}

export interface EmailTemplatePreview {
  subject: string;
  html: string;
  text: string;
}

export interface SendTestResult {
  recipientMasked: string;
  provider: string;
}

// ─── Human-friendly labels for the fixed transactional codes ───────────────
export const EMAIL_TEMPLATE_LABELS: Record<string, string> = {
  email_activation: 'Email activation',
  password_reset: 'Password reset',
  admin_password_reset: 'Admin password reset',
  security_notification: 'Security notification',
  delivery_operation: 'Delivery update',
};

export function emailTemplateLabel(code: string): string {
  return EMAIL_TEMPLATE_LABELS[code] ?? code;
}

// ─── Client-side draft validation (instant feedback; server is authoritative) ─
const PLACEHOLDER_RE = /\$\{?([a-zA-Z_][a-zA-Z0-9_]*)\}?/g;
// Mirrors the backend FORBIDDEN_HTML_TAGS (note: <meta>/<style>/<head> are
// ALLOWED for the full best-practice document). The server stays authoritative
// for the finer checks (meta-refresh, CSS expression()).
const FORBIDDEN_TAG_RE =
  /<\s*(script|iframe|object|embed|applet|base|form|input|button|textarea|select|option|link|noscript|template|svg|math|frame|frameset|audio|video|source|track|canvas|portal)\b/i;
const FORBIDDEN_ATTR_RE = /\son[a-z]+\s*=/i;
const FORBIDDEN_URL_RE = /(href|src)\s*=\s*["']?\s*(javascript|vbscript|data):/i;

export function extractPlaceholders(text: string): string[] {
  const found = new Set<string>();
  let match: RegExpExecArray | null;
  PLACEHOLDER_RE.lastIndex = 0;
  while ((match = PLACEHOLDER_RE.exec(text)) !== null) {
    found.add(match[1]);
  }
  return [...found];
}

export interface DraftValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateTemplateDraft(
  draft: EmailTemplateDraft,
  options: { allowedVariables: string[]; requiredVariables: string[] }
): DraftValidationResult {
  const errors: string[] = [];
  const { subjectTemplate, htmlTemplate, textTemplate } = draft;

  if (!subjectTemplate.trim()) errors.push('Subject is required.');
  if (/[\r\n]/.test(subjectTemplate)) errors.push('Subject must be a single line.');
  if (!htmlTemplate.trim()) errors.push('HTML body is required.');
  if (!textTemplate.trim()) errors.push('Plain-text body is required.');

  const allowed = new Set(options.allowedVariables);
  const used = new Set<string>([
    ...extractPlaceholders(subjectTemplate),
    ...extractPlaceholders(htmlTemplate),
    ...extractPlaceholders(textTemplate),
  ]);

  const unknown = [...used].filter((name) => !allowed.has(name));
  if (unknown.length) {
    errors.push(`Unknown variable(s): ${unknown.map((v) => '$' + v).join(', ')}.`);
  }

  const missing = options.requiredVariables.filter((name) => !used.has(name));
  if (missing.length) {
    errors.push(`Must include required variable(s): ${missing.map((v) => '$' + v).join(', ')}.`);
  }

  if (FORBIDDEN_TAG_RE.test(htmlTemplate)) {
    errors.push('HTML contains a disallowed tag (e.g. <script>, <iframe>, <style>).');
  }
  if (FORBIDDEN_ATTR_RE.test(htmlTemplate)) {
    errors.push('HTML contains an inline event handler (on… attribute).');
  }
  if (FORBIDDEN_URL_RE.test(htmlTemplate)) {
    errors.push('HTML contains a disallowed URL scheme (javascript:/vbscript:/data:).');
  }

  return { valid: errors.length === 0, errors };
}
