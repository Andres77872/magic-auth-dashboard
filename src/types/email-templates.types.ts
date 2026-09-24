/**
 * Email templates types
 *
 * DB-managed, versioned transactional email templates edited by ROOT admins
 * (api.auth `src/routes/email_templates.py`, prefix `/admin/email-templates`).
 * Placeholders use `$name` / `${name}` (string.Template on the backend); the
 * server is the authoritative validator/renderer — the helpers below give the
 * editor instant feedback only.
 */

// ─── Raw (snake_case, as returned by the API) ──────────────────────────────

/**
 * Where the active parts come from: `db` = a stored version, `code` = the
 * in-code built-in default, `catalog` = a disabled dynamic code with no stored
 * version (bodies are empty).
 */
export type EmailTemplateSource = 'db' | 'code' | 'catalog';

/** Purposes a ROOT user may give a new (dynamic) template. */
export const EMAIL_TEMPLATE_DYNAMIC_PURPOSES = [
  'delivery_operation',
  'security_notification',
] as const;
export type EmailTemplateDynamicPurpose =
  (typeof EMAIL_TEMPLATE_DYNAMIC_PURPOSES)[number];

/** One entry of `GET /admin/email-templates` (`_summary`). */
export interface RawEmailTemplateSummary {
  template_code: string;
  purpose: string;
  subject_template: string;
  source: EmailTemplateSource;
  version: number | null;
  is_customized: boolean;
  is_enabled: boolean;
  is_dynamic: boolean;
  revision: number | null;
  disabled_at: string | null;
  disabled_by: string | null;
  required_variables: string[];
  allowed_variables: string[];
}

export interface RawEmailTemplateParts {
  subject_template: string;
  html_template: string;
  text_template: string;
}

export interface RawEmailTemplateVersion {
  version: number;
  subject_template: string;
  is_active: boolean;
  created_at: string | null;
}

/** `GET /admin/email-templates/{code}` — no `success` key. */
export interface RawEmailTemplateDetail extends RawEmailTemplateSummary {
  html_template: string;
  text_template: string;
  /** In-code parts for built-in codes; `null` for dynamic codes. */
  default: RawEmailTemplateParts | null;
  /** Newest first. */
  versions: RawEmailTemplateVersion[];
  generated_at: string;
}

/** `GET /admin/email-templates` — no `success` key. */
export interface RawEmailTemplatesListResponse {
  templates: RawEmailTemplateSummary[];
  generated_at: string;
}

/** `POST /admin/email-templates/{code}/preview` — no `success` key. */
export interface RawEmailTemplatePreviewResponse {
  template_code: string;
  subject: string;
  html: string;
  text: string;
  sample_variables: Record<string, string>;
  generated_at: string;
}

/** `PUT /admin/email-templates/{code}` */
export interface RawUpdateEmailTemplateResponse {
  success: boolean;
  template_code: string;
  version: number | null;
  revision: number | null;
  is_enabled: boolean;
  used_variables: string[];
  updated_at: string;
}

/** `POST /admin/email-templates` */
export interface RawCreateEmailTemplateResponse {
  success: boolean;
  template_code: string;
  purpose: string;
  version: number;
  revision: number;
  is_dynamic: boolean;
  is_enabled: boolean;
  used_variables: string[];
  created_at: string;
}

/** `DELETE /admin/email-templates/{code}` (disable, not delete) */
export interface RawDisableEmailTemplateResponse {
  success: boolean;
  template_code: string;
  is_enabled: boolean;
  revision: number | null;
  disabled_at: string;
}

/** `POST /admin/email-templates/{code}/rollback` */
export interface RawRollbackEmailTemplateResponse {
  success: boolean;
  template_code: string;
  version: number;
  revision: number | null;
  is_enabled: boolean;
  rolled_back_at: string;
}

