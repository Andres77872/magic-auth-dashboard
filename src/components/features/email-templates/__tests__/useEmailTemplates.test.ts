/* eslint-disable @typescript-eslint/unbound-method -- mock method refs in expect() assertions are not invoked, so `this` binding is irrelevant. */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import {
  useEmailTemplate,
  useEmailTemplatePreview,
  useEmailTemplates,
} from '@/hooks/useEmailTemplates';
import { emailTemplatesService } from '@/services/email-templates.service';
import type {
  EmailTemplateDetail,
  EmailTemplateDraft,
} from '@/types/email-templates.types';
import { makeCustomizedDetail, makeDetail, makeSummary } from './fixtures';

vi.mock('@/services/email-templates.service', () => ({
  emailTemplatesService: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    disable: vi.fn(),
    preview: vi.fn(),
    sendTest: vi.fn(),
    rollback: vi.fn(),
  },
}));

const service = vi.mocked(emailTemplatesService);

const DRAFT: EmailTemplateDraft = {
  subjectTemplate: 'S $x',
  htmlTemplate: '<p>$x</p>',
  textTemplate: '$x',
};

describe('useEmailTemplates', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loads the catalogue and refreshes it after creating a template', async () => {
    service.list.mockResolvedValue([makeSummary()]);
    service.create.mockResolvedValue({
      templateCode: 'ops_notice',
      version: 1,
    });

    const { result } = renderHook(() => useEmailTemplates());
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.templates).toHaveLength(1));

    let created:
      | Awaited<ReturnType<typeof result.current.createTemplate>>
      | undefined;
    await act(async () => {
      created = await result.current.createTemplate({
        templateCode: 'ops_notice',
        purpose: 'delivery_operation',
        allowedVariables: ['x'],
        requiredVariables: [],
        ...DRAFT,
      });
    });
    expect(created).toEqual({ templateCode: 'ops_notice', version: 1 });
    expect(service.list).toHaveBeenCalledTimes(2);
  });

  it('exposes the backend message when the list fails', async () => {
    service.list.mockRejectedValue(
      new Error('ROOT access required to manage email templates')
    );
    const { result } = renderHook(() => useEmailTemplates());
    await waitFor(() =>
      expect(result.current.error).toBe(
        'ROOT access required to manage email templates'
      )
    );
    expect(result.current.templates).toEqual([]);
  });
});

describe('useEmailTemplate', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loads one template and refreshes it after each mutation', async () => {
    service.get.mockResolvedValue(makeCustomizedDetail());
    service.update.mockResolvedValue(3);
    service.rollback.mockResolvedValue(undefined);
    service.disable.mockResolvedValue(undefined);
    service.sendTest.mockResolvedValue({
      recipientMasked: 'r***',
      provider: 'fake',
    });

    const { result } = renderHook(() => useEmailTemplate('email_activation'));
    await waitFor(() => expect(result.current.template?.version).toBe(2));
    expect(service.get).toHaveBeenCalledWith('email_activation');

    await act(async () => {
      await expect(result.current.save(DRAFT)).resolves.toBe(3);
    });
    expect(service.update).toHaveBeenCalledWith('email_activation', DRAFT);

    await act(async () => {
      await result.current.rollback(1);
      await result.current.disable();
      await result.current.sendTest(DRAFT);
    });
    expect(service.rollback).toHaveBeenCalledWith('email_activation', 1);
    expect(service.disable).toHaveBeenCalledWith('email_activation');
    expect(service.sendTest).toHaveBeenCalledWith('email_activation', DRAFT);
    // Initial load + one refresh per save / rollback / disable (send-test changes nothing).
    expect(service.get).toHaveBeenCalledTimes(4);
  });

  it('never shows the previous template under a new code while it loads', async () => {
    service.get.mockResolvedValueOnce(makeDetail());
    const { result, rerender } = renderHook(
      ({ code }) => useEmailTemplate(code),
      {
        initialProps: { code: 'email_activation' },
      }
    );
    await waitFor(() =>
      expect(result.current.template?.templateCode).toBe('email_activation')
    );

    let resolveNext: (detail: EmailTemplateDetail) => void = () => undefined;
    service.get.mockReturnValueOnce(
      new Promise<EmailTemplateDetail>((resolve) => {
        resolveNext = resolve;
      })
    );
    rerender({ code: 'password_reset' });
    await waitFor(() =>
      expect(service.get).toHaveBeenLastCalledWith('password_reset')
    );
    expect(result.current.template).toBeNull();
    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolveNext(makeDetail({ templateCode: 'password_reset' }));
      await Promise.resolve();
    });
    await waitFor(() =>
      expect(result.current.template?.templateCode).toBe('password_reset')
    );
  });
});

describe('useEmailTemplatePreview', () => {
  beforeEach(() => vi.clearAllMocks());

  it('does not render while disabled', async () => {
    renderHook(() =>
      useEmailTemplatePreview('email_activation', DRAFT, {
        enabled: false,
        delayMs: 5,
      })
    );
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(service.preview).not.toHaveBeenCalled();
  });

  it('renders the initial draft, re-renders edits and keeps the last good render on failure', async () => {
    service.preview.mockResolvedValueOnce({
      subject: 'one',
      html: '<p>1</p>',
      text: '1',
      sampleVariables: {},
    });
    const { result, rerender } = renderHook(
      ({ draft }) =>
        useEmailTemplatePreview('email_activation', draft, { delayMs: 5 }),
      { initialProps: { draft: DRAFT } }
    );
    await waitFor(() => expect(result.current.preview?.subject).toBe('one'));
    expect(service.preview).toHaveBeenCalledWith('email_activation', DRAFT);

    service.preview.mockRejectedValueOnce(
      new Error('disallowed HTML tag <script>')
    );
    const edited = { ...DRAFT, htmlTemplate: '<p>$x!</p>' };
    rerender({ draft: edited });

    await waitFor(() =>
      expect(result.current.error).toBe('disallowed HTML tag <script>')
    );
    expect(service.preview).toHaveBeenLastCalledWith(
      'email_activation',
      edited
    );
    expect(result.current.preview?.subject).toBe('one');
    expect(result.current.isLoading).toBe(false);
  });
});
