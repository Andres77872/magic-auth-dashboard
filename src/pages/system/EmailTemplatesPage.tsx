/**
 * Email Templates pages (ROOT only)
 *
 * - EmailTemplatesPage: lists the transactional templates.
 * - EmailTemplateEditorPage: edits one template (subject/HTML/text) with live
 *   preview, send-test, version history and rollback.
 */

import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Mail, ChevronLeft } from 'lucide-react';
import { PageContainer, PageHeader } from '@/components/common';
import { EmailTemplatesList, EmailTemplateEditor } from '@/components/features/email-templates';
import { ROUTES } from '@/utils/routes';
import { emailTemplateLabel } from '@/types/email-templates.types';

export function EmailTemplatesPage(): React.JSX.Element {
  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="Email templates"
          subtitle="Edit the transactional emails sent for activation, password reset and security events"
          icon={<Mail size={24} />}
        />
        <EmailTemplatesList />
      </div>
    </PageContainer>
  );
}

export function EmailTemplateEditorPage(): React.JSX.Element {
  const { templateCode = '' } = useParams<{ templateCode: string }>();

  return (
    <PageContainer>
      <div className="space-y-6">
        <Link
          to={ROUTES.EMAIL_TEMPLATES}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft size={16} /> Back to templates
        </Link>
        <PageHeader
          title={emailTemplateLabel(templateCode)}
          subtitle="Edit the subject, HTML and plain-text together, then preview and save a new version"
          icon={<Mail size={24} />}
        />
        <EmailTemplateEditor templateCode={templateCode} />
      </div>
    </PageContainer>
  );
}

export default EmailTemplatesPage;
