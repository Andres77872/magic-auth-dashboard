import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Lock } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataView } from '@/components/common/DataView';
import type { DataViewColumn } from '@/components/common/DataView';
import { RoleCard } from './RoleCard';
import { RoleActionsMenu } from './RoleActionsMenu';
import { PriorityBadge } from '../shared/PriorityBadge';
import type { GlobalRole } from '@/types/global-roles.types';

type SortOption = 'priority-desc' | 'priority-asc' | 'name-asc' | 'name-desc';

interface RoleListProps {
  roles: GlobalRole[];
  loading?: boolean;
  onEdit?: (role: GlobalRole) => void;
  onDelete?: (role: GlobalRole) => void;
  onManagePermissionGroups?: (role: GlobalRole) => void;
  onAssignUsers?: (role: GlobalRole) => void;
  onCreate?: () => void;
  onViewDetails?: (role: GlobalRole) => void;
}

export function RoleList({
  roles,
  loading = false,
  onEdit,
  onDelete,
  onManagePermissionGroups,
  onAssignUsers,
  onCreate,
  onViewDetails
}: RoleListProps): React.JSX.Element {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('priority-desc');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

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

  // Table columns for table view
  const columns: DataViewColumn<GlobalRole>[] = [
    {
      key: 'role_display_name',
      header: 'Name',
      sortable: true,
      render: (_, role) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400">
            <Users className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails?.(role);
              }}
              className="font-medium text-primary hover:underline text-left cursor-pointer"
            >
              {role.role_display_name}
            </button>
            <span className="text-xs font-mono text-muted-foreground">{role.role_name}</span>
          </div>
          {role.is_system_role && (
            <Badge variant="outline" className="text-xs gap-1 ml-2">
              <Lock className="h-3 w-3" />
              System
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'role_description',
      header: 'Description',
      hideOnMobile: true,
      render: (value) => (
        <span className="text-muted-foreground line-clamp-1 max-w-[300px]">
          {value || '—'}
        </span>
      ),
    },
    {
      key: 'role_priority',
      header: 'Priority',
      sortable: true,
      width: '120px',
      align: 'center',
      render: (_, role) => <PriorityBadge priority={role.role_priority} />,
    },
    {
      key: 'role_hash',
      header: '',
      width: '60px',
      align: 'center',
      render: (_, role) => (
        <div data-no-row-click onClick={(e) => e.stopPropagation()}>
          <RoleActionsMenu
            role={role}
            onEdit={onEdit}
            onDelete={onDelete}
            onManagePermissionGroups={onManagePermissionGroups}
            onAssignUsers={onAssignUsers}
          />
        </div>
      ),
    },
  ];

  // Card renderer for grid view
  const renderRoleCard = (role: GlobalRole) => (
    <RoleCard
      role={role}
      onClick={onViewDetails}
      onEdit={onEdit}
      onDelete={onDelete}
      onManagePermissionGroups={onManagePermissionGroups}
      onAssignUsers={onAssignUsers}
    />
  );

  return (
    <div className="space-y-4">
      <DataView<GlobalRole>
        data={filteredAndSortedRoles}
        columns={columns}
        keyExtractor={(role) => role.role_hash}
        
        // View mode with toggle
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showViewToggle={true}
        
        // Search
        showSearch={true}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search roles..."
        
        // Filters in toolbar
        toolbarFilters={
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="priority-desc">Priority (High to Low)</SelectItem>
              <SelectItem value="priority-asc">Priority (Low to High)</SelectItem>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        }
        
        // Actions in toolbar
        toolbarActions={
          onCreate && (
            <Button onClick={onCreate}>
              <Plus className="mr-2 h-4 w-4" />
              New Role
            </Button>
          )
        }
        
        // Grid view
        renderCard={renderRoleCard}
        gridColumns={{ mobile: 1, tablet: 2, desktop: 3 }}
        
        // States
        isLoading={loading}
        emptyMessage={searchTerm ? 'No roles match your search' : 'No roles found'}
        emptyDescription={searchTerm ? 'Try adjusting your search' : 'Create roles to assign permission groups to users'}
        emptyIcon={<Users className="h-12 w-12" />}
        emptyAction={
          onCreate && !searchTerm && (
            <Button onClick={onCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Create Role
            </Button>
          )
        }
      />
      
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
