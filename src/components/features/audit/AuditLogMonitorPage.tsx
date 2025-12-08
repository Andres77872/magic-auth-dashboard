import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/common/PageHeader';
import { PageContainer } from '@/components/common/PageContainer';
import { ActivityLogTab } from './ActivityLogTab';
import { SecurityEventsTab } from './SecurityEventsTab';
import { AuditStatisticsTab } from './AuditStatisticsTab';
import { ActivityExport } from './ActivityExport';
import { useAuth } from '@/hooks/useAuth';
import { useActivityLogs } from '@/hooks/audit/useActivityLogs';
import { useToast } from '@/hooks/useToast';
import {
  Activity,
  ShieldAlert,
  BarChart3,
} from 'lucide-react';
import type { ActivityFilters } from '@/types/audit.types';

export interface AuditLogMonitorPageProps {
  defaultTab?: 'activity' | 'security' | 'statistics';
  className?: string;
}

/**
 * AuditLogMonitorPage - Main page component for the Audit Log Monitor
 * Requirements: 1.1, 3.1, 5.1
 */
export function AuditLogMonitorPage({
  defaultTab = 'activity',
  className,
}: AuditLogMonitorPageProps): React.JSX.Element {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [filters, setFilters] = useState<ActivityFilters>({});

  // Check if user is root (has access to all tabs)
  const isRoot = user?.user_type === 'root';

  // Get activity logs for export
  const { pagination } = useActivityLogs({ filters, limit: 1 });

  // Handle tab change
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value as 'activity' | 'security' | 'statistics');
  }, []);

  // Handle user click (navigate to user profile)
  const handleUserClick = useCallback((userId: string) => {
    // Navigate to user profile
    window.location.href = `/users/${userId}`;
  }, []);

  // Handle project click (navigate to project page)
  const handleProjectClick = useCallback((projectId: string) => {
    // Navigate to project page
    window.location.href = `/projects/${projectId}`;
  }, []);

  // Handle export events
  const handleExportStart = useCallback(() => {
    showToast({
      title: 'Export Started',
      description: 'Preparing your export file...',
      variant: 'default',
    });
  }, [showToast]);

  const handleExportComplete = useCallback(
    (filename: string) => {
      showToast({
        title: 'Export Complete',
        description: `Downloaded ${filename}`,
        variant: 'success',
      });
    },
    [showToast]
  );

  const handleExportError = useCallback(
    (error: string) => {
      showToast({
        title: 'Export Failed',
        description: error,
        variant: 'error',
      });
    },
    [showToast]
  );

  return (
    <PageContainer className={className}>
      <PageHeader
        title="Audit Log Monitor"
        description="Monitor system activities, security events, and audit statistics"
        icon={<Activity className="h-6 w-6" aria-hidden="true" />}
        actions={
          <ActivityExport
            filters={filters}
            totalCount={pagination.total}
            onExportStart={handleExportStart}
            onExportComplete={handleExportComplete}
            onExportError={handleExportError}
          />
        }
      />

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Activity</span>
          </TabsTrigger>
          {isRoot && (
            <TabsTrigger value="security" className="gap-2">
              <ShieldAlert className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
          )}
          {isRoot && (
            <TabsTrigger value="statistics" className="gap-2">
              <BarChart3 className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Statistics</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Activity Log Tab */}
        <TabsContent value="activity" className="mt-6">
          <ActivityLogTab
            initialFilters={filters}
            onUserClick={handleUserClick}
            onProjectClick={handleProjectClick}
          />
        </TabsContent>

        {/* Security Events Tab - Root Only */}
        {isRoot && (
          <TabsContent value="security" className="mt-6">
            <SecurityEventsTab
              onUserClick={handleUserClick}
              onProjectClick={handleProjectClick}
            />
          </TabsContent>
        )}

        {/* Audit Statistics Tab - Root Only */}
        {isRoot && (
          <TabsContent value="statistics" className="mt-6">
            <AuditStatisticsTab />
          </TabsContent>
        )}
      </Tabs>
    </PageContainer>
  );
}

export default AuditLogMonitorPage;
