/**
 * Token Management Page
 *
 * Main navigation panel for managing consumer API tokens across all users and projects.
 * First-class admin feature — same level as Users, Projects, Groups, etc.
 */

import React from 'react';
import { Key } from 'lucide-react';
import { PageContainer, PageHeader } from '@/components/common';
import { ApiKeysTab } from '@/components/features/tokens';

export function TokenManagementPage(): React.JSX.Element {
  return (
    <PageContainer>
      <PageHeader
        title="API Tokens"
        subtitle="Select a consumer user to view and manage their API tokens"
        icon={<Key size={28} />}
      />

      <div className="space-y-3">
        <ApiKeysTab />
      </div>
    </PageContainer>
  );
}

export default TokenManagementPage;