/** `POST /admin/email-templates/{code}/send-test` */
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
  source: EmailTemplateSource;
  /** Active stored version; `null` while the built-in default is in use. */
  version: number | null;
  isCustomized: boolean;
  isEnabled: boolean;
  /** Created through `POST /admin/email-templates` (not a built-in code). */
  isDynamic: boolean;
  revision: number | null;
  disabledAt: string | null;
  disabledBy: string | null;
  requiredVariables: string[];
  allowedVariables: string[];
}

export interface EmailTemplateVersion {
  version: number;
  subjectTemplate: string;
  isActive: boolean;
  createdAt: string | null;
}

export interface EmailTemplateDraft {
  subjectTemplate: string;
  htmlTemplate: string;
  textTemplate: string;
}

export interface EmailTemplateDetail extends EmailTemplateSummary {
  htmlTemplate: string;
  textTemplate: string;
  /** The in-code parts of a built-in code; `null` for dynamic templates. */
  builtInDefault: EmailTemplateDraft | null;
  /** Newest first. */
  versions: EmailTemplateVersion[];
}

export interface EmailTemplatePreview {
  subject: string;
  html: string;
  text: string;
  /** Server-side sample values substituted into the placeholders. */
  sampleVariables: Record<string, string>;
}

export interface SendTestResult {
  recipientMasked: string;
  provider: string;
}

export interface EmailTemplateCreateInput extends EmailTemplateDraft {
  templateCode: string;
  purpose: EmailTemplateDynamicPurpose;
  allowedVariables: string[];
  requiredVariables: string[];
}

export interface EmailTemplateCreateResult {
  /** Normalised (lower-case) code to open in the editor. */
  templateCode: string;
  version: number;
}

// ─── Human-friendly labels ─────────────────────────────────────────────────
export const EMAIL_TEMPLATE_LABELS: Record<string, string> = {
  email_activation: 'Email activation',
  password_reset: 'Password reset',
  admin_password_reset: 'Admin password reset',
  security_notification: 'Security notification',
  delivery_operation: 'Delivery update',
  patreon_link_proof: 'Patreon link proof',
  email_credit_grant_notification: 'Credit grant notification',
};

/** Built-in codes (mirrors backend `TRANSACTIONAL_TEMPLATE_CODES`); new codes can't reuse them. */
export const BUILT_IN_EMAIL_TEMPLATE_CODES: readonly string[] = Object.keys(
  EMAIL_TEMPLATE_LABELS
);

/** "ops_incident_notice" → "Ops incident notice". */
function humanizeCode(code: string): string {
  const words = code.replace(/_+/g, ' ').trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : code;
}

/** Display name: the built-in label, otherwise the code in sentence case. */
export function emailTemplateLabel(code: string): string {
  return EMAIL_TEMPLATE_LABELS[code] ?? humanizeCode(code);
}

/** Purposes share the built-in vocabulary ("delivery_operation" → "Delivery update"). */
export function emailTemplatePurposeLabel(purpose: string): string {
  return emailTemplateLabel(purpose);
}

export type EmailTemplateBadgeVariant =
  | 'success'
  | 'warning'
  | 'destructive'
  | 'info'
  | 'secondary';

export interface EmailTemplateBadge {
  label: string;
  variant: EmailTemplateBadgeVariant;
}

/** Enabled/disabled pill. */
export function emailTemplateStatusBadge(
  template: Pick<EmailTemplateSummary, 'isEnabled'>
): EmailTemplateBadge {
  return template.isEnabled
    ? { label: 'Enabled', variant: 'success' }
    : { label: 'Disabled', variant: 'destructive' };
}

/** Where the active content comes from. */
export function emailTemplateSourceBadge(
  template: Pick<EmailTemplateSummary, 'source' | 'isDynamic'>
): EmailTemplateBadge {
  if (template.source === 'catalog')
    return { label: 'No saved version', variant: 'warning' };
  if (template.isDynamic) return { label: 'Custom', variant: 'secondary' };
  return template.source === 'db'
    ? { label: 'Customized', variant: 'info' }
    : { label: 'Built-in default', variant: 'secondary' };
}

