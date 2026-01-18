import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PageContainer,
  PageHeader,
  Button,
  DataView,
  DataViewCard,
  Badge,
  Pagination,
  ErrorState
} from '@/components/common';
import type { DataViewColumn } from '@/components/common';
import { ProjectActionsMenu } from '@/components/features/projects/ProjectActionsMenu';
import { ProjectFormModal } from '@/components/features/projects/ProjectFormModal';
import { useProjects } from '@/hooks';
import { FolderKanban, Plus } from 'lucide-react';
import { formatDate, formatCount } from '@/utils/component-utils';
import type { ProjectDetails } from '@/types/project.types';
import { ROUTES } from '@/utils/routes';

export const ProjectListPage: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectDetails | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const {
    projects,
    pagination,
    isLoading,
    error,
    fetchProjects,
    setFilters,
    setPage,
    setSort,
    filters,
  } = useProjects();

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setFilters({ ...filters, search: query || undefined });
  };

  const handlePageChange = (page: number) => {
    setPage(page);
  };

  const handleSortChange = (sortField: string, sortDirection: 'asc' | 'desc') => {
    setSort(sortField, sortDirection);
  };

  const handleCreateClick = () => {
    setShowCreateModal(true);
  };

  const handleEditProject = (project: ProjectDetails) => {
    setSelectedProject(project);
    setShowEditModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedProject(null);
  };

  const handleProjectSuccess = () => {
    fetchProjects();
  };

  const handleProjectDelete = () => {
    fetchProjects();
  };

  const handleProjectArchive = () => {
    fetchProjects();
  };

  const handleViewDetails = useCallback((project: ProjectDetails) => {
    navigate(`${ROUTES.PROJECTS_DETAILS}/${project.project_hash}`);
  }, [navigate]);

  const handleCardActionInteraction = useCallback((event: React.SyntheticEvent) => {
    event.stopPropagation();
  }, []);

  const formatCreatedDate = useCallback((createdAt?: string) => {
    if (!createdAt) return '—';
    const parsed = new Date(createdAt);
    if (Number.isNaN(parsed.getTime())) return '—';
    return formatDate(createdAt);
  }, []);

  const formatAccessLabel = useCallback((accessLevel?: string) => {
    if (!accessLevel) return '';
    return accessLevel.replace(/[_-]/g, ' ').toUpperCase();
  }, []);

  // Define columns for DataView
  const columns: DataViewColumn<ProjectDetails>[] = useMemo(() => [
    {
      key: 'project_name',
      header: 'Project Name',
      sortable: true,
      render: (_value: any, project: ProjectDetails) => (
        <div className="flex flex-col gap-1 min-w-0">
          <button
            type="button"
            onClick={() => handleViewDetails(project)}
            className="text-sm font-medium text-primary hover:underline text-left truncate"
            title={project.project_name}
            aria-label={`View details for ${project.project_name}`}
          >
            {project.project_name}
          </button>
          {project.project_description ? (
            <span className="text-xs text-muted-foreground line-clamp-1">
              {project.project_description}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">No description</span>
          )}
        </div>
      ),
    },
    {
      key: 'member_count',
      header: 'Members',
      sortable: true,
      align: 'center',
      width: '120px',
      render: (_value: any, project: ProjectDetails) => {
        const memberCount = project.member_count;
        return (
          <Badge variant="secondary">
            {typeof memberCount === 'number' ? formatCount(memberCount, 'member') : '—'}
          </Badge>
        );
      },
    },
    {
      key: 'is_active',
      header: 'Status',
      sortable: true,
      width: '160px',
      render: (_value: any, project: ProjectDetails) => {
        const isActive = typeof project.is_active === 'boolean' ? project.is_active : null;
        const statusLabel = isActive === null ? 'Unknown' : (isActive ? 'Active' : 'Inactive');
        const statusVariant = isActive === null ? 'secondary' : (isActive ? 'success' : 'error');
        const accessLabel = formatAccessLabel(project.access_level);
        return (
          <div className="flex items-center justify-center gap-2">
            <Badge variant={statusVariant}>{statusLabel}</Badge>
            {accessLabel && (
              <Badge variant="info">{accessLabel}</Badge>
            )}
          </div>
        );
      },
    },
    {
      key: 'created_at',
      header: 'Created',
      sortable: true,
      width: '180px',
      render: (_value: any, project: ProjectDetails) => (
        <span className="text-sm text-muted-foreground">
          {formatCreatedDate(project.created_at)}
        </span>
      ),
    },
    {
      key: 'project_hash',
      header: 'Actions',
      sortable: false,
      width: '80px',
      align: 'center',
      render: (_value: any, project: ProjectDetails) => (
        <ProjectActionsMenu
          project={project}
          onEdit={handleEditProject}
          onDelete={handleProjectDelete}
          onArchive={handleProjectArchive}
        />
      ),
    },
  ], [handleEditProject, handleProjectDelete, handleProjectArchive, handleViewDetails, formatAccessLabel, formatCreatedDate]);

  // Render card for grid view
  const renderCard = useCallback((project: ProjectDetails) => (
    <DataViewCard
      title={project.project_name}
      description={project.project_description}
      icon={<FolderKanban size={24} />}
      badges={[
        <Badge
          key="status"
          variant={project.is_active === undefined ? 'secondary' : (project.is_active ? 'success' : 'error')}
        >
          {project.is_active === undefined ? 'Unknown' : (project.is_active ? 'Active' : 'Inactive')}
        </Badge>,
        ...(project.access_level ? [
          <Badge key="access" variant="info">
            {formatAccessLabel(project.access_level)}
          </Badge>
        ] : [])
      ]}
      stats={[
        {
          label: 'Members',
          value: (
            <Badge variant="secondary">
              {typeof project.member_count === 'number' ? formatCount(project.member_count, 'member') : '—'}
            </Badge>
          )
        },
        {
          label: 'Created',
          value: formatCreatedDate(project.created_at)
        }
      ]}
      onClick={() => handleViewDetails(project)}
      actions={
        <div onClick={handleCardActionInteraction} onKeyDown={handleCardActionInteraction}>
          <ProjectActionsMenu
            project={project}
            onEdit={handleEditProject}
            onDelete={handleProjectDelete}
            onArchive={handleProjectArchive}
          />
        </div>
      }
    />
  ), [
    formatAccessLabel,
    formatCreatedDate,
    handleCardActionInteraction,
    handleEditProject,
    handleProjectArchive,
    handleProjectDelete,
    handleViewDetails
  ]);

  return (
    <PageContainer>
      <PageHeader
        title="Project Management"
        subtitle="Manage and organize your projects"
        icon={<FolderKanban size={28} />}
        actions={
          <Button 
            variant="primary"
            size="md"
            leftIcon={<Plus size={16} />}
            onClick={handleCreateClick}
            aria-label="Create a new project"
          >
            Create Project
          </Button>
        }
      />

      {/* Error State */}
      {error ? (
        <ErrorState
          icon={<FolderKanban size={24} />}
          title="Failed to load projects"
          message={error}
          onRetry={fetchProjects}
          retryLabel="Try Again"
          variant="card"
          size="md"
        />
      ) : (
        /* Data View - Unified Table and Grid with Integrated Toolbar */
        <DataView<ProjectDetails>
          data={projects}
          columns={columns}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          showViewToggle={true}
          showSearch={true}
          searchValue={searchQuery}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Search projects by name or description..."
          renderCard={renderCard}
          gridColumns={{
            mobile: 1,
            tablet: 2,
            desktop: 3
          }}
          onSort={(key, direction) => handleSortChange(key as string, direction)}
          isLoading={isLoading}
          emptyMessage={searchQuery ? 'No projects match your search criteria' : 'No projects found'}
          emptyIcon={<FolderKanban size={32} />}
          emptyAction={
            <Button
              variant="primary"
              leftIcon={<Plus size={16} />}
              onClick={handleCreateClick}
              aria-label="Create your first project"
            >
              Create Your First Project
            </Button>
          }
          skeletonRows={8}
        />
      )}

      {/* Pagination */}
      {pagination && pagination.total > pagination.limit && !error && (
        <div className="pagination-section">
          <div className="pagination-info">
            <span>Showing {projects.length} of {pagination.total} projects</span>
          </div>
          <Pagination
            currentPage={Math.floor(pagination.offset / pagination.limit) + 1}
            totalPages={Math.ceil(pagination.total / pagination.limit)}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Create Project Modal */}
      <ProjectFormModal
        isOpen={showCreateModal}
        onClose={handleCloseCreateModal}
        onSuccess={handleProjectSuccess}
        mode="create"
      />

      {/* Edit Project Modal */}
      <ProjectFormModal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        onSuccess={handleProjectSuccess}
        mode="edit"
        project={selectedProject}
      />
    </PageContainer>
  );
}; 