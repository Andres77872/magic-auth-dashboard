import type {
  EmailTemplateDetail,
  EmailTemplateSummary,
} from '@/types/email-templates.types';

export function makeSummary(
  overrides: Partial<EmailTemplateSummary> = {}
): EmailTemplateSummary {
  return {
    templateCode: 'email_activation',
    purpose: 'email_activation',
    subjectTemplate: 'Activate your $app_name email',
    source: 'code',
    version: null,
    isCustomized: false,
    isEnabled: true,
    isDynamic: false,
    revision: 1,
    disabledAt: null,
    disabledBy: null,
    requiredVariables: ['activation_link'],
    allowedVariables: ['activation_link', 'app_name', 'recipient_masked'],
    ...overrides,
  };
}

export const ACTIVATION_HTML =
  '<p>$recipient_masked</p><a href="$activation_link">Activate</a>';
export const ACTIVATION_TEXT = 'Activate: $activation_link';

export function makeDetail(
  overrides: Partial<EmailTemplateDetail> = {}
): EmailTemplateDetail {
  return {
    ...makeSummary(),
    htmlTemplate: ACTIVATION_HTML,
    textTemplate: ACTIVATION_TEXT,
    builtInDefault: {
      subjectTemplate: 'Activate your $app_name email',
      htmlTemplate: ACTIVATION_HTML,
      textTemplate: ACTIVATION_TEXT,
    },
    versions: [],
    ...overrides,
  };
}

/** A built-in template with two stored versions, v2 active. */
export function makeCustomizedDetail(
  overrides: Partial<EmailTemplateDetail> = {}
): EmailTemplateDetail {
  return makeDetail({
    source: 'db',
    version: 2,
    isCustomized: true,
    subjectTemplate: 'Please activate your $app_name email',
    versions: [
      {
        version: 2,
        subjectTemplate: 'Please activate your $app_name email',
        isActive: true,
        createdAt: '2026-09-20T10:00:00Z',
      },
      {
        version: 1,
        subjectTemplate: 'Activate your $app_name email',
        isActive: false,
        createdAt: '2026-09-01T10:00:00Z',
      },
    ],
    ...overrides,
  });
}
