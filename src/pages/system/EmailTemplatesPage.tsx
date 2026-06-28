/**
 * Email Templates pages (ROOT only)
 *
 * - EmailTemplatesPage: lists the transactional templates.
 * - EmailTemplateEditorPage: edits one template (subject/HTML/text) with live
 *   preview, send-test, version history and rollback.
 */

import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Mail, ChevronLeft } from 'lucide-react';
import { ConfirmDialog, PageContainer, PageHeader } from '@/components/common';
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
  const navigate = useNavigate();
  const [dirty, setDirty] = React.useState(false);
  const [confirmLeave, setConfirmLeave] = React.useState(false);

  // Non-data <BrowserRouter> can't use useBlocker, so guard the in-app back
  // affordance directly (tab close is covered by the editor's beforeunload).
  const goBack = (): void => {
    if (dirty) setConfirmLeave(true);
    else void navigate(ROUTES.EMAIL_TEMPLATES);
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft size={16} /> Back to templates
        </button>
        <PageHeader
          title={emailTemplateLabel(templateCode)}
          subtitle="Edit the subject, HTML and plain-text together, then preview and save a new version"
          icon={<Mail size={24} />}
        />
        <EmailTemplateEditor templateCode={templateCode} onDirtyChange={setDirty} />
      </div>

      <ConfirmDialog
        isOpen={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        onConfirm={() => {
          setConfirmLeave(false);
          void navigate(ROUTES.EMAIL_TEMPLATES);
        }}
        title="Discard unsaved changes?"
        message="You have unsaved edits to this template. Leaving will discard them."
        variant="warning"
        confirmText="Discard & leave"
        cancelText="Keep editing"
      />
    </PageContainer>
  );
}

export default EmailTemplatesPage;
