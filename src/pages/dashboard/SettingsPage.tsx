/**
 * Settings Page
 *
 * Settings page at /dashboard/settings.
 * Session tab for session expiry display and auto-refresh status.
 */

import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { PageContainer, PageHeader } from '@/components/common';
import { SessionTab } from '@/components/features/settings/SessionTab';

export function SettingsPage(): React.JSX.Element {
  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="Settings"
          subtitle="Manage your session settings"
          icon={<SettingsIcon size={24} />}
        />

        {/* Session Info */}
        <div className="space-y-4">
          <SessionTab />
        </div>
      </div>
    </PageContainer>
  );
}

export default SettingsPage;
