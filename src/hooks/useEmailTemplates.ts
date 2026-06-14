/**
 * useEmailTemplates / useEmailTemplate
 *
 * ROOT-only hooks for the email templates editor section. `useEmailTemplates`
 * lists every transactional template; `useEmailTemplate` loads one template's
 * editable bodies + version history and exposes save/preview/send-test/rollback.
 */

import { useCallback, useEffect, useState } from 'react';
import { emailTemplatesService } from '@/services/email-templates.service';
import type {
  EmailTemplateDetail,
  EmailTemplateDraft,
  EmailTemplatePreview,
  EmailTemplateSummary,
  SendTestResult,
} from '@/types/email-templates.types';

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

interface UseEmailTemplatesReturn {
  templates: EmailTemplateSummary[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useEmailTemplates(options?: { autoFetch?: boolean }): UseEmailTemplatesReturn {
  const autoFetch = options?.autoFetch ?? true;
  const [templates, setTemplates] = useState<EmailTemplateSummary[]>([]);
  const [isLoading, setIsLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setTemplates(await emailTemplatesService.list());
    } catch (err) {
      setError(errorMessage(err, 'Failed to load email templates'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mount fetch: state updates happen only after the await (never synchronously
  // in the effect body).
  useEffect(() => {
    if (!autoFetch) return undefined;
    let active = true;
    void (async (): Promise<void> => {
      try {
        const data = await emailTemplatesService.list();
        if (active) setTemplates(data);
      } catch (err) {
        if (active) setError(errorMessage(err, 'Failed to load email templates'));
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return (): void => {
      active = false;
    };
  }, [autoFetch]);

  return { templates, isLoading, error, refetch };
}

interface UseEmailTemplateReturn {
  template: EmailTemplateDetail | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  save: (draft: EmailTemplateDraft) => Promise<number | null>;
  preview: (draft?: EmailTemplateDraft) => Promise<EmailTemplatePreview>;
  sendTest: (draft?: EmailTemplateDraft) => Promise<SendTestResult>;
  rollback: (version: number) => Promise<void>;
}

export function useEmailTemplate(templateCode: string | undefined): UseEmailTemplateReturn {
  const [template, setTemplate] = useState<EmailTemplateDetail | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(templateCode));
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!templateCode) return;
    setIsLoading(true);
    setError(null);
    try {
      setTemplate(await emailTemplatesService.get(templateCode));
    } catch (err) {
      setError(errorMessage(err, 'Failed to load template'));
    } finally {
      setIsLoading(false);
    }
  }, [templateCode]);

  // Mount/param-change fetch: state updates happen only after the await.
  useEffect(() => {
    if (!templateCode) return undefined;
    let active = true;
    void (async (): Promise<void> => {
      try {
        const data = await emailTemplatesService.get(templateCode);
        if (active) setTemplate(data);
      } catch (err) {
        if (active) setError(errorMessage(err, 'Failed to load template'));
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return (): void => {
      active = false;
    };
  }, [templateCode]);

  const save = useCallback(
    async (draft: EmailTemplateDraft) => {
      if (!templateCode) return null;
      const version = await emailTemplatesService.update(templateCode, draft);
      await refetch();
      return version;
    },
    [templateCode, refetch]
  );

  const preview = useCallback(
    (draft?: EmailTemplateDraft) => emailTemplatesService.preview(templateCode ?? '', draft),
    [templateCode]
  );

  const sendTest = useCallback(
    (draft?: EmailTemplateDraft) => emailTemplatesService.sendTest(templateCode ?? '', draft),
    [templateCode]
  );

  const rollback = useCallback(
    async (version: number) => {
      if (!templateCode) return;
      await emailTemplatesService.rollback(templateCode, version);
      await refetch();
    },
    [templateCode, refetch]
  );

  return { template, isLoading, error, refetch, save, preview, sendTest, rollback };
}
