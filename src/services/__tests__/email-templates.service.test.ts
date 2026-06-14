/* eslint-disable @typescript-eslint/unbound-method -- mock method refs in expect() assertions are not invoked, so `this` binding is irrelevant. */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { emailTemplatesService } from '../email-templates.service';
import { apiClient } from '../api.client';

vi.mock('../api.client', () => ({
  apiClient: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
  },
}));

const mockApi = vi.mocked(apiClient);

describe('emailTemplatesService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('list() maps snake_case rows to domain summaries', async () => {
    mockApi.get.mockResolvedValue({
      templates: [
        {
          template_code: 'email_activation',
          purpose: 'email_activation',
          subject_template: 'Activate your $app_name email',
          source: 'db',
          version: 3,
          is_customized: true,
          required_variables: ['activation_link'],
          allowed_variables: ['app_name', 'activation_link'],
        },
      ],
      generated_at: 'now',
    } as never);

    const result = await emailTemplatesService.list();
    expect(mockApi.get).toHaveBeenCalledWith('/admin/email-templates');
    expect(result).toEqual([
      {
        templateCode: 'email_activation',
        purpose: 'email_activation',
        subjectTemplate: 'Activate your $app_name email',
        source: 'db',
        version: 3,
        isCustomized: true,
        requiredVariables: ['activation_link'],
        allowedVariables: ['app_name', 'activation_link'],
      },
    ]);
  });

  it('get() maps detail including versions and default', async () => {
    mockApi.get.mockResolvedValue({
      template_code: 'password_reset',
      purpose: 'password_reset',
      source: 'code',
      version: null,
      is_customized: false,
      subject_template: 'Reset your $app_name password',
      html_template: '<p>$reset_link</p>',
      text_template: '$reset_link',
      required_variables: ['reset_link'],
      allowed_variables: ['app_name', 'reset_link'],
      default: { subject_template: 'd-sub', html_template: 'd-html', text_template: 'd-text' },
      versions: [{ version: 1, subject_template: 's', is_active: true, created_at: 'then' }],
    } as never);

    const detail = await emailTemplatesService.get('password_reset');
    expect(mockApi.get).toHaveBeenCalledWith('/admin/email-templates/password_reset');
    expect(detail.htmlTemplate).toBe('<p>$reset_link</p>');
    expect(detail.default.htmlTemplate).toBe('d-html');
    expect(detail.versions).toEqual([
      { version: 1, subjectTemplate: 's', isActive: true, createdAt: 'then' },
    ]);
  });

  it('update() PUTs a snake_case body and returns the new version', async () => {
    mockApi.put.mockResolvedValue({ success: true, version: 7 } as never);
    const version = await emailTemplatesService.update('email_activation', {
      subjectTemplate: 'S',
      htmlTemplate: 'H',
      textTemplate: 'T',
    });
    expect(version).toBe(7);
    expect(mockApi.put).toHaveBeenCalledWith('/admin/email-templates/email_activation', {
      subject_template: 'S',
      html_template: 'H',
      text_template: 'T',
    });
  });

  it('preview() returns subject/html/text', async () => {
    mockApi.post.mockResolvedValue({ subject: 'sub', html: '<b>x</b>', text: 'x' } as never);
    const preview = await emailTemplatesService.preview('email_activation');
    expect(mockApi.post).toHaveBeenCalledWith('/admin/email-templates/email_activation/preview', {});
    expect(preview).toEqual({ subject: 'sub', html: '<b>x</b>', text: 'x' });
  });

  it('sendTest() maps the masked recipient', async () => {
    mockApi.post.mockResolvedValue({ recipient_masked: 'j***@x.com', provider: 'mailpit' } as never);
    const result = await emailTemplatesService.sendTest('email_activation');
    expect(result).toEqual({ recipientMasked: 'j***@x.com', provider: 'mailpit' });
  });

  it('rollback() posts the target version', async () => {
    mockApi.post.mockResolvedValue({ success: true } as never);
    await emailTemplatesService.rollback('email_activation', 2);
    expect(mockApi.post).toHaveBeenCalledWith('/admin/email-templates/email_activation/rollback', {
      version: 2,
    });
  });
});
