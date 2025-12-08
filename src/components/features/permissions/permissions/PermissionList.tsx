import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Shield, Plus, Search, LayoutGrid, List } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PermissionCard } from './PermissionCard';
import type { GlobalPermission } from '@/types/global-roles.types';

type ViewMode = 'grid' | 'list';

interface PermissionListProps {
  permissions: GlobalPermission[];
  loading?: boolean;
  categories?: string[];
  onEdit?: (permission: GlobalPermission) => void;
  onDelete?: (permission: GlobalPermission) => void;
  onCreate?: () => void;
}

export function PermissionList({
  permissions,
  loading = false,
  categories = [],
  onEdit,
  onDelete,
  onCreate
}: PermissionListProps): React.JSX.Element {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

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
              placeholder="Search permissions..."
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
              New Permission
            </Button>
          )}
        </div>
      </div>

      {filteredPermissions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">
              {searchTerm || categoryFilter !== 'all' ? 'No permissions match your filters' : 'No permissions found'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm || categoryFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first permission to get started'}
            </p>
            {onCreate && !searchTerm && categoryFilter === 'all' && (
              <Button className="mt-4" onClick={onCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Create Permission
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
          {filteredPermissions.map((permission) => (
            <PermissionCard
              key={permission.permission_hash}
              permission={permission}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

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
