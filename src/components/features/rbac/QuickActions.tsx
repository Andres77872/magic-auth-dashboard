import React, { useState } from 'react';
import { useRBAC } from '@/hooks/useRBAC';
import type { RBACInitConfig } from '@/hooks/useRBAC';
import { useToast } from '@/contexts/ToastContext';

interface QuickActionsProps {
  projectHash: string;
  onNavigate?: (path: string) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ projectHash }) => {
  const { initializeProjectRBAC, loading, healthStatus, refreshRBACData } = useRBAC(projectHash);
  const [initializing, setInitializing] = useState(false);
  const { addToast } = useToast();

  const handleInitializeRBAC = async () => {
    setInitializing(true);
    try {
      const config: RBACInitConfig = {
        create_default_permissions: true,
        create_default_roles: true,
        permission_categories: ['general', 'admin', 'user', 'content'],
        default_roles: ['Admin', 'Manager', 'Member', 'Viewer']
      };
      await initializeProjectRBAC(config);
      addToast({
        message: 'RBAC system initialized successfully!',
        variant: 'success',
        duration: 4000
      });
      await refreshRBACData();
    } catch (error) {
      console.error('Failed to initialize RBAC:', error);
      addToast({
        message: error instanceof Error ? error.message : 'Failed to initialize RBAC',
        variant: 'error',
        duration: 5000
      });
    } finally {
      setInitializing(false);
    }
  };

  const isConfigured = healthStatus?.configured;

  return (
    <div className="quick-actions">
      <div className="quick-actions__header">
        <h3>Quick Actions</h3>
      </div>
      
      <div className="quick-actions__content">
        {!isConfigured ? (
          <div className="initialization-section">
            <h4>Get Started</h4>
            <p>Initialize RBAC for this project to start managing permissions and roles.</p>
            <button
              className="btn btn-primary"
              onClick={handleInitializeRBAC}
              disabled={initializing || loading}
            >
              {initializing ? 'Initializing...' : 'Initialize RBAC'}
            </button>
          </div>
        ) : (
          <div className="actions-grid">
            <div className="action-card">
              <h4>Create Permission</h4>
              <p>Add a new custom permission</p>
              <button className="btn btn-secondary">
                + New Permission
              </button>
            </div>
            
            <div className="action-card">
              <h4>Create Role</h4>
              <p>Define a new role with permissions</p>
              <button className="btn btn-secondary">
                + New Role
              </button>
            </div>
            
            <div className="action-card">
              <h4>View Assignments</h4>
              <p>Manage user role assignments</p>
              <button className="btn btn-secondary">
                View Assignments
              </button>
            </div>
            
            <div className="action-card">
              <h4>Audit Log</h4>
              <p>Review RBAC changes</p>
              <button className="btn btn-secondary">
                View Audit Log
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 