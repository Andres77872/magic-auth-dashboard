import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Users, Plus, Search, LayoutGrid, List } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RoleCard } from './RoleCard';
import type { GlobalRole } from '@/types/global-roles.types';

type ViewMode = 'grid' | 'list';
type SortOption = 'priority-desc' | 'priority-asc' | 'name-asc' | 'name-desc';

interface RoleListProps {
  roles: GlobalRole[];
  loading?: boolean;
  onEdit?: (role: GlobalRole) => void;
  onDelete?: (role: GlobalRole) => void;
  onManagePermissionGroups?: (role: GlobalRole) => void;
  onAssignUsers?: (role: GlobalRole) => void;
  onCreate?: () => void;
}

export function RoleList({
  roles,
  loading = false,
  onEdit,
  onDelete,
  onManagePermissionGroups,
  onAssignUsers,
  onCreate
}: RoleListProps): React.JSX.Element {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('priority-desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const filteredAndSortedRoles = useMemo(() => {
    const filtered = roles.filter((r) =>
      r.role_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.role_display_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'priority-desc':
          return b.role_priority - a.role_priority;
        case 'priority-asc':
          return a.role_priority - b.role_priority;
        case 'name-asc':
          return a.role_display_name.localeCompare(b.role_display_name);
        case 'name-desc':
          return b.role_display_name.localeCompare(a.role_display_name);
        default:
          return 0;
      }
    });
  }, [roles, searchTerm, sortBy]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="priority-desc">Priority (High to Low)</SelectItem>
              <SelectItem value="priority-asc">Priority (Low to High)</SelectItem>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-md border p-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          {onCreate && (
            <Button onClick={onCreate}>
              <Plus className="mr-2 h-4 w-4" />
              New Role
            </Button>
          )}
        </div>
      </div>

      {filteredAndSortedRoles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">
              {searchTerm ? 'No roles match your search' : 'No roles found'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm
                ? 'Try adjusting your search'
                : 'Create roles to assign permission groups to users'}
            </p>
            {onCreate && !searchTerm && (
              <Button className="mt-4" onClick={onCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Create Role
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid gap-3 md:grid-cols-2 lg:grid-cols-3'
              : 'flex flex-col gap-2'
          }
        >
          {filteredAndSortedRoles.map((role) => (
            <RoleCard
              key={role.role_hash}
              role={role}
              onEdit={onEdit}
              onDelete={onDelete}
              onManagePermissionGroups={onManagePermissionGroups}
              onAssignUsers={onAssignUsers}
            />
          ))}
        </div>
      )}

      {filteredAndSortedRoles.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Showing {filteredAndSortedRoles.length} of {roles.length} role
          {roles.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}

export default RoleList;
