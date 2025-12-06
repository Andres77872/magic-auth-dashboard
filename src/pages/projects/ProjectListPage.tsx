import React, { useState, useCallback, useMemo } from 'react';
import { 
  PageContainer,
  PageHeader,
  Button,
  DataView,
  DataViewCard,
  Badge,
  Pagination
} from '@/components/common';
import type { DataViewColumn } from '@/components/common';
import { ProjectActionsMenu } from '@/components/features/projects/ProjectActionsMenu';
import { ProjectFormModal } from '@/components/features/projects/ProjectFormModal';
import { useProjects } from '@/hooks';
import { ProjectIcon, PlusIcon } from '@/components/icons';
import { formatDate, formatCount } from '@/utils/component-utils';
import type { ProjectDetails } from '@/types/project.types';

export const ProjectListPage: React.FC = () => {
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
    // Sort handling - triggers a refetch through the filters
    console.log('Sort changed:', sortField, sortDirection);
    fetchProjects();
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

  // Define columns for DataView
  const columns: DataViewColumn<ProjectDetails>[] = useMemo(() => [
    {
      key: 'project_name',
      header: 'Project Name',
      sortable: true,
      render: (_value: any, project: ProjectDetails) => (
        <div className="project-name-cell">
          <div className="project-name">{project.project_name}</div>
          {project.project_description && (
            <div className="project-description">{project.project_description}</div>
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
      render: (_value: any, project: ProjectDetails) => (
        <Badge variant="secondary">
          {formatCount(project.member_count || 0, 'member')}
        </Badge>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      sortable: true,
      width: '120px',
      render: (_value: any, project: ProjectDetails) => (
        <Badge variant={project.is_active ? 'success' : 'error'}>
          {project.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      sortable: true,
      width: '180px',
      render: (_value: any, project: ProjectDetails) => formatDate(project.created_at),
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
  ], [handleEditProject, handleProjectDelete, handleProjectArchive]);

  // Render card for grid view
  const renderCard = useCallback((project: ProjectDetails) => (
    <DataViewCard
      title={project.project_name}
      description={project.project_description}
      icon={<ProjectIcon size={24} />}
      badges={[
        <Badge key="status" variant={project.is_active ? 'success' : 'error'}>
          {project.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ]}
      stats={[
        {
          label: 'Members',
          value: <Badge variant="secondary">{formatCount(project.member_count || 0, 'member')}</Badge>
        },
        {
          label: 'Created',
          value: formatDate(project.created_at)
        }
      ]}
      actions={
        <ProjectActionsMenu
          project={project}
          onEdit={handleEditProject}
          onDelete={handleProjectDelete}
          onArchive={handleProjectArchive}
        />
      }
    />
  ), [handleEditProject, handleProjectDelete, handleProjectArchive]);

  return (
    <PageContainer>
      <PageHeader
        title="Project Management"
        subtitle="Manage and organize your projects"
        icon={<ProjectIcon size={28} />}
        actions={
          <Button 
            variant="primary"
            size="md"
            leftIcon={<PlusIcon size={16} />}
            onClick={handleCreateClick}
            aria-label="Create a new project"
          >
            Create Project
          </Button>
        }
      />

      {/* Error State */}
      {error ? (
        <div className="data-view-error">
          <div className="error-content">
            <ProjectIcon size={32} />
            <h3>Failed to load projects</h3>
            <p>{error}</p>
            <Button onClick={fetchProjects} variant="primary">
              Try Again
            </Button>
          </div>
        </div>
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
          emptyIcon={<ProjectIcon size={32} />}
          emptyAction={
            <Button
              variant="primary"
              leftIcon={<PlusIcon size={16} />}
              onClick={handleCreateClick}
              aria-label="Create your first project"
            >
              Create Your First Project
            </Button>
          }
          skeletonRows={8}
          className="projects-data-view"
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