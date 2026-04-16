import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { UserPermissionCheck } from './user-permissions/UserPermissionCheck';
import { UserPermissionSources } from './user-permissions/UserPermissionSources';
import type { GlobalRole } from '@/types/global-roles.types';

interface MyPermissionsTabContentProps {
  currentRole: GlobalRole | null;
}

export function MyPermissionsTabContent({
  currentRole,
}: MyPermissionsTabContentProps): React.JSX.Element {
  return (
    <div className="space-y-6">
      {currentRole && (
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Your Current Role</p>
              <p className="text-xl font-bold">
                {currentRole.role_display_name}
              </p>
              <p className="text-xs font-mono text-muted-foreground">
                {currentRole.role_name}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <UserPermissionCheck />
        <div className="space-y-4">
          <UserPermissionSources compact />
        </div>
      </div>
    </div>
  );
}

export default MyPermissionsTabContent;
