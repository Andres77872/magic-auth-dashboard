/* eslint-disable @typescript-eslint/unbound-method -- mock method refs in expect() assertions are not invoked, so `this` binding is irrelevant. */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { emailTemplatesService } from '../email-templates.service';
import { apiClient } from '../api.client';
import { ApiError } from '@/utils/error-handler';
import type {
  RawEmailTemplateDetail,
  RawEmailTemplateSummary,
} from '@/types/email-templates.types';

vi.mock('../api.client', () => ({
  apiClient: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockApi = vi.mocked(apiClient);

/** The transport is typed as ApiResponse<T>; the email-template routes return bare objects. */
function resolveWith(
  method: 'get' | 'put' | 'post' | 'delete',
  payload: object
): void {
  mockApi[method].mockResolvedValue(payload as never);
}

const RAW_SUMMARY: RawEmailTemplateSummary = {
  template_code: 'email_activation',
  purpose: 'email_activation',
  subject_template: 'Activate your $app_name email',
  source: 'db',
  version: 3,
  is_customized: true,
  is_enabled: true,
  is_dynamic: false,
  revision: 5,
  disabled_at: null,
  disabled_by: null,
  required_variables: ['activation_link'],
  allowed_variables: ['activation_link', 'app_name'],
};

const RAW_DETAIL: RawEmailTemplateDetail = {
  ...RAW_SUMMARY,
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
  default: {
    subject_template: 'd-sub',
    html_template: 'd-html',
    text_template: 'd-text',
  },
  versions: [
    {
      version: 1,
      subject_template: 's',
      is_active: true,
      created_at: '2026-09-01T10:00:00Z',
    },
  ],
  generated_at: '2026-09-24T00:00:00Z',
};

const DRAFT = { subjectTemplate: 'S', htmlTemplate: 'H', textTemplate: 'T' };
const DRAFT_BODY = {
  subject_template: 'S',
  html_template: 'H',
  text_template: 'T',
};

describe('emailTemplatesService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('list() reads `templates` (no success envelope) and maps every field', async () => {
    resolveWith('get', {
      templates: [RAW_SUMMARY],
      generated_at: '2026-09-24T00:00:00Z',
    });

    const result = await emailTemplatesService.list();

    expect(mockApi.get).toHaveBeenCalledWith(
      '/admin/email-templates',
      undefined
    );
    expect(result).toEqual([
      {
        templateCode: 'email_activation',
        purpose: 'email_activation',
        subjectTemplate: 'Activate your $app_name email',
        source: 'db',
        version: 3,
        isCustomized: true,
        isEnabled: true,
        isDynamic: false,
        revision: 5,
        disabledAt: null,
        disabledBy: null,
        requiredVariables: ['activation_link'],
        allowedVariables: ['activation_link', 'app_name'],
      },
    ]);
  });

  it('list() rejects a response without a templates array instead of showing an empty list', async () => {
    resolveWith('get', { generated_at: 'now' });
    await expect(emailTemplatesService.list()).rejects.toThrow(
      /expected format/
    );
  });

  it('get() maps the detail, built-in default and version history', async () => {
    resolveWith('get', RAW_DETAIL);

    const detail = await emailTemplatesService.get('password_reset');

    expect(mockApi.get).toHaveBeenCalledWith(
      '/admin/email-templates/password_reset',
      undefined
    );
    expect(detail.htmlTemplate).toBe('<p>$reset_link</p>');
    expect(detail.textTemplate).toBe('$reset_link');
    expect(detail.builtInDefault).toEqual({
      subjectTemplate: 'd-sub',
      htmlTemplate: 'd-html',
      textTemplate: 'd-text',
    });
    expect(detail.versions).toEqual([
      {
        version: 1,
        subjectTemplate: 's',
        isActive: true,
        createdAt: '2026-09-01T10:00:00Z',
      },
    ]);
  });

  it('get() keeps a null default (dynamic templates) instead of inventing empty parts', async () => {
    resolveWith('get', {
      ...RAW_DETAIL,
      template_code: 'ops_notice',
      is_dynamic: true,
      default: null,
    });
    const detail = await emailTemplatesService.get('ops_notice');
    expect(detail.builtInDefault).toBeNull();
    expect(detail.isDynamic).toBe(true);
  });

  it('encodes the template code as a single path segment', async () => {
    resolveWith('get', RAW_DETAIL);
    await emailTemplatesService.get('a b/c');
    expect(mockApi.get).toHaveBeenCalledWith(
      '/admin/email-templates/a%20b%2Fc',
      undefined
    );
  });

  it('create() posts a flat JSON body and returns the normalised code', async () => {
    resolveWith('post', {
      success: true,
      template_code: 'ops_notice',
      purpose: 'delivery_operation',
      version: 1,
      revision: 1,
      is_dynamic: true,
      is_enabled: true,
      used_variables: ['notice'],
      created_at: 'now',
    });

    const result = await emailTemplatesService.create({
      templateCode: 'ops_notice',
      purpose: 'delivery_operation',
      allowedVariables: ['notice', 'ticket_id'],
      requiredVariables: ['notice'],
      ...DRAFT,
    });

    expect(mockApi.post).toHaveBeenCalledWith('/admin/email-templates', {
      template_code: 'ops_notice',
      purpose: 'delivery_operation',
      allowed_variables: ['notice', 'ticket_id'],
      required_variables: ['notice'],
      ...DRAFT_BODY,
    });
    expect(result).toEqual({ templateCode: 'ops_notice', version: 1 });
  });

  it('update() PUTs the flat draft and returns the new version', async () => {
    resolveWith('put', {
      success: true,
      template_code: 'email_activation',
      version: 7,
      revision: 9,
      is_enabled: true,
      used_variables: [],
      updated_at: 'now',
    });

    await expect(
      emailTemplatesService.update('email_activation', DRAFT)
    ).resolves.toBe(7);
    expect(mockApi.put).toHaveBeenCalledWith(
      '/admin/email-templates/email_activation',
      DRAFT_BODY
    );
  });

  it('disable() sends DELETE to the template path', async () => {
    resolveWith('delete', {
      success: true,
      template_code: 'ops_notice',
      is_enabled: false,
      revision: 2,
      disabled_at: 'now',
    });
    await emailTemplatesService.disable('ops_notice');
    expect(mockApi.delete).toHaveBeenCalledWith(
      '/admin/email-templates/ops_notice'
    );
  });

  it('preview() posts the draft and returns the render with its sample data', async () => {
    resolveWith('post', {
      template_code: 'email_activation',
      subject: 'sub',
      html: '<b>x</b>',
      text: 'x',
      sample_variables: { app_name: 'Magic Auth' },
      generated_at: 'now',
    });

    const preview = await emailTemplatesService.preview(
      'email_activation',
      DRAFT
    );

    expect(mockApi.post).toHaveBeenCalledWith(
      '/admin/email-templates/email_activation/preview',
      DRAFT_BODY
    );
    expect(preview).toEqual({
      subject: 'sub',
      html: '<b>x</b>',
      text: 'x',
      sampleVariables: { app_name: 'Magic Auth' },
    });
  });

  it('preview() and sendTest() send an empty body to use the active version', async () => {
    resolveWith('post', {
      subject: '',
      html: '',
      text: '',
      sample_variables: {},
      recipient_masked: 'j***@x.com',
      provider: 'fake',
    });
    await emailTemplatesService.preview('email_activation');
    await emailTemplatesService.sendTest('email_activation');
    expect(mockApi.post).toHaveBeenNthCalledWith(
      1,
      '/admin/email-templates/email_activation/preview',
      {}
    );
    expect(mockApi.post).toHaveBeenNthCalledWith(
      2,
      '/admin/email-templates/email_activation/send-test',
      {}
    );
  });

  it('sendTest() posts the draft and maps the masked recipient', async () => {
    resolveWith('post', {
      success: true,
      recipient_masked: 'j***@x.com',
      provider: 'mailpit',
    });
    const result = await emailTemplatesService.sendTest(
      'email_activation',
      DRAFT
    );
    expect(mockApi.post).toHaveBeenCalledWith(
      '/admin/email-templates/email_activation/send-test',
      DRAFT_BODY
    );
    expect(result).toEqual({
      recipientMasked: 'j***@x.com',
      provider: 'mailpit',
    });
  });

  it('rollback() posts the target version as JSON', async () => {
    resolveWith('post', { success: true, version: 2 });
    await emailTemplatesService.rollback('email_activation', 2);
    expect(mockApi.post).toHaveBeenCalledWith(
      '/admin/email-templates/email_activation/rollback',
      { version: 2 }
    );
  });

  it('propagates backend errors (message and status) to callers', async () => {
    mockApi.put.mockRejectedValue(
      new ApiError(
        'template must reference the required variable(s): $activation_link',
        400,
        'INVALID_INPUT'
      )
    );
    await expect(
      emailTemplatesService.update('email_activation', DRAFT)
    ).rejects.toMatchObject({
      status: 400,
      message:
        'template must reference the required variable(s): $activation_link',
    });
  });
});
