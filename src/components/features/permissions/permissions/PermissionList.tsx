import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Shield, Plus } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataView } from '@/components/common/DataView';
import type { DataViewColumn } from '@/components/common/DataView';
import { PermissionCard } from './PermissionCard';
import { PermissionActionsMenu } from './PermissionActionsMenu';
import { CategoryBadge } from '../shared/CategoryBadge';
import type { GlobalPermission } from '@/types/global-roles.types';

interface PermissionListProps {
  permissions: GlobalPermission[];
  loading?: boolean;
  categories?: string[];
  onEdit?: (permission: GlobalPermission) => void;
  onDelete?: (permission: GlobalPermission) => void;
  onCreate?: () => void;
  onViewDetails?: (permission: GlobalPermission) => void;
}

export function PermissionList({
  permissions,
  loading = false,
  categories = [],
  onEdit,
  onDelete,
  onCreate,
  onViewDetails
}: PermissionListProps): React.JSX.Element {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const filteredPermissions = useMemo(() => {
    return permissions.filter((p) => {
      const matchesSearch =
        p.permission_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.permission_display_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        categoryFilter === 'all' || (p.permission_category || 'general') === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [permissions, searchTerm, categoryFilter]);

  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    permissions.forEach((p) => cats.add(p.permission_category || 'general'));
    categories.forEach((c) => cats.add(c));
    return Array.from(cats).sort();
  }, [permissions, categories]);

  // Table columns for table view
  const columns: DataViewColumn<GlobalPermission>[] = [
    {
      key: 'permission_display_name',
      header: 'Name',
      sortable: true,
      render: (_, permission) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
            <Shield className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails?.(permission);
              }}
              className="font-medium text-primary hover:underline text-left cursor-pointer"
            >
              {permission.permission_display_name}
            </button>
            <span className="text-xs font-mono text-muted-foreground">{permission.permission_name}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'permission_description',
      header: 'Description',
      hideOnMobile: true,
      render: (value) => (
        <span className="text-muted-foreground line-clamp-1 max-w-[300px]">
          {value || '—'}
        </span>
      ),
    },
    {
      key: 'permission_category',
      header: 'Category',
      width: '120px',
      render: (_, permission) => <CategoryBadge category={permission.permission_category} />,
    },
    {
      key: 'permission_hash',
      header: '',
      width: '60px',
      align: 'center',
      render: (_, permission) => (
        <div data-no-row-click onClick={(e) => e.stopPropagation()}>
          <PermissionActionsMenu
            permission={permission}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      ),
    },
  ];

  // Card renderer for grid view
  const renderPermissionCard = (permission: GlobalPermission) => (
    <PermissionCard
      permission={permission}
      onClick={onViewDetails}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );

  return (
    <div className="space-y-4">
      <DataView<GlobalPermission>
        data={filteredPermissions}
        columns={columns}
        keyExtractor={(permission) => permission.permission_hash}
        
        // View mode with toggle
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showViewToggle={true}
        
        // Search
        showSearch={true}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search permissions..."
        
        // Filters in toolbar
        toolbarFilters={
          allCategories.length > 0 && (
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {allCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        }
        
        // Actions in toolbar
        toolbarActions={
          onCreate && (
            <Button onClick={onCreate}>
              <Plus className="mr-2 h-4 w-4" />
              New Permission
            </Button>
          )
        }
        
        // Grid view
        renderCard={renderPermissionCard}
        gridColumns={{ mobile: 1, tablet: 2, desktop: 3 }}
        
        // States
        isLoading={loading}
        emptyMessage={searchTerm || categoryFilter !== 'all' ? 'No permissions match your filters' : 'No permissions found'}
        emptyDescription={searchTerm || categoryFilter !== 'all' ? 'Try adjusting your search or filters' : 'Create your first permission to get started'}
        emptyIcon={<Shield className="h-12 w-12" />}
        emptyAction={
          onCreate && !searchTerm && categoryFilter === 'all' && (
            <Button onClick={onCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Create Permission
            </Button>
          )
        }
      />
      
      {filteredPermissions.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Showing {filteredPermissions.length} of {permissions.length} permission
          {permissions.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}

export default PermissionList;
