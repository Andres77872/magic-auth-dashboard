import { describe, it, expect } from 'vitest';
import {
  draftFieldIssues,
  emailTemplateLabel,
  emailTemplatePurposeLabel,
  emailTemplateSourceBadge,
  emailTemplateStatusBadge,
  extractPlaceholders,
  parseVariableList,
  validateTemplateDraft,
  type EmailTemplateDraft,
} from '../email-templates.types';

const OPTS = {
  allowedVariables: [
    'app_name',
    'recipient_masked',
    'expires_in',
    'support_email',
    'activation_link',
  ],
  requiredVariables: ['activation_link'],
};

function draft(
  overrides: Partial<EmailTemplateDraft> = {}
): EmailTemplateDraft {
  return {
    subjectTemplate: 'Activate your $app_name email',
    htmlTemplate:
      '<p>Hi, activate <a href="$activation_link">here</a> ($expires_in).</p>',
    textTemplate: 'Activate: $activation_link',
    ...overrides,
  };
}

describe('extractPlaceholders', () => {
  it('extracts $name and ${name} forms uniquely', () => {
    expect(
      extractPlaceholders('a $app_name b ${activation_link} c $app_name').sort()
    ).toEqual(['activation_link', 'app_name']);
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
    const result = validateTemplateDraft(
      draft({ subjectTemplate: '$evil $app_name' }),
      OPTS
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('$evil'))).toBe(true);
  });

  it('rejects a missing required variable', () => {
    const result = validateTemplateDraft(
      draft({
        htmlTemplate: '<p>no link $app_name</p>',
        textTemplate: 'no link',
      }),
      OPTS
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('$activation_link'))).toBe(
      true
    );
  });

  it('rejects a multi-line or over-long subject (backend max 255)', () => {
    expect(
      validateTemplateDraft(
        draft({ subjectTemplate: 'line1\nline2 $app_name' }),
        OPTS
      ).valid
    ).toBe(false);
    expect(
      validateTemplateDraft(draft({ subjectTemplate: 'x'.repeat(256) }), OPTS)
        .valid
    ).toBe(false);
    expect(
      validateTemplateDraft(draft({ subjectTemplate: 'x'.repeat(255) }), OPTS)
        .valid
    ).toBe(true);
  });

  it('rejects bodies over the backend limits', () => {
    const longHtml = `<p>$activation_link</p>${'x'.repeat(100_000)}`;
    expect(
      validateTemplateDraft(draft({ htmlTemplate: longHtml }), OPTS).valid
    ).toBe(false);
    const longText = `$activation_link ${'x'.repeat(40_000)}`;
    expect(
      validateTemplateDraft(draft({ textTemplate: longText }), OPTS).valid
    ).toBe(false);
  });

  it.each([
    ['<script>', '<p>$activation_link</p><script>alert(1)</script>'],
    ['<iframe>', '<iframe src="https://x"></iframe>$activation_link'],
    ['<map>', '<map name="m"></map>$activation_link'],
    ['<area>', '<area href="https://x">$activation_link'],
    ['event handler', '<p onclick="x()">$activation_link</p>'],
    ['javascript: url', '<a href="javascript:alert(1)">$activation_link</a>'],
    ['data: url', '<img src="data:text/html,x">$activation_link'],
    [
      'ftp: url (only http, https, mailto)',
      '<a href="ftp://x">$activation_link</a>',
    ],
    ['unsupported tag', '<section>$activation_link</section>'],
  ])('rejects unsafe or unsupported HTML: %s', (_label, html) => {
    const result = validateTemplateDraft(draft({ htmlTemplate: html }), OPTS);
    expect(result.valid).toBe(false);
  });

  it('names the offending tag in the message', () => {
    const result = validateTemplateDraft(
      draft({ htmlTemplate: '<p>$activation_link</p><script>x</script>' }),
      OPTS
    );
    expect(result.errors).toContain(
      'HTML contains a disallowed tag (<script>).'
    );
  });

  it('allows the structural tags used by the best-practice document (style/meta/table)', () => {
    const html =
      '<!DOCTYPE html><html><head><meta name="color-scheme" content="light dark"><style>body{margin:0}</style></head>' +
      '<body><table role="presentation"><tr><td><a href="$activation_link">Go</a></td></tr></table>' +
      '<a href="mailto:help@example.com">Help</a> <a href="https://example.com/a?b=1">Site</a></body></html>';
    const result = validateTemplateDraft(draft({ htmlTemplate: html }), OPTS);
    expect(result.errors).toEqual([]);
  });

  it('ignores tags inside HTML comments (Outlook conditional blocks)', () => {
    const html =
      '<!--[if mso]><o:OfficeDocumentSettings><section></section><![endif]--><p>$activation_link</p>';
    expect(
      validateTemplateDraft(draft({ htmlTemplate: html }), OPTS).valid
    ).toBe(true);
  });

  it('allows relative and placeholder URLs', () => {
    const html =
      '<a href="/help">Help</a><a href="$activation_link">Go</a><img src="logo.png">';
    expect(
      validateTemplateDraft(draft({ htmlTemplate: html }), OPTS).valid
    ).toBe(true);
  });
});

