/**
 * Email templates service
 *
 * ROOT-only admin API for DB-managed transactional email templates
 * (api.auth `src/routes/email_templates.py`, prefix `/admin/email-templates`).
 * Every route takes and returns flat JSON. The list, detail and preview
 * responses have no `success` key; a resolved promise means success and the
 * transport throws `ApiError` for non-2xx responses. Methods return payloads.
 */

import { deleteJson, getJson, postJson, putJson, seg } from './request';
import type {
  EmailTemplateCreateInput,
  EmailTemplateCreateResult,
  EmailTemplateDetail,
  EmailTemplateDraft,
  EmailTemplatePreview,
  EmailTemplateSummary,
  EmailTemplateVersion,
  RawCreateEmailTemplateResponse,
  RawDisableEmailTemplateResponse,
  RawEmailTemplateDetail,
  RawEmailTemplateParts,
  RawEmailTemplatePreviewResponse,
  RawEmailTemplateSummary,
  RawEmailTemplateVersion,
  RawEmailTemplatesListResponse,
  RawRollbackEmailTemplateResponse,
  RawSendTestResponse,
  RawUpdateEmailTemplateResponse,
  SendTestResult,
} from '@/types/email-templates.types';

const BASE = '/admin/email-templates';

function templatePath(templateCode: string, suffix = ''): string {
  return `${BASE}/${seg(templateCode)}${suffix}`;
}

function mapSummary(raw: RawEmailTemplateSummary): EmailTemplateSummary {
  return {
    templateCode: raw.template_code,
    purpose: raw.purpose,
    subjectTemplate: raw.subject_template,
    source: raw.source,
    version: raw.version,
    isCustomized: raw.is_customized,
    isEnabled: raw.is_enabled,
    isDynamic: raw.is_dynamic,
    revision: raw.revision,
    disabledAt: raw.disabled_at,
    disabledBy: raw.disabled_by,
    requiredVariables: raw.required_variables,
    allowedVariables: raw.allowed_variables,
  };
}

function mapVersion(raw: RawEmailTemplateVersion): EmailTemplateVersion {
  return {
    version: raw.version,
    subjectTemplate: raw.subject_template,
    isActive: raw.is_active,
    createdAt: raw.created_at,
  };
}

function mapParts(raw: RawEmailTemplateParts): EmailTemplateDraft {
  return {
    subjectTemplate: raw.subject_template,
    htmlTemplate: raw.html_template,
    textTemplate: raw.text_template,
  };
}

function mapDetail(raw: RawEmailTemplateDetail): EmailTemplateDetail {
  return {
    ...mapSummary(raw),
    htmlTemplate: raw.html_template,
    textTemplate: raw.text_template,
    builtInDefault: raw.default ? mapParts(raw.default) : null,
    versions: raw.versions.map(mapVersion),
  };
}

function draftToBody(draft: EmailTemplateDraft): RawEmailTemplateParts {
  return {
    subject_template: draft.subjectTemplate,
    html_template: draft.htmlTemplate,
    text_template: draft.textTemplate,
  };
}

class EmailTemplatesService {
  /** GET /admin/email-templates — every built-in and dynamic code, sorted by code. */
  async list(): Promise<EmailTemplateSummary[]> {
    const data = await getJson<RawEmailTemplatesListResponse>(BASE);
    if (!Array.isArray(data?.templates)) {
      throw new Error(
        'The email templates response was not in the expected format.'
      );
    }
    return data.templates.map(mapSummary);
  }

  /** GET /admin/email-templates/{code} — active parts, default, variables and version history. */
  async get(templateCode: string): Promise<EmailTemplateDetail> {
    const data = await getJson<RawEmailTemplateDetail>(
      templatePath(templateCode)
    );
    if (
      typeof data?.template_code !== 'string' ||
      !Array.isArray(data.versions)
    ) {
      throw new Error(
        'The email template response was not in the expected format.'
      );
    }
    return mapDetail(data);
  }

  /** POST /admin/email-templates — create a dynamic template and activate its version 1. */
  async create(
    input: EmailTemplateCreateInput
  ): Promise<EmailTemplateCreateResult> {
    const data = await postJson<RawCreateEmailTemplateResponse>(BASE, {
      template_code: input.templateCode,
      purpose: input.purpose,
      allowed_variables: input.allowedVariables,
      required_variables: input.requiredVariables,
      ...draftToBody(input),
    });
    return { templateCode: data.template_code, version: data.version };
  }

  /** PUT /admin/email-templates/{code} — save and activate a new version (re-enables). Returns it. */
  async update(
    templateCode: string,
    draft: EmailTemplateDraft
  ): Promise<number | null> {
    const data = await putJson<RawUpdateEmailTemplateResponse>(
      templatePath(templateCode),
      draftToBody(draft)
    );
    return data.version;
  }

  /** DELETE /admin/email-templates/{code} — disable; the catalog entry and history are kept. */
  async disable(templateCode: string): Promise<void> {
    await deleteJson<RawDisableEmailTemplateResponse>(
      templatePath(templateCode)
    );
  }

  /**
   * POST /admin/email-templates/{code}/preview — render a complete draft (or,
   * without one, the active version) with server-side sample data. The HTML is
   * exactly what the worker would send.
   */
  async preview(
    templateCode: string,
    draft?: EmailTemplateDraft
  ): Promise<EmailTemplatePreview> {
    const data = await postJson<RawEmailTemplatePreviewResponse>(
      templatePath(templateCode, '/preview'),
      draft ? draftToBody(draft) : {}
    );
    return {
      subject: data.subject,
      html: data.html,
      text: data.text,
      sampleVariables: data.sample_variables,
    };
  }

  /** POST /admin/email-templates/{code}/send-test — to the caller's own verified address only. */
  async sendTest(
    templateCode: string,
    draft?: EmailTemplateDraft
  ): Promise<SendTestResult> {
    const data = await postJson<RawSendTestResponse>(
      templatePath(templateCode, '/send-test'),
      draft ? draftToBody(draft) : {}
    );
    return { recipientMasked: data.recipient_masked, provider: data.provider };
  }

  /** POST /admin/email-templates/{code}/rollback — re-activate a stored version (re-enables). */
  async rollback(templateCode: string, version: number): Promise<void> {
    await postJson<RawRollbackEmailTemplateResponse>(
      templatePath(templateCode, '/rollback'),
      { version }
    );
  }
}

export const emailTemplatesService = new EmailTemplatesService();
export default EmailTemplatesService;
