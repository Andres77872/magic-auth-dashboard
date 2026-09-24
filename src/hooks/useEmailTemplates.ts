/**
 * Email template hooks (ROOT only).
 *
 * - `useEmailTemplates` loads the catalogue and creates dynamic templates.
 * - `useEmailTemplate` loads one template and exposes its mutations; each one
 *   awaits the API and then refreshes the template (callers toast).
 * - `useEmailTemplatePreview` renders a draft on the server, debounced, keeping
 *   the last good render on screen while a newer one is in flight.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAsyncData } from './useAsyncData';
import { emailTemplatesService } from '@/services/email-templates.service';
import type {
  EmailTemplateCreateInput,
  EmailTemplateCreateResult,
  EmailTemplateDetail,
  EmailTemplateDraft,
  EmailTemplatePreview,
  EmailTemplateSummary,
  SendTestResult,
} from '@/types/email-templates.types';

export interface UseEmailTemplatesReturn {
  templates: EmailTemplateSummary[];
  /** First load only — use for skeletons. */
  isLoading: boolean;
  /** Background or manual refresh in flight. */
  isRefreshing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  /** Create a dynamic template (version 1), then refresh the list. */
  createTemplate: (
    input: EmailTemplateCreateInput
  ) => Promise<EmailTemplateCreateResult>;
}

export function useEmailTemplates(): UseEmailTemplatesReturn {
  const fetcher = useCallback(() => emailTemplatesService.list(), []);
  const { data, isLoading, isRefreshing, error, refetch } =
    useAsyncData(fetcher);

  const createTemplate = useCallback(
    async (
      input: EmailTemplateCreateInput
    ): Promise<EmailTemplateCreateResult> => {
      const result = await emailTemplatesService.create(input);
      await refetch();
      return result;
    },
    [refetch]
  );

  return {
    templates: data ?? [],
    isLoading,
    isRefreshing,
    error,
    refetch,
    createTemplate,
  };
}

export interface UseEmailTemplateReturn {
  /** `null` until the first load (or while a different code is loading). */
  template: EmailTemplateDetail | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  /** Save and activate a new version; resolves with its number. */
  save: (draft: EmailTemplateDraft) => Promise<number | null>;
  /** Re-activate a stored version (also re-enables a disabled template). */
  rollback: (version: number) => Promise<void>;
  /** Disable the code; queued emails that use it are cancelled. */
  disable: () => Promise<void>;
  /** Send a test of `draft` (or the active version) to the caller's own address. */
  sendTest: (draft?: EmailTemplateDraft) => Promise<SendTestResult>;
}

export function useEmailTemplate(
  templateCode: string | undefined
): UseEmailTemplateReturn {
  const code = templateCode ?? '';
  const fetcher = useCallback(() => emailTemplatesService.get(code), [code]);
  const { data, isLoading, isRefreshing, error, refetch } = useAsyncData(
    fetcher,
    { enabled: Boolean(code) }
  );

  // useAsyncData keeps the previous result while a new code loads; never show
  // one template's content under another template's URL. (The API lower-cases codes.)
  const template =
    data && data.templateCode === code.trim().toLowerCase() ? data : null;

  const save = useCallback(
    async (draft: EmailTemplateDraft): Promise<number | null> => {
      const version = await emailTemplatesService.update(code, draft);
      await refetch();
      return version;
    },
    [code, refetch]
  );

  const rollback = useCallback(
    async (version: number): Promise<void> => {
      await emailTemplatesService.rollback(code, version);
      await refetch();
    },
    [code, refetch]
  );

  const disable = useCallback(async (): Promise<void> => {
    await emailTemplatesService.disable(code);
    await refetch();
  }, [code, refetch]);

  const sendTest = useCallback(
    (draft?: EmailTemplateDraft): Promise<SendTestResult> =>
      emailTemplatesService.sendTest(code, draft),
    [code]
  );

  return {
    template,
    isLoading: isLoading || (Boolean(code) && !template && !error),
    isRefreshing,
    error,
    refetch,
    save,
    rollback,
    disable,
    sendTest,
  };
}

export interface UseEmailTemplatePreviewReturn {
  /** Last successful render (kept while a newer draft renders or fails). */
  preview: EmailTemplatePreview | null;
  isLoading: boolean;
  /** Backend message for the latest failed render; cleared by the next success. */
  error: string | null;
}

/**
 * Debounced server render of `draft`. Pass a stable `draft` object (component
 * state) so the render only re-runs on edits; `enabled: false` pauses it (e.g.
 * while the draft fails client-side validation).
 */
export function useEmailTemplatePreview(
  templateCode: string,
  draft: EmailTemplateDraft,
  {
    enabled = true,
    delayMs = 500,
  }: { enabled?: boolean; delayMs?: number } = {}
): UseEmailTemplatePreviewReturn {
  const [preview, setPreview] = useState<EmailTemplatePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const latestRequest = useRef(0);
  const hasRequested = useRef(false);

  useEffect(() => {
    if (!enabled || !templateCode) return undefined;
    // Render the initial draft straight away; debounce only subsequent edits.
    const wait = hasRequested.current ? delayMs : 0;
    const handle = window.setTimeout(() => {
      hasRequested.current = true;
      const id = ++latestRequest.current;
      setIsLoading(true);
      emailTemplatesService
        .preview(templateCode, draft)
        .then((result) => {
          if (id !== latestRequest.current) return;
          setPreview(result);
          setError(null);
        })
        .catch((err: unknown) => {
          if (id !== latestRequest.current) return;
          setError(
            err instanceof Error
              ? err.message
              : 'The preview could not be rendered.'
          );
        })
        .finally(() => {
          if (id === latestRequest.current) setIsLoading(false);
        });
    }, wait);
    return (): void => window.clearTimeout(handle);
  }, [templateCode, draft, enabled, delayMs]);

  // Ignore responses that land after unmount.
  useEffect(
    () => (): void => {
      latestRequest.current += 1;
    },
    []
  );

  return { preview, isLoading, error };
}
