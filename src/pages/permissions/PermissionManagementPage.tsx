import React from 'react';
import { PageContainer } from '@/components/common';
import { PermissionManagementProvider } from '@/contexts';
import { PermissionsDashboard } from '@/components/features/permissions';

export const PermissionManagementPage: React.FC = () => {
  return (
    <PermissionManagementProvider>
      <PageContainer>
        <PermissionsDashboard />
      </PageContainer>
    </PermissionManagementProvider>
  );
};

export default PermissionManagementPage;