describe('labels', () => {
  it('maps built-in codes to friendly labels and humanises other codes', () => {
    expect(emailTemplateLabel('email_activation')).toBe('Email activation');
    expect(emailTemplateLabel('patreon_link_proof')).toBe('Patreon link proof');
    expect(emailTemplateLabel('email_credit_grant_notification')).toBe(
      'Credit grant notification'
    );
    expect(emailTemplateLabel('ops_incident_notice')).toBe(
      'Ops incident notice'
    );
  });

  it('labels dynamic purposes', () => {
    expect(emailTemplatePurposeLabel('delivery_operation')).toBe(
      'Delivery update'
    );
    expect(emailTemplatePurposeLabel('security_notification')).toBe(
      'Security notification'
    );
  });
});

describe('badges', () => {
  it('reports enabled / disabled with text, not only colour', () => {
    expect(emailTemplateStatusBadge({ isEnabled: true })).toEqual({
      label: 'Enabled',
      variant: 'success',
    });
    expect(emailTemplateStatusBadge({ isEnabled: false })).toEqual({
      label: 'Disabled',
      variant: 'destructive',
    });
  });

  it('describes where the active content comes from', () => {
    expect(
      emailTemplateSourceBadge({ source: 'code', isDynamic: false }).label
    ).toBe('Built-in default');
    expect(
      emailTemplateSourceBadge({ source: 'db', isDynamic: false }).label
    ).toBe('Customized');
    expect(
      emailTemplateSourceBadge({ source: 'db', isDynamic: true }).label
    ).toBe('Custom');
    expect(
      emailTemplateSourceBadge({ source: 'catalog', isDynamic: true }).label
    ).toBe('No saved version');
  });
});

describe('parseVariableList', () => {
  it('splits on commas and whitespace, strips $ / ${} and de-duplicates in order', () => {
    expect(parseVariableList(' notice, $ticket_id  ${notice}\nextra ')).toEqual(
      ['notice', 'ticket_id', 'extra']
    );
    expect(parseVariableList('')).toEqual([]);
  });
});

describe('draftFieldIssues', () => {
  const OPTS_FIELDS = { allowedVariables: OPTS.allowedVariables };

  it('reports no issues for a clean draft', () => {
    expect(draftFieldIssues(draft(), OPTS_FIELDS)).toEqual({
      subject: false,
      html: false,
      text: false,
    });
  });

  it('attributes a forbidden tag / unknown var to the HTML field', () => {
    expect(
      draftFieldIssues(
        draft({ htmlTemplate: '<script>x</script>' }),
        OPTS_FIELDS
      ).html
    ).toBe(true);
    expect(
      draftFieldIssues(draft({ htmlTemplate: '<p>$nope</p>' }), OPTS_FIELDS)
        .html
    ).toBe(true);
  });

  it('flags an empty or unknown-var plain-text body', () => {
    expect(
      draftFieldIssues(draft({ textTemplate: '   ' }), OPTS_FIELDS).text
    ).toBe(true);
    expect(
      draftFieldIssues(draft({ textTemplate: '$nope' }), OPTS_FIELDS).text
    ).toBe(true);
  });

  it('flags a multi-line subject', () => {
    expect(
      draftFieldIssues(draft({ subjectTemplate: 'a\nb' }), OPTS_FIELDS).subject
    ).toBe(true);
  });
});