// ─── Client-side draft validation (instant feedback; server is authoritative) ─
// Mirrors api.auth `src/Util/email/template_validation.py`.
export const EMAIL_TEMPLATE_LIMITS = {
  subject: 255,
  html: 100_000,
  text: 40_000,
  code: 100,
} as const;

export const EMAIL_TEMPLATE_CODE_PATTERN = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;
export const EMAIL_TEMPLATE_VARIABLE_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

const PLACEHOLDER_RE = /\$\{?([a-zA-Z_][a-zA-Z0-9_]*)\}?/g;
const COMMENT_RE = /<!--[\s\S]*?-->/g;
const START_TAG_RE = /<([a-zA-Z][a-zA-Z0-9]*)(?=[\s/>])/g;
const ALLOWED_HTML_TAGS = new Set([
  'html',
  'head',
  'body',
  'title',
  'meta',
  'style',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'td',
  'th',
  'div',
  'span',
  'p',
  'br',
  'hr',
  'a',
  'img',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'strong',
  'b',
  'em',
  'i',
  'u',
  'small',
  'blockquote',
  'ul',
  'ol',
  'li',
  'center',
  'font',
]);
const FORBIDDEN_HTML_TAGS = new Set([
  'script',
  'iframe',
  'object',
  'embed',
  'applet',
  'base',
  'form',
  'input',
  'button',
  'textarea',
  'select',
  'option',
  'link',
  'noscript',
  'template',
  'svg',
  'math',
  'frame',
  'frameset',
  'audio',
  'video',
  'source',
  'track',
  'canvas',
  'map',
  'area',
  'portal',
]);
const EVENT_HANDLER_RE = /<[^>]*\son[a-z]+\s*=/i;
const URL_ATTR_RE =
  /\s(?:href|src|background|action|formaction)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
const ALLOWED_URL_SCHEMES = new Set(['http', 'https', 'mailto']);

export function extractPlaceholders(text: string): string[] {
  const found = new Set<string>();
  for (const match of text.matchAll(PLACEHOLDER_RE)) {
    found.add(match[1]);
  }
  return [...found];
}

interface HtmlIssues {
  forbiddenTag: string | null;
  unknownTag: string | null;
  eventHandler: boolean;
  badScheme: string | null;
}

