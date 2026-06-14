/**
 * Email Templates service
 *
 * ROOT-only admin API for DB-managed transactional email templates. Endpoint
 * paths/verbs are centralized here so a backend contract change is a one-file
 * fix. Admin endpoints return plain objects (cast directly), matching the rest
 * of the admin surface.
 */

import { apiClient } from './api.client';
import type {
  EmailTemplateDetail,
  EmailTemplateDraft,
  EmailTemplatePreview,
  EmailTemplateSummary,
  EmailTemplateVersion,
  RawEmailTemplateDetail,
  RawEmailTemplatePreviewResponse,
  RawEmailTemplateSummary,
  RawEmailTemplateVersion,
  RawEmailTemplatesListResponse,
  RawSendTestResponse,
  RawUpdateEmailTemplateResponse,
  SendTestResult,
} from '@/types/email-templates.types';

const BASE = '/admin/email-templates';

function mapSummary(raw: RawEmailTemplateSummary): EmailTemplateSummary {
  return {
    templateCode: raw.template_code,
    purpose: raw.purpose,
    subjectTemplate: raw.subject_template,
    source: raw.source,
    version: raw.version,
    isCustomized: raw.is_customized,
    requiredVariables: raw.required_variables ?? [],
    allowedVariables: raw.allowed_variables ?? [],
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

function mapDetail(raw: RawEmailTemplateDetail): EmailTemplateDetail {
  return {
    ...mapSummary(raw),
    htmlTemplate: raw.html_template,
    textTemplate: raw.text_template,
    default: {
      subjectTemplate: raw.default?.subject_template ?? '',
      htmlTemplate: raw.default?.html_template ?? '',
      textTemplate: raw.default?.text_template ?? '',
    },
    versions: (raw.versions ?? []).map(mapVersion),
  };
}

function draftToBody(draft: EmailTemplateDraft): {
  subject_template: string;
  html_template: string;
  text_template: string;
} {
  return {
    subject_template: draft.subjectTemplate,
    html_template: draft.htmlTemplate,
    text_template: draft.textTemplate,
  };
}

class EmailTemplatesService {
  async list(): Promise<EmailTemplateSummary[]> {
    const res = await apiClient.get<RawEmailTemplatesListResponse>(BASE);
    const data = res as unknown as RawEmailTemplatesListResponse;
    return (data.templates ?? []).map(mapSummary);
  }

  async get(templateCode: string): Promise<EmailTemplateDetail> {
    const res = await apiClient.get<RawEmailTemplateDetail>(`${BASE}/${templateCode}`);
    return mapDetail(res as unknown as RawEmailTemplateDetail);
  }

  /** Save a new active version. Returns the new version number. */
  async update(templateCode: string, draft: EmailTemplateDraft): Promise<number | null> {
    const res = await apiClient.put<RawUpdateEmailTemplateResponse>(
      `${BASE}/${templateCode}`,
      draftToBody(draft)
    );
    return (res as unknown as RawUpdateEmailTemplateResponse).version ?? null;
  }

  /**
   * Render a draft (or, when `draft` is omitted, the active version) with sample
   * data. The returned HTML is what the worker would actually send.
   */
  async preview(templateCode: string, draft?: EmailTemplateDraft): Promise<EmailTemplatePreview> {
    const res = await apiClient.post<RawEmailTemplatePreviewResponse>(
      `${BASE}/${templateCode}/preview`,
      draft ? draftToBody(draft) : {}
    );
    const data = res as unknown as RawEmailTemplatePreviewResponse;
    return { subject: data.subject, html: data.html, text: data.text };
  }

  /** Send a rendered test to the ROOT user's own verified address. */
  async sendTest(templateCode: string, draft?: EmailTemplateDraft): Promise<SendTestResult> {
    const res = await apiClient.post<RawSendTestResponse>(
      `${BASE}/${templateCode}/send-test`,
      draft ? draftToBody(draft) : {}
    );
    const data = res as unknown as RawSendTestResponse;
    return { recipientMasked: data.recipient_masked, provider: data.provider };
  }

  /** Re-activate a prior version. */
  async rollback(templateCode: string, version: number): Promise<void> {
    await apiClient.post(`${BASE}/${templateCode}/rollback`, { version });
  }
}

export const emailTemplatesService = new EmailTemplatesService();
export default EmailTemplatesService;
