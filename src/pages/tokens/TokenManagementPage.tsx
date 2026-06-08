/**
 * Token Management Page
 *
 * Main navigation panel for managing consumer API tokens across all users and projects.
 * First-class admin feature — same level as Users, Projects, Groups, etc.
 */

import React from 'react';
import { PageContainer } from '@/components/common';
import { ApiKeysTab } from '@/components/features/tokens';

export function TokenManagementPage(): React.JSX.Element {
  return (
    <PageContainer>
      <ApiKeysTab />
    </PageContainer>
  );
}

export default TokenManagementPage;
