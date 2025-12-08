import React from 'react';
import { QuickActionCard } from './QuickActionCard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUserType } from '@/hooks';
import { ROUTES } from '@/utils/routes';
import { Zap, Crown } from 'lucide-react';
import type { QuickAction } from '@/types/dashboard.types';

export function QuickActionsPanel(): React.JSX.Element {
  const { isRoot, isAdminOrHigher } = useUserType();

  const generateQuickActions = (): QuickAction[] => {
    const actions: QuickAction[] = [];

    if (isAdminOrHigher) {
      actions.push(
        {
          id: 'create-user',
          title: 'Create User',
          description: 'Add new users to the system',
          icon: 'user-plus',
          href: ROUTES.USERS,
          color: 'primary',
          requiredUserType: 'admin',
        },
        {
          id: 'create-project',
          title: 'Create Project',
          description: 'Set up new projects and workspaces',
          icon: 'folder-plus',
          href: ROUTES.PROJECTS,
          color: 'success',
          requiredUserType: 'admin',
        },
        {
          id: 'manage-groups',
          title: 'Manage Groups',
          description: 'Organize users into groups',
          icon: 'users',
          href: ROUTES.GROUPS,
          color: 'info',
          requiredUserType: 'admin',
        },
        {
          id: 'permissions',
          title: 'Permissions',
          description: 'Configure roles and access control',
          icon: 'shield',
          href: ROUTES.PERMISSION_MANAGEMENT,
          color: 'warning',
          requiredUserType: 'admin',
        },
        {
          id: 'audit-logs',
          title: 'Audit Logs',
          description: 'View system activity and events',
          icon: 'bar-chart',
          href: ROUTES.AUDIT,
          color: 'info',
          requiredUserType: 'admin',
        }
      );
    }

    if (isRoot) {
      actions.push(
        {
          id: 'role-management',
          title: 'Role Management',
          description: 'Manage global roles and permission groups',
          icon: 'shield',
          href: ROUTES.ROLE_MANAGEMENT,
          color: 'warning',
          requiredUserType: 'root',
        },
        {
          id: 'system-settings',
          title: 'System Management',
          description: 'Configure system-wide settings and health',
          icon: 'settings',
          href: ROUTES.SYSTEM,
          color: 'info',
          requiredUserType: 'root',
        }
      );
    }

    return actions;
  };

  const quickActions = generateQuickActions();

  if (quickActions.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>No actions available for your user type</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Zap className="h-5 w-5 text-warning" />
            </div>
            <div>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Streamlined access to common administrative tasks</CardDescription>
            </div>
          </div>
          {isRoot && (
            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 gap-1">
              <Crown className="h-3 w-3" />
              ROOT Access
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <QuickActionCard key={action.id} action={action} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default QuickActionsPanel; 