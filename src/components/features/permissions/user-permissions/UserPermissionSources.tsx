import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  Users,
  Building2,
  UserCircle,
  Layers,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { permissionAssignmentsService } from '@/services';
import type { PermissionSource } from '@/types/permission-assignments.types';

interface PermissionSourcesData {
  from_role: PermissionSource[];
  from_user_groups: PermissionSource[];
  from_direct_assignment: PermissionSource[];
}

interface UserPermissionSourcesProps {
  title?: string;
  showRefresh?: boolean;
  compact?: boolean;
}

export function UserPermissionSources({
  title = 'My Permission Sources',
  showRefresh = true,
  compact = false
}: UserPermissionSourcesProps): React.JSX.Element {
  const [sources, setSources] = useState<PermissionSourcesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    role: true,
    userGroups: true,
    direct: true
  });

  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = async () => {
    setLoading(true);
    setError(null);

    try {
      const response: any = await permissionAssignmentsService.getMyPermissionSources();
      const sourcesData = response.sources || response.data?.sources || null;

      if (response.success !== false && sourcesData) {
        setSources(sourcesData);
      } else {
        setError('Failed to load permission sources');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load permission sources');
      console.error('Failed to load permission sources:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getTotalGroups = (): number => {
    if (!sources) return 0;
    return (
      sources.from_role.length +
      sources.from_user_groups.length +
      sources.from_direct_assignment.length
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="flex items-center gap-3 py-4">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={loadSources}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!sources || getTotalGroups() === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Layers className="h-10 w-10 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            No permission sources found
          </p>
          <p className="text-xs text-muted-foreground">
            You have not been assigned any permission groups
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">{title}</h3>
          <Badge variant="secondary">
            {getTotalGroups()} source{getTotalGroups() !== 1 ? 's' : ''}
          </Badge>
        </div>
        {showRefresh && (
          <Button variant="outline" size="sm" onClick={loadSources}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {sources.from_role.length > 0 && (
          <SourceSection
            title="From Role"
            icon={<Users className="h-4 w-4" />}
            iconBgClass="bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400"
            items={sources.from_role}
            expanded={expandedSections.role}
            onToggle={() => toggleSection('role')}
            compact={compact}
            renderItem={(source) => (
              <RoleSourceItem key={`${source.role_name}-${source.permission_group_name}`} source={source} />
            )}
          />
        )}

        {sources.from_user_groups.length > 0 && (
          <SourceSection
            title="From User Groups"
            icon={<Building2 className="h-4 w-4" />}
            iconBgClass="bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
            items={sources.from_user_groups}
            expanded={expandedSections.userGroups}
            onToggle={() => toggleSection('userGroups')}
            compact={compact}
            renderItem={(source) => (
              <UserGroupSourceItem key={`${source.user_group_name}-${source.permission_group_name}`} source={source} />
            )}
          />
        )}

        {sources.from_direct_assignment.length > 0 && (
          <SourceSection
            title="Direct Assignments"
            icon={<UserCircle className="h-4 w-4" />}
            iconBgClass="bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400"
            items={sources.from_direct_assignment}
            expanded={expandedSections.direct}
            onToggle={() => toggleSection('direct')}
            compact={compact}
            renderItem={(source) => (
              <DirectSourceItem key={source.permission_group_name} source={source} />
            )}
          />
        )}
      </div>
    </div>
  );
}

interface SourceSectionProps<T> {
  title: string;
  icon: React.ReactNode;
  iconBgClass: string;
  items: T[];
  expanded: boolean;
  onToggle: () => void;
  compact: boolean;
  renderItem: (item: T) => React.ReactNode;
}

function SourceSection<T>({
  title,
  icon,
  iconBgClass,
  items,
  expanded,
  onToggle,
  compact,
  renderItem
}: SourceSectionProps<T>): React.JSX.Element {
  return (
    <Card>
      <CardHeader className="pb-2">
        <button
          className="flex w-full items-center justify-between text-left"
          onClick={onToggle}
        >
          <div className="flex items-center gap-3">
            <div className={`flex h-8 w-8 items-center justify-center rounded ${iconBgClass}`}>
              {icon}
            </div>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {items.length} permission group{items.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-0">
          <div className={compact ? 'space-y-1' : 'space-y-2'}>
            {items.map(renderItem)}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

interface RoleSourceItemProps {
  source: PermissionSource;
}

function RoleSourceItem({ source }: RoleSourceItemProps): React.JSX.Element {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <Layers className="h-4 w-4 text-purple-500" />
        <div>
          <p className="font-medium">{source.permission_group_name}</p>
          <p className="text-xs text-muted-foreground">
            via role: <span className="font-mono">{source.role_name}</span>
          </p>
        </div>
      </div>
      {source.permissions_count > 0 && (
        <Badge variant="outline">
          {source.permissions_count} permission{source.permissions_count !== 1 ? 's' : ''}
        </Badge>
      )}
    </div>
  );
}

interface UserGroupSourceItemProps {
  source: PermissionSource;
}

function UserGroupSourceItem({ source }: UserGroupSourceItemProps): React.JSX.Element {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <Layers className="h-4 w-4 text-purple-500" />
        <div>
          <p className="font-medium">{source.permission_group_name}</p>
          <p className="text-xs text-muted-foreground">
            via user group: <span className="font-mono">{source.user_group_name}</span>
          </p>
        </div>
      </div>
      {source.permissions_count > 0 && (
        <Badge variant="outline">
          {source.permissions_count} permission{source.permissions_count !== 1 ? 's' : ''}
        </Badge>
      )}
    </div>
  );
}

interface DirectSourceItemProps {
  source: PermissionSource;
}

function DirectSourceItem({ source }: DirectSourceItemProps): React.JSX.Element {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <Layers className="h-4 w-4 text-purple-500" />
        <div>
          <p className="font-medium">{source.permission_group_name}</p>
          {source.notes && (
            <p className="text-xs text-muted-foreground">{source.notes}</p>
          )}
        </div>
      </div>
      {source.permissions_count > 0 && (
        <Badge variant="outline">
          {source.permissions_count} permission{source.permissions_count !== 1 ? 's' : ''}
        </Badge>
      )}
    </div>
  );
}

export default UserPermissionSources;
