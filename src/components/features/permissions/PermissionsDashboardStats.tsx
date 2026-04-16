import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { IconContainer } from '@/components/common';
import { Shield, Layers, Users } from 'lucide-react';

interface PermissionsDashboardStatsProps {
  permissionsCount: number;
  permissionGroupsCount: number;
  rolesCount: number;
}

export function PermissionsDashboardStats({
  permissionsCount,
  permissionGroupsCount,
  rolesCount,
}: PermissionsDashboardStatsProps): React.JSX.Element {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <IconContainer
            variant="info"
            size="lg"
            icon={<Shield className="h-6 w-6" />}
          />
          <div>
            <p className="text-2xl font-bold">{permissionsCount}</p>
            <p className="text-sm text-muted-foreground">Permissions</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <IconContainer
            variant="purple"
            size="lg"
            icon={<Layers className="h-6 w-6" />}
          />
          <div>
            <p className="text-2xl font-bold">{permissionGroupsCount}</p>
            <p className="text-sm text-muted-foreground">Permission Groups</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <IconContainer
            variant="success"
            size="lg"
            icon={<Users className="h-6 w-6" />}
          />
          <div>
            <p className="text-2xl font-bold">{rolesCount}</p>
            <p className="text-sm text-muted-foreground">Roles</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PermissionsDashboardStats;