function scanHtml(html: string): HtmlIssues {
  const body = html.replace(COMMENT_RE, '');
  let forbiddenTag: string | null = null;
  let unknownTag: string | null = null;
  for (const match of body.matchAll(START_TAG_RE)) {
    const tag = match[1].toLowerCase();
    if (FORBIDDEN_HTML_TAGS.has(tag)) {
      forbiddenTag ??= tag;
    } else if (!ALLOWED_HTML_TAGS.has(tag)) {
      unknownTag ??= tag;
    }
  }

  let badScheme: string | null = null;
  for (const match of body.matchAll(URL_ATTR_RE)) {
    const value = (match[1] ?? match[2] ?? match[3] ?? '').trim().toLowerCase();
    if (!value || value.startsWith('$')) continue;
    const scheme = /^([^:/?#]+):/.exec(value)?.[1];
    if (scheme && !ALLOWED_URL_SCHEMES.has(scheme)) {
      badScheme = scheme;
      break;
    }
  }

  return {
    forbiddenTag,
    unknownTag,
    eventHandler: EVENT_HANDLER_RE.test(body),
    badScheme,
  };
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
  if (/[\r\n]/.test(subjectTemplate))
    errors.push('Subject must be a single line.');
  if (subjectTemplate.length > EMAIL_TEMPLATE_LIMITS.subject) {
    errors.push(
      `Subject is longer than ${EMAIL_TEMPLATE_LIMITS.subject} characters.`
    );
  }
  if (!htmlTemplate.trim()) errors.push('HTML body is required.');
  if (htmlTemplate.length > EMAIL_TEMPLATE_LIMITS.html) {
    errors.push(
      `HTML body is longer than ${EMAIL_TEMPLATE_LIMITS.html.toLocaleString('en-US')} characters.`
    );
  }
  if (!textTemplate.trim()) errors.push('Plain-text body is required.');
  if (textTemplate.length > EMAIL_TEMPLATE_LIMITS.text) {
    errors.push(
      `Plain-text body is longer than ${EMAIL_TEMPLATE_LIMITS.text.toLocaleString('en-US')} characters.`
    );
  }

  const allowed = new Set(options.allowedVariables);
  const used = new Set<string>([
    ...extractPlaceholders(subjectTemplate),
    ...extractPlaceholders(htmlTemplate),
    ...extractPlaceholders(textTemplate),
  ]);

  const unknown = [...used].filter((name) => !allowed.has(name));
  if (unknown.length) {
    errors.push(
      `Unknown variable(s): ${unknown.map((v) => '$' + v).join(', ')}.`
    );
  }

  const missing = options.requiredVariables.filter((name) => !used.has(name));
  if (missing.length) {
    errors.push(
      `Must include required variable(s): ${missing.map((v) => '$' + v).join(', ')}.`
    );
  }

  const html = scanHtml(htmlTemplate);
  if (html.forbiddenTag) {
    errors.push(`HTML contains a disallowed tag (<${html.forbiddenTag}>).`);
  }
  if (html.unknownTag) {
    errors.push(
      `HTML contains a tag that email templates don't support (<${html.unknownTag}>).`
    );
  }
  if (html.eventHandler) {
    errors.push('HTML contains an inline event handler (on… attribute).');
  }
  if (html.badScheme) {
    errors.push(
      `HTML links may only use http, https or mailto (found ${html.badScheme}:).`
    );
  }

  return { valid: errors.length === 0, errors };
}

// ─── Which editable field(s) a validation problem belongs to ───────────────
// Drives the per-body "has issues" marker so an error in the hidden body is
// not missed. `requiredVariables` (a cross-field rule) is intentionally not
// attributed to a single field — the aggregate error list still reports it.
export interface DraftFieldIssues {
  subject: boolean;
  html: boolean;
  text: boolean;
}

export function draftFieldIssues(
  draft: EmailTemplateDraft,
  options: { allowedVariables: string[] }
): DraftFieldIssues {
  const allowed = new Set(options.allowedVariables);
  const hasUnknown = (text: string): boolean =>
    extractPlaceholders(text).some((name) => !allowed.has(name));
  const { subjectTemplate, htmlTemplate, textTemplate } = draft;
  const html = scanHtml(htmlTemplate);

  return {
    subject:
      !subjectTemplate.trim() ||
      /[\r\n]/.test(subjectTemplate) ||
      subjectTemplate.length > EMAIL_TEMPLATE_LIMITS.subject ||
      hasUnknown(subjectTemplate),
    html:
      !htmlTemplate.trim() ||
      htmlTemplate.length > EMAIL_TEMPLATE_LIMITS.html ||
      hasUnknown(htmlTemplate) ||
      html.forbiddenTag !== null ||
      html.unknownTag !== null ||
      html.eventHandler ||
      html.badScheme !== null,
    text:
      !textTemplate.trim() ||
      textTemplate.length > EMAIL_TEMPLATE_LIMITS.text ||
      hasUnknown(textTemplate),
  };
}

/** Split a free-form "a, b c" list into unique variable names (order kept). */
export function parseVariableList(input: string): string[] {
  return [
    ...new Set(
      input
        .split(/[\s,]+/)
        .map((part) => part.replace(/^\$\{?|\}$/g, '').trim())
        .filter(Boolean)
    ),
  ];
}
