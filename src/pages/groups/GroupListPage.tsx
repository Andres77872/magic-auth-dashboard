import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  PageContainer,
  PageHeader,
  FilterBar,
  Button,
  Pagination,
  ConfirmDialog,
  DataView,
  DataViewCard,
  Badge,
  ErrorState,
  TabNavigation,
  type Tab
} from '@/components/common';
import type { Filter, DataViewColumn } from '@/components/common';
import { useGroups, useProjectGroups } from '@/hooks';
import { GroupActionsMenu } from '@/components/features/groups/GroupActionsMenu';
import { ProjectGroupActionsMenu } from '@/components/features/groups/ProjectGroupActionsMenu';
import { GroupFormModal } from '@/components/features/groups/GroupFormModal';
import { Users, Plus, FolderTree, ArrowRight, FolderOpen, Info } from 'lucide-react';
import { useToast } from '@/hooks';
import { formatDate, formatCount } from '@/utils/component-utils';
import type { GroupListParams, UserGroup, GroupFormData } from '@/types/group.types';
import type { ProjectGroup } from '@/services/project-group.service';
import { Card, CardContent } from '@/components/ui/card';

type GroupTabType = 'user-groups' | 'project-groups';

export const GroupListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  
  // Get active tab from URL, default to 'user-groups'
  const activeTab = (searchParams.get('tab') as GroupTabType) || 'user-groups';
  
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [projectGroupViewMode, setProjectGroupViewMode] = useState<'table' | 'grid'>('table');
  
  // User Groups hook
  const { 
    groups, 
    pagination, 
    isLoading, 
    error, 
    filters,
    fetchGroups,
    setFilters,
    createGroup,
    updateGroup,
    deleteGroup
  } = useGroups();
  
  // Project Groups hook
  const {
    projectGroups,
    pagination: projectGroupsPagination,
    isLoading: isLoadingProjectGroups,
    error: projectGroupsError,
    fetchProjectGroups,
    deleteProjectGroup
  } = useProjectGroups();

  // Tab change handler
  const handleTabChange = useCallback((tabId: string) => {
    setSearchParams({ tab: tabId });
  }, [setSearchParams]);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<UserGroup | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handlePageChange = useCallback((page: number) => {
    const offset = (page - 1) * (filters.limit || 20);
    setFilters({ offset });
    fetchGroups({ offset });
  }, [filters.limit, setFilters, fetchGroups]);

  const handleSort = useCallback((field: keyof UserGroup, direction: 'asc' | 'desc') => {
    setFilters({ sort_by: field as string, sort_order: direction });
    fetchGroups({ sort_by: field as string, sort_order: direction });
  }, [setFilters, fetchGroups]);

  const handleFiltersChange = useCallback((newFilters: Partial<GroupListParams>) => {
    setFilters(newFilters);
    fetchGroups(newFilters);
  }, [setFilters, fetchGroups]);

  const handleClearFilters = useCallback(() => {
    const clearedFilters = {
      search: '',
      offset: 0
    };
    setFilters(clearedFilters);
    fetchGroups(clearedFilters);
  }, [setFilters, fetchGroups]);

  // Create group handlers
  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleCreateSubmit = async (data: GroupFormData) => {
    try {
      await createGroup(data);
      showToast(`Group "${data.group_name}" created successfully`, 'success');
      handleCloseCreateModal();
      fetchGroups(); // Refresh the list
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to create group', 'error');
      throw error;
    }
  };

  // Edit group handlers
  const handleEdit = (group: UserGroup) => {
    setSelectedGroup(group);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedGroup(null);
  };

  const handleEditSubmit = async (data: GroupFormData) => {
    if (!selectedGroup) return;
    
    try {
      await updateGroup(selectedGroup.group_hash, data);
      showToast(`Group "${data.group_name}" updated successfully`, 'success');
      handleCloseEditModal();
      fetchGroups(); // Refresh the list
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to update group', 'error');
      throw error;
    }
  };

  // Delete group handlers
  const handleDelete = (group: UserGroup) => {
    setGroupToDelete(group);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setGroupToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!groupToDelete) return;

    setIsDeleting(true);
    try {
      await deleteGroup(groupToDelete.group_hash);
      showToast(`Group "${groupToDelete.group_name}" deleted successfully`, 'success');
      handleCloseDeleteDialog();
      fetchGroups(); // Refresh the list
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to delete group', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // View group details
  const handleView = (group: UserGroup) => {
    navigate(`/dashboard/groups/${group.group_hash}`);
  };

  // Project Group handlers
  const handleCreateProjectGroup = () => {
    navigate('/dashboard/groups/project-groups/create');
  };

  const handleEditProjectGroup = useCallback((group: ProjectGroup) => {
    navigate(`/dashboard/groups/project-groups/${group.group_hash}/edit`);
  }, [navigate]);

  const handleViewProjectGroup = useCallback((group: ProjectGroup) => {
    navigate(`/dashboard/groups/project-groups/${group.group_hash}`);
  }, [navigate]);

  const handleDeleteProjectGroup = useCallback(async (group: ProjectGroup) => {
    try {
      await deleteProjectGroup(group.group_hash);
      showToast(`Project group "${group.group_name}" deleted successfully`, 'success');
      await fetchProjectGroups();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete project group', 'error');
    }
  }, [deleteProjectGroup, fetchProjectGroups, showToast]);

  const handleSearchProjectGroups = useCallback((term: string) => {
    fetchProjectGroups({ search: term, offset: 0 });
  }, [fetchProjectGroups]);

  const handleSortProjectGroups = useCallback((key: keyof ProjectGroup, direction: 'asc' | 'desc') => {
    fetchProjectGroups({ sort_by: key as string, sort_order: direction });
  }, [fetchProjectGroups]);

  const handleProjectGroupPageChange = useCallback((page: number) => {
    const offset = (page - 1) * (projectGroupsPagination?.limit || 20);
    fetchProjectGroups({ offset });
  }, [projectGroupsPagination?.limit, fetchProjectGroups]);

  const currentPage = Math.floor((filters.offset || 0) / (filters.limit || 20)) + 1;
  const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 0;
  
  const projectGroupCurrentPage = Math.floor((projectGroupsPagination?.offset || 0) / (projectGroupsPagination?.limit || 20)) + 1;
  const projectGroupTotalPages = projectGroupsPagination ? Math.ceil(projectGroupsPagination.total / projectGroupsPagination.limit) : 0;

  // Tab definitions
  const tabs: Tab[] = useMemo(() => [
    {
      id: 'user-groups',
      label: 'User Groups',
      icon: <Users size={16} />,
      count: pagination?.total,
    },
    {
      id: 'project-groups',
      label: 'Project Groups',
      icon: <FolderTree size={16} />,
      count: projectGroupsPagination?.total,
    },
  ], [pagination?.total, projectGroupsPagination?.total]);

  // Memoize search handler to prevent SearchBar re-renders
  const handleSearch = useCallback((query: string) => {
    handleFiltersChange({ search: query, offset: 0 });
  }, [handleFiltersChange]);

  // Define columns for User Groups DataView
  const columns: DataViewColumn<UserGroup>[] = useMemo(() => [
    {
      key: 'group_name',
      header: 'Group Name',
      sortable: true,
      render: (_value: any, group: UserGroup) => (
        <div className="space-y-0.5">
          <button 
            onClick={() => handleView(group)}
            className="font-medium text-primary hover:underline text-left"
          >
            {group.group_name}
          </button>
          {group.description && (
            <p className="text-sm text-muted-foreground truncate max-w-xs">
              {group.description}
            </p>
          )}
        </div>
      )
    },
    {
      key: 'member_count',
      header: 'Members',
      sortable: true,
      align: 'center',
      width: '150px',
      render: (_value: any, group: UserGroup) => (
        <Badge variant="secondary">
          {formatCount(group.member_count || 0, 'member')}
        </Badge>
      )
    },
    {
      key: 'created_at',
      header: 'Created',
      sortable: true,
      width: '180px',
      render: (_value: any, group: UserGroup) => formatDate(group.created_at)
    },
    {
      key: 'group_hash',
      header: 'Actions',
      width: '80px',
      align: 'center',
      render: (_value: any, group: UserGroup) => (
        <GroupActionsMenu 
          group={group}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
        />
      )
    }
  ], [handleEdit, handleDelete, handleView]);

  // Define columns for Project Groups DataView
  const projectGroupColumns: DataViewColumn<ProjectGroup>[] = useMemo(() => [
    {
      key: 'group_name',
      header: 'Group Name',
      sortable: true,
      render: (_value: any, group: ProjectGroup) => (
        <div className="space-y-0.5">
          <button 
            onClick={() => handleViewProjectGroup(group)}
            className="font-medium text-primary hover:underline text-left"
          >
            {group.group_name}
          </button>
          {group.description && (
            <p className="text-sm text-muted-foreground truncate max-w-xs">
              {group.description}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'project_count',
      header: 'Projects',
      sortable: true,
      align: 'center',
      width: '120px',
      render: (_value: any, group: ProjectGroup) => (
        <Badge variant="info">
          {group.project_count} {group.project_count !== 1 ? 'projects' : 'project'}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      sortable: true,
      width: '140px',
      render: (_value: any, group: ProjectGroup) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(group.created_at)}
        </span>
      ),
    },
    {
      key: 'group_hash',
      header: 'Actions',
      width: '80px',
      align: 'center',
      render: (_value: any, group: ProjectGroup) => (
        <ProjectGroupActionsMenu
          group={group}
          onEdit={handleEditProjectGroup}
          onDelete={handleDeleteProjectGroup}
          onView={handleViewProjectGroup}
        />
      ),
    },
  ], [handleEditProjectGroup, handleDeleteProjectGroup, handleViewProjectGroup]);

  // Render card for User Groups grid view
  const renderCard = useCallback((group: UserGroup) => (
    <DataViewCard
      title={group.group_name}
      description={group.description}
      icon={<Users size={24} />}
      stats={[
        {
          label: 'Members',
          value: <Badge variant="secondary">{formatCount(group.member_count || 0, 'member')}</Badge>
        },
        {
          label: 'Created',
          value: formatDate(group.created_at)
        }
      ]}
      actions={
        <GroupActionsMenu 
          group={group}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
        />
      }
      onClick={() => handleView(group)}
    />
  ), [handleEdit, handleDelete, handleView]);

  // Render card for Project Groups grid view
  const renderProjectGroupCard = useCallback((group: ProjectGroup) => (
    <DataViewCard
      title={group.group_name}
      description={group.description}
      icon={<FolderTree size={24} />}
      stats={[
        {
          label: 'Projects',
          value: <Badge variant="info">{group.project_count}</Badge>
        },
        {
          label: 'Created',
          value: formatDate(group.created_at)
        }
      ]}
      actions={
        <ProjectGroupActionsMenu
          group={group}
          onEdit={handleEditProjectGroup}
          onDelete={handleDeleteProjectGroup}
          onView={handleViewProjectGroup}
        />
      }
      onClick={() => handleViewProjectGroup(group)}
    />
  ), [handleEditProjectGroup, handleDeleteProjectGroup, handleViewProjectGroup]);

  // Memoize sort handler for FilterBar
  const handleSortFilterChange = useCallback((value: string) => {
    const [sort_by, sort_order] = value.split(':');
    handleFiltersChange({ sort_by, sort_order: sort_order as 'asc' | 'desc' });
  }, [handleFiltersChange]);

  // Define filter options for FilterBar - memoize to prevent recreating on every render
  const filterBarFilters: Filter[] = useMemo(() => [
    {
      key: 'sort',
      label: 'Sort by',
      options: [
        { value: 'created_at:desc', label: 'Newest first' },
        { value: 'created_at:asc', label: 'Oldest first' },
        { value: 'group_name:asc', label: 'Name (A-Z)' },
        { value: 'group_name:desc', label: 'Name (Z-A)' },
        { value: 'member_count:desc', label: 'Most members' },
        { value: 'member_count:asc', label: 'Fewest members' }
      ],
      value: `${filters.sort_by}:${filters.sort_order}`,
      onChange: handleSortFilterChange
    }
  ], [filters.sort_by, filters.sort_order, handleSortFilterChange]);

  return (
    <PageContainer>
      <PageHeader
        title="Groups"
        subtitle="Manage user groups and project groups for access control"
        icon={<Users size={28} />}
        actions={
          activeTab === 'user-groups' ? (
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus size={16} />}
              onClick={handleOpenCreateModal}
              aria-label="Create new user group"
            >
              Create User Group
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus size={16} />}
              onClick={handleCreateProjectGroup}
              aria-label="Create new project group"
            >
              Create Project Group
            </Button>
          )
        }
      />

      {/* Architecture Info Banner */}
      <Card className="mb-6 bg-muted/30 border-muted">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Info size={18} className="text-primary mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Access Control Architecture:</strong> Users belong to <strong>User Groups</strong>, which are granted access to <strong>Project Groups</strong>. Projects are assigned to Project Groups to control who can access them.
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-background border">
                  <Users size={14} className="text-primary" />
                  <span>User</span>
                </span>
                <ArrowRight size={14} className="text-muted-foreground" />
                <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-background border">
                  <Users size={14} className="text-primary" />
                  <span>User Group</span>
                </span>
                <ArrowRight size={14} className="text-muted-foreground" />
                <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-background border">
                  <FolderTree size={14} className="text-primary" />
                  <span>Project Group</span>
                </span>
                <ArrowRight size={14} className="text-muted-foreground" />
                <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-background border">
                  <FolderOpen size={14} className="text-primary" />
                  <span>Project</span>
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="mb-6">
        <TabNavigation
          tabs={tabs}
          activeTab={activeTab}
          onChange={handleTabChange}
          size="md"
        />
      </div>

      {/* User Groups Tab Content */}
      {activeTab === 'user-groups' && (
        <>
          {/* Filter Section */}
          <div className="mb-4">
            <FilterBar
              filters={filterBarFilters}
              onClearAll={handleClearFilters}
            />
          </div>

          {/* Error State */}
          {error ? (
            <ErrorState
              icon={<Users size={24} />}
              title="Failed to load user groups"
              message={error}
              onRetry={() => fetchGroups()}
              retryLabel="Try Again"
              variant="card"
              size="md"
            />
          ) : (
            /* Data View - Unified Table and Grid with Integrated Toolbar */
            <DataView<UserGroup>
              data={groups}
              columns={columns}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              showViewToggle={true}
              showSearch={true}
              searchValue={filters.search || ''}
              onSearchChange={handleSearch}
              searchPlaceholder="Search user groups by name or description..."
              renderCard={renderCard}
              gridColumns={{
                mobile: 1,
                tablet: 2,
                desktop: 3
              }}
              onSort={handleSort}
              isLoading={isLoading}
              emptyMessage="No user groups found"
              emptyIcon={<Users size={32} />}
              emptyAction={
                <Button
                  variant="primary"
                  leftIcon={<Plus size={16} />}
                  onClick={handleOpenCreateModal}
                  aria-label="Create your first user group"
                >
                  Create Your First User Group
                </Button>
              }
              skeletonRows={6}
              className=""
            />
          )}

          {/* Pagination */}
          {pagination && pagination.total > pagination.limit && (
            <div className="mt-6 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Showing {groups.length} of {pagination.total} user groups
              </span>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={pagination.total}
                itemsPerPage={pagination.limit}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}

      {/* Project Groups Tab Content */}
      {activeTab === 'project-groups' && (
        <>
          {/* Error State */}
          {projectGroupsError ? (
            <ErrorState
              icon={<FolderTree size={24} />}
              title="Failed to load project groups"
              message={projectGroupsError}
              onRetry={() => fetchProjectGroups()}
              retryLabel="Try Again"
              variant="card"
              size="md"
            />
          ) : (
            <DataView<ProjectGroup>
              data={projectGroups}
              columns={projectGroupColumns}
              viewMode={projectGroupViewMode}
              onViewModeChange={setProjectGroupViewMode}
              showViewToggle={true}
              showSearch={true}
              onSearchChange={handleSearchProjectGroups}
              searchPlaceholder="Search project groups..."
              renderCard={renderProjectGroupCard}
              gridColumns={{
                mobile: 1,
                tablet: 2,
                desktop: 3
              }}
              onSort={handleSortProjectGroups}
              isLoading={isLoadingProjectGroups}
              emptyMessage="No project groups found"
              emptyIcon={<FolderTree size={32} />}
              emptyAction={
                <Button
                  variant="primary"
                  leftIcon={<Plus size={16} />}
                  onClick={handleCreateProjectGroup}
                >
                  Create Your First Project Group
                </Button>
              }
              skeletonRows={6}
            />
          )}

          {/* Pagination */}
          {projectGroupsPagination && projectGroupsPagination.total > projectGroupsPagination.limit && (
            <div className="mt-6 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Showing {projectGroups.length} of {projectGroupsPagination.total} project groups
              </span>
              <Pagination
                currentPage={projectGroupCurrentPage}
                totalPages={projectGroupTotalPages}
                totalItems={projectGroupsPagination.total}
                itemsPerPage={projectGroupsPagination.limit}
                onPageChange={handleProjectGroupPageChange}
              />
            </div>
          )}
        </>
      )}

      {/* Create Group Modal */}
      <GroupFormModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onSubmit={handleCreateSubmit}
        mode="create"
      />

      {/* Edit Group Modal */}
      <GroupFormModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSubmit={handleEditSubmit}
        mode="edit"
        group={selectedGroup}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        title="Delete Group"
        message={`Are you sure you want to delete the group "${groupToDelete?.group_name}"? This action cannot be undone. All user memberships and project access grants for this group will be removed.`}
        confirmText="Delete Group"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </PageContainer>
  );
};
