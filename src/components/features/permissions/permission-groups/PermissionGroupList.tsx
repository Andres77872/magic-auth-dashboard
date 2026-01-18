import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Layers, Plus } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataView } from '@/components/common/DataView';
import type { DataViewColumn } from '@/components/common/DataView';
import { PermissionGroupCard } from './PermissionGroupCard';
import { PermissionGroupActionsMenu } from './PermissionGroupActionsMenu';
import { CategoryBadge } from '../shared/CategoryBadge';
import type { GlobalPermissionGroup } from '@/types/global-roles.types';

interface PermissionGroupListProps {
  groups: GlobalPermissionGroup[];
  loading?: boolean;
  categories?: string[];
  onEdit?: (group: GlobalPermissionGroup) => void;
  onDelete?: (group: GlobalPermissionGroup) => void;
  onManagePermissions?: (group: GlobalPermissionGroup) => void;
  onCreate?: () => void;
  onViewDetails?: (group: GlobalPermissionGroup) => void;
}

export function PermissionGroupList({
  groups,
  loading = false,
  categories = [],
  onEdit,
  onDelete,
  onManagePermissions,
  onCreate,
  onViewDetails
}: PermissionGroupListProps): React.JSX.Element {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      const matchesSearch =
        g.group_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.group_display_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        categoryFilter === 'all' || (g.group_category || 'general') === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [groups, searchTerm, categoryFilter]);

  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    groups.forEach((g) => cats.add(g.group_category || 'general'));
    categories.forEach((c) => cats.add(c));
    return Array.from(cats).sort();
  }, [groups, categories]);

  // Table columns for table view
  const columns: DataViewColumn<GlobalPermissionGroup>[] = [
    {
      key: 'group_display_name',
      header: 'Name',
      sortable: true,
      render: (_, group) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
            <Layers className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails?.(group);
              }}
              className="font-medium text-primary hover:underline text-left cursor-pointer"
            >
              {group.group_display_name}
            </button>
            <span className="text-xs font-mono text-muted-foreground">{group.group_name}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'group_description',
      header: 'Description',
      hideOnMobile: true,
      render: (value) => (
        <span className="text-muted-foreground line-clamp-1 max-w-[300px]">
          {value || '—'}
        </span>
      ),
    },
    {
      key: 'group_category',
      header: 'Category',
      width: '120px',
      render: (_, group) => <CategoryBadge category={group.group_category} />,
    },
    {
      key: 'group_hash',
      header: '',
      width: '60px',
      align: 'center',
      render: (_, group) => (
        <div data-no-row-click onClick={(e) => e.stopPropagation()}>
          <PermissionGroupActionsMenu
            group={group}
            onEdit={onEdit}
            onDelete={onDelete}
            onManagePermissions={onManagePermissions}
          />
        </div>
      ),
    },
  ];

  // Card renderer for grid view
  const renderPermissionGroupCard = (group: GlobalPermissionGroup) => (
    <PermissionGroupCard
      group={group}
      onClick={onViewDetails}
      onEdit={onEdit}
      onDelete={onDelete}
      onManagePermissions={onManagePermissions}
    />
  );

  return (
    <div className="space-y-4">
      <DataView<GlobalPermissionGroup>
        data={filteredGroups}
        columns={columns}
        keyExtractor={(group) => group.group_hash}
        
        // View mode with toggle
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showViewToggle={true}
        
        // Search
        showSearch={true}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search groups..."
        
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
              New Group
            </Button>
          )
        }
        
        // Grid view
        renderCard={renderPermissionGroupCard}
        gridColumns={{ mobile: 1, tablet: 2, desktop: 3 }}
        
        // States
        isLoading={loading}
        emptyMessage={searchTerm || categoryFilter !== 'all' ? 'No groups match your filters' : 'No permission groups found'}
        emptyDescription={searchTerm || categoryFilter !== 'all' ? 'Try adjusting your search or filters' : 'Create groups to organize permissions'}
        emptyIcon={<Layers className="h-12 w-12" />}
        emptyAction={
          onCreate && !searchTerm && categoryFilter === 'all' && (
            <Button onClick={onCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Create Group
            </Button>
          )
        }
      />
      
      {filteredGroups.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Showing {filteredGroups.length} of {groups.length} group
          {groups.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}

export default PermissionGroupList;
