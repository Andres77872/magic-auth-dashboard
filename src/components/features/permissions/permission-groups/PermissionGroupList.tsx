import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Layers, Plus, Search, LayoutGrid, List } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PermissionGroupCard } from './PermissionGroupCard';
import type { GlobalPermissionGroup } from '@/types/global-roles.types';

type ViewMode = 'grid' | 'list';

interface PermissionGroupListProps {
  groups: GlobalPermissionGroup[];
  loading?: boolean;
  categories?: string[];
  onEdit?: (group: GlobalPermissionGroup) => void;
  onDelete?: (group: GlobalPermissionGroup) => void;
  onManagePermissions?: (group: GlobalPermissionGroup) => void;
  onCreate?: () => void;
}

export function PermissionGroupList({
  groups,
  loading = false,
  categories = [],
  onEdit,
  onDelete,
  onManagePermissions,
  onCreate
}: PermissionGroupListProps): React.JSX.Element {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

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
              placeholder="Search groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          {allCategories.length > 0 && (
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px]">
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
          )}
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
              New Group
            </Button>
          )}
        </div>
      </div>

      {filteredGroups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Layers className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">
              {searchTerm || categoryFilter !== 'all' ? 'No groups match your filters' : 'No permission groups found'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm || categoryFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create groups to organize permissions'}
            </p>
            {onCreate && !searchTerm && categoryFilter === 'all' && (
              <Button className="mt-4" onClick={onCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Create Group
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
          {filteredGroups.map((group) => (
            <PermissionGroupCard
              key={group.group_hash}
              group={group}
              onEdit={onEdit}
              onDelete={onDelete}
              onManagePermissions={onManagePermissions}
            />
          ))}
        </div>
      )}

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
