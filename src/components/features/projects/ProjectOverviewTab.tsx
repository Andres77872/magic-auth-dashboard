import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { StatCard } from '@/components/common';
import { projectService } from '@/services';
import type {
  ProjectDetails,
  UserAccess,
  ProjectStatistics,
  ProjectGroupInfo,
} from '@/types/project.types';
import { CopyableId } from '@/components/common';
import { formatDate } from '@/utils/component-utils';
import {
  Activity,
  Clock,
  Users,
  Layers,
  Zap,
  FolderTree,
} from 'lucide-react';

interface ProjectOverviewTabProps {
  project: ProjectDetails;
  userAccess: UserAccess | null;
  statistics: ProjectStatistics | null;
  projectGroups?: ProjectGroupInfo[];
}

export const ProjectOverviewTab: React.FC<ProjectOverviewTabProps> = ({
  project,
  userAccess,
  statistics,
  projectGroups = [],
}) => {
  const [activity, setActivity] = useState<any[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        setIsLoadingActivity(true);
        const response = await projectService.getProjectActivity(
          project.project_hash,
          {
            limit: 5,
          }
        );
        if (response.success) {
          // Backend returns 'activities' key, fallback to 'data' for compatibility
          setActivity(response.activities || response.data || []);
        }
      } catch (err) {
        console.error('Error fetching project activity:', err);
      } finally {
        setIsLoadingActivity(false);
      }
    };

    fetchRecentActivity();
  }, [project.project_hash]);

  const getStatValue = (value: number | string | undefined): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && !isNaN(Number(value)))
      return Number(value);
    return 0;
  };

  const totalUsers = getStatValue(statistics?.total_users);
  const totalGroups = getStatValue(statistics?.total_groups);

  return (
    <div className="space-y-6">
      {/* Stats Cards Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total Users"
          value={totalUsers}
          icon={<Users className="h-5 w-5" aria-hidden="true" />}
          variant="primary"
          gradient
        />

        <StatCard
          title="Total Groups"
          value={totalGroups}
          icon={<Layers className="h-5 w-5" aria-hidden="true" />}
          variant="success"
          gradient
        />

        <StatCard
          title="Active Sessions"
          value={statistics?.active_sessions ?? 0}
          icon={<Zap className="h-5 w-5" aria-hidden="true" />}
          variant="info"
          gradient
        />

        <StatCard
          title="Project Groups"
          value={projectGroups.length}
          icon={<FolderTree className="h-5 w-5" aria-hidden="true" />}
          variant="warning"
          gradient
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Project Information */}
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Project ID
              </p>
              <CopyableId
                id={project.project_hash}
                label="Click to copy project hash"
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Created
                </p>
                <p className="text-sm">{formatDate(project.created_at, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Last Updated
                </p>
                <p className="text-sm">
                  {project.updated_at
                    ? formatDate(project.updated_at, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Never'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Status
                </p>
                {project.is_active !== false ? (
                  <Badge variant="success">Active</Badge>
                ) : (
                  <Badge variant="warning">Inactive</Badge>
                )}
              </div>
              {userAccess?.access_level && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Your Access
                  </p>
                  <Badge variant="info">{userAccess.access_level}</Badge>
                </div>
              )}
            </div>

            {userAccess?.permissions && userAccess.permissions.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Your Permissions
                </p>
                <div className="flex flex-wrap gap-1">
                  {userAccess.permissions.map((permission, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {permission}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Project Groups */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderTree className="h-5 w-5" />
              Project Groups
            </CardTitle>
          </CardHeader>
          <CardContent>
            {projectGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <FolderTree className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No project groups assigned
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  This project is not part of any project groups
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {projectGroups.map((group) => (
                  <div
                    key={group.group_hash}
                    className="p-3 rounded-lg border bg-muted/30 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">
                          {group.group_name}
                        </p>
                        {group.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {group.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <CopyableId
                      id={group.group_hash}
                      label="Click to copy group hash"
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingActivity ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : activity.length > 0 ? (
            <div className="space-y-3">
              {activity.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between gap-4 p-3 rounded-lg border"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="font-medium text-sm">
                      {item.action || item.activity_type || 'Activity'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.description ||
                        item.details ||
                        'No details available'}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 flex-shrink-0">
                    <Clock className="h-3 w-3" />
                    {item.created_at && formatDate(item.created_at, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Activity className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No recent activity found
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
