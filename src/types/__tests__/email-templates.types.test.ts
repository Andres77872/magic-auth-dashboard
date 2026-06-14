import { describe, it, expect } from 'vitest';
import {
  extractPlaceholders,
  validateTemplateDraft,
  emailTemplateLabel,
  type EmailTemplateDraft,
} from '../email-templates.types';

const OPTS = {
  allowedVariables: ['app_name', 'recipient_masked', 'expires_in', 'support_email', 'activation_link'],
  requiredVariables: ['activation_link'],
};

function draft(overrides: Partial<EmailTemplateDraft> = {}): EmailTemplateDraft {
  return {
    subjectTemplate: 'Activate your $app_name email',
    htmlTemplate: '<p>Hi, activate <a href="$activation_link">here</a> ($expires_in).</p>',
    textTemplate: 'Activate: $activation_link',
    ...overrides,
  };
}

describe('extractPlaceholders', () => {
  it('extracts $name and ${name} forms uniquely', () => {
    expect(extractPlaceholders('a $app_name b ${activation_link} c $app_name').sort()).toEqual(
      ['activation_link', 'app_name']
    );
  });

  it('ignores bare $ and non-identifier sequences', () => {
    expect(extractPlaceholders('cost is $ and $$ and $1nvalid')).toEqual([]);
  });
});

describe('validateTemplateDraft', () => {
  it('accepts a valid draft', () => {
    const result = validateTemplateDraft(draft(), OPTS);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects unknown variables', () => {
    const result = validateTemplateDraft(draft({ subjectTemplate: '$evil $app_name' }), OPTS);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('$evil'))).toBe(true);
  });

  it('rejects a missing required variable', () => {
    const result = validateTemplateDraft(
      draft({ htmlTemplate: '<p>no link $app_name</p>', textTemplate: 'no link' }),
      OPTS
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('$activation_link'))).toBe(true);
  });

  it('rejects a multi-line subject', () => {
    const result = validateTemplateDraft(draft({ subjectTemplate: 'line1\nline2 $app_name' }), OPTS);
    expect(result.valid).toBe(false);
  });

  it.each([
    ['<script>', '<p>$activation_link</p><script>alert(1)</script>'],
    ['<iframe>', '<iframe src="https://x"></iframe>$activation_link'],
    ['event handler', '<p onclick="x()">$activation_link</p>'],
    ['javascript: url', '<a href="javascript:alert(1)">$activation_link</a>'],
    ['data: url', '<img src="data:text/html,x">$activation_link'],
  ])('rejects dangerous HTML: %s', (_label, html) => {
    const result = validateTemplateDraft(draft({ htmlTemplate: html }), OPTS);
    expect(result.valid).toBe(false);
  });

  it('allows the structural tags used by the best-practice document (style/meta/table)', () => {
    const html =
      '<style>body{margin:0}</style><meta name="color-scheme" content="light dark">' +
      '<table role="presentation"><tr><td><a href="$activation_link">Go</a></td></tr></table>';
    const result = validateTemplateDraft(draft({ htmlTemplate: html }), OPTS);
    expect(result.valid).toBe(true);
  });
});

describe('emailTemplateLabel', () => {
  it('maps known codes to friendly labels and falls back to the code', () => {
    expect(emailTemplateLabel('email_activation')).toBe('Email activation');
    expect(emailTemplateLabel('unknown_code')).toBe('unknown_code');
  });
});
