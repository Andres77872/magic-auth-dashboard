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
      <section className="quick-actions-panel" aria-labelledby="quick-actions-title">
        <header className="quick-actions-header">
          <h2 id="quick-actions-title">Quick Actions</h2>
          <p>No actions available for your user type</p>
        </header>
      </section>
    );
  }

  return (
    <section className="quick-actions-panel" aria-labelledby="quick-actions-title">
      <header className="quick-actions-header">
        <h2 id="quick-actions-title">Quick Actions</h2>
        <p>Streamlined access to common administrative tasks</p>
      </header>

      <ul className="quick-actions-grid" role="list">
        {quickActions.map((action) => (
          <li key={action.id}>
            <QuickActionCard action={action} />
          </li>
        ))}
      </ul>

      <footer className="quick-actions-footer">
        <p className="actions-note">
          {isRoot 
            ? 'You have full system access as a ROOT user' 
            : 'Contact your administrator for additional permissions'
          }
        </p>
      </footer>
    </section>
  );
}

export default QuickActionsPanel; 