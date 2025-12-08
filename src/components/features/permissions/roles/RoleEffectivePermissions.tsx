import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Shield, Search, AlertTriangle, Layers } from 'lucide-react';
import { CategoryBadge } from '../shared/CategoryBadge';
import { globalRolesService } from '@/services';
import type { GlobalRole, GlobalPermission, GlobalPermissionGroup } from '@/types/global-roles.types';

interface PermissionWithSource extends GlobalPermission {
  sourceGroups: string[];
}

interface RoleEffectivePermissionsProps {
  role: GlobalRole;
}

export function RoleEffectivePermissions({ role }: RoleEffectivePermissionsProps): React.JSX.Element {
  const [permissions, setPermissions] = useState<PermissionWithSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadEffectivePermissions();
  }, [role.role_hash]);

  const loadEffectivePermissions = async () => {
    setLoading(true);
    setError(null);

    try {
      const groupsResponse: any = await globalRolesService.getRolePermissionGroups(role.role_hash);
      const groups: GlobalPermissionGroup[] = groupsResponse.permission_groups || groupsResponse.data || [];

      const permissionMap = new Map<string, PermissionWithSource>();

      for (const group of groups) {
        try {
          const permsResponse: any = await globalRolesService.getGroupPermissions(group.group_hash);
          const perms: GlobalPermission[] = permsResponse.permissions || permsResponse.data || [];

          for (const perm of perms) {
            const existing = permissionMap.get(perm.permission_hash);
            if (existing) {
              existing.sourceGroups.push(group.group_display_name);
            } else {
              permissionMap.set(perm.permission_hash, {
                ...perm,
                sourceGroups: [group.group_display_name]
              });
            }
          }
        } catch {
          // Skip groups where we can't fetch permissions
        }
      }

      const sortedPermissions = Array.from(permissionMap.values()).sort((a, b) =>
        a.permission_display_name.localeCompare(b.permission_display_name)
      );

      setPermissions(sortedPermissions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load effective permissions');
      console.error('Failed to load effective permissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPermissions = permissions.filter(p =>
    p.permission_name.toLowerCase().includes(search.toLowerCase()) ||
    p.permission_display_name.toLowerCase().includes(search.toLowerCase()) ||
    p.permission_category?.toLowerCase().includes(search.toLowerCase())
  );

  const categoryCounts = permissions.reduce((acc, p) => {
    const cat = p.permission_category || 'Uncategorized';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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
        </CardContent>
      </Card>
    );
  }

  if (permissions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Shield className="h-10 w-10 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            No effective permissions
          </p>
          <p className="text-xs text-muted-foreground">
            Assign permission groups to this role to grant permissions
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {permissions.length} permission{permissions.length !== 1 ? 's' : ''}
          </Badge>
          <Badge variant="outline">
            {Object.keys(categoryCounts).length} categor{Object.keys(categoryCounts).length !== 1 ? 'ies' : 'y'}
          </Badge>
        </div>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search permissions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.entries(categoryCounts).map(([category, count]) => (
          <Badge
            key={category}
            variant="outline"
            className="cursor-pointer hover:bg-accent"
            onClick={() => setSearch(category)}
          >
            {category} ({count})
          </Badge>
        ))}
      </div>

      <div className="space-y-2">
        {filteredPermissions.map((permission) => (
          <Card key={permission.permission_hash} className="p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <Shield className="mt-0.5 h-4 w-4 text-blue-500" />
                <div>
                  <p className="font-medium">{permission.permission_display_name}</p>
                  <p className="text-xs font-mono text-muted-foreground">
                    {permission.permission_name}
                  </p>
                  {permission.permission_description && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {permission.permission_description}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-1">
                    <Layers className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      From: {permission.sourceGroups.join(', ')}
                    </span>
                  </div>
                </div>
              </div>
              <CategoryBadge category={permission.permission_category} />
            </div>
          </Card>
        ))}
      </div>

      {filteredPermissions.length === 0 && search && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Search className="h-10 w-10 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              No permissions match "{search}"
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default RoleEffectivePermissions;
