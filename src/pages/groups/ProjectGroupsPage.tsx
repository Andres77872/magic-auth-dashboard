import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PageContainer,
  PageHeader,
  Button,
  DataView,
  DataViewCard,
  Badge,
  ErrorState,
  Pagination
} from '@/components/common';
import type { DataViewColumn } from '@/components/common';
import { ProjectGroupActionsMenu } from '@/components/features/groups/ProjectGroupActionsMenu';
import { useProjectGroups } from '@/hooks';
import { FolderOpen, Plus } from 'lucide-react';
import { formatDate } from '@/utils/component-utils';
import type { ProjectGroup } from '@/services/project-group.service';

export function ProjectGroupsPage(): React.JSX.Element {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const {
    projectGroups,
    pagination,
    isLoading,
    error,
    fetchProjectGroups,
    deleteProjectGroup
  } = useProjectGroups();

  const handleCreateGroup = () => {
    navigate('/dashboard/groups/project-groups/create');
  };

  const handleEditGroup = useCallback((group: ProjectGroup) => {
    navigate(`/dashboard/groups/project-groups/${group.group_hash}/edit`);
  }, [navigate]);

  const handleViewGroup = useCallback((group: ProjectGroup) => {
    navigate(`/dashboard/groups/project-groups/${group.group_hash}`);
  }, [navigate]);

  const handleDeleteGroup = useCallback(async (group: ProjectGroup) => {
    try {
      await deleteProjectGroup(group.group_hash);
      await fetchProjectGroups();
    } catch (err) {
      console.error('Failed to delete project group:', err);
    }
  }, [deleteProjectGroup, fetchProjectGroups]);

  const handleSearch = useCallback((term: string) => {
    fetchProjectGroups({ search: term, offset: 0 });
  }, [fetchProjectGroups]);

  const handleSort = useCallback((key: keyof ProjectGroup, direction: 'asc' | 'desc') => {
    fetchProjectGroups({ sort_by: key as string, sort_order: direction });
  }, [fetchProjectGroups]);

  const handlePageChange = useCallback((page: number) => {
    const offset = (page - 1) * (pagination?.limit || 20);
    fetchProjectGroups({ offset });
  }, [pagination?.limit, fetchProjectGroups]);

  const columns: DataViewColumn<ProjectGroup>[] = useMemo(() => [
    {
      key: 'group_name',
      header: 'Group Name',
      sortable: true,
      render: (_value, group) => (
        <div className="space-y-0.5">
          <button 
            onClick={() => handleViewGroup(group)}
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
      render: (_value, group) => (
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
      render: (_value, group) => (
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
      render: (_value, group) => (
        <ProjectGroupActionsMenu
          group={group}
          onEdit={handleEditGroup}
          onDelete={handleDeleteGroup}
          onView={handleViewGroup}
        />
      ),
    },
  ], [handleEditGroup, handleDeleteGroup, handleViewGroup]);

  const renderCard = useCallback((group: ProjectGroup) => (
    <DataViewCard
      title={group.group_name}
      description={group.description}
      icon={<FolderOpen size={20} />}
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
          onEdit={handleEditGroup}
          onDelete={handleDeleteGroup}
          onView={handleViewGroup}
        />
      }
      onClick={() => handleViewGroup(group)}
    />
  ), [handleEditGroup, handleDeleteGroup, handleViewGroup]);

  const currentPage = Math.floor((pagination?.offset || 0) / (pagination?.limit || 20)) + 1;
  const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 0;

  if (error) {
    return (
      <PageContainer>
        <ErrorState
          icon={<FolderOpen size={24} />}
          title="Failed to load project groups"
          message={error}
          onRetry={() => fetchProjectGroups()}
          retryLabel="Try Again"
          variant="card"
          size="md"
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Project Groups"
        subtitle="Manage permission-based groups that can be assigned to multiple projects"
        icon={<FolderOpen size={28} />}
        actions={
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus size={16} />}
            onClick={handleCreateGroup}
          >
            Create Project Group
          </Button>
        }
      />

      <DataView<ProjectGroup>
        data={projectGroups}
        columns={columns}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showViewToggle={true}
        showSearch={true}
        onSearchChange={handleSearch}
        searchPlaceholder="Search project groups..."
        renderCard={renderCard}
        gridColumns={{
          mobile: 1,
          tablet: 2,
          desktop: 3
        }}
        onSort={handleSort}
        isLoading={isLoading}
        emptyMessage="No project groups found"
        emptyIcon={<FolderOpen size={32} />}
        emptyAction={
          <Button
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={handleCreateGroup}
          >
            Create Your First Project Group
          </Button>
        }
        skeletonRows={6}
      />

      {pagination && pagination.total > pagination.limit && (
        <div className="mt-6 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Showing {projectGroups.length} of {pagination.total} project groups
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
    </PageContainer>
  );
}

export default ProjectGroupsPage; 