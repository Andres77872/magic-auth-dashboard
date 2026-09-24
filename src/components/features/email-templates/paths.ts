import { ROUTES } from '@/utils/routes';

/** Canonical editor URL for a template code (codes are encoded as one path segment). */
export function emailTemplateEditorPath(templateCode: string): string {
  return `${ROUTES.EMAIL_TEMPLATES}/${encodeURIComponent(templateCode)}`;
}
