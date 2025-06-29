import React from 'react';
import { QuickActionCard } from './QuickActionCard';
import { useUserType } from '@/hooks';
import { ROUTES } from '@/utils/routes';
import type { QuickAction } from '@/types/dashboard.types';

export function QuickActionsPanel(): React.JSX.Element {
  const { isRoot, isAdminOrHigher } = useUserType();

  const generateQuickActions = (): QuickAction[] => {
    const actions: QuickAction[] = [];

    // Actions available to ADMIN+ users
    if (isAdminOrHigher) {
      actions.push(
        {
          id: 'create-user',
          title: 'Create User',
          description: 'Add new users to the system',
          icon: 'user-plus',
          href: ROUTES.USERS_CREATE,
          color: 'primary',
          requiredUserType: 'admin',
        },
        {
          id: 'create-project',
          title: 'Create Project',
          description: 'Set up new projects and workspaces',
          icon: 'folder-plus',
          href: ROUTES.PROJECTS_CREATE,
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
          href: ROUTES.PERMISSIONS,
          color: 'warning',
          requiredUserType: 'admin',
        }
      );
    }

    // Actions available only to ROOT users
    if (isRoot) {
      actions.push(
        {
          id: 'system-settings',
          title: 'System Settings',
          description: 'Configure system-wide settings',
          icon: 'settings',
          href: ROUTES.SYSTEM_SETTINGS,
          color: 'warning',
          requiredUserType: 'root',
        },
        {
          id: 'view-reports',
          title: 'System Health',
          description: 'Monitor system performance',
          icon: 'bar-chart',
          href: ROUTES.SYSTEM_HEALTH,
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
      <div className="quick-actions-panel">
        <div className="quick-actions-header">
          <h2>Quick Actions</h2>
          <p>No actions available for your user type</p>
        </div>
      </div>
    );
  }

  return (
    <div className="quick-actions-panel">
      <div className="quick-actions-header">
        <h2>Quick Actions</h2>
        <p>Streamlined access to common administrative tasks</p>
      </div>

      <div className="quick-actions-grid">
        {quickActions.map((action) => (
          <QuickActionCard
            key={action.id}
            action={action}
          />
        ))}
      </div>

      <div className="quick-actions-footer">
        <p className="actions-note">
          {isRoot 
            ? 'You have full system access as a ROOT user' 
            : 'Contact your administrator for additional permissions'
          }
        </p>
      </div>
    </div>
  );
}

export default QuickActionsPanel; 