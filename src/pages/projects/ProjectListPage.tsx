import React, { useState } from 'react';
import { 
  PageContainer,
  PageHeader,
  SearchBar,
  Button, 
  Card, 
  EmptyState 
} from '@/components/common';
import { ProjectTable, ProjectCard, ProjectFormModal } from '@/components/features/projects';
import { useProjects } from '@/hooks';
import { ProjectIcon, PlusIcon } from '@/components/icons';
import type { ProjectDetails } from '@/types/project.types';

export const ProjectListPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
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
    sortBy,
    sortOrder,
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

      {/* Search Section */}
      <div className="search-filter-section">
        <SearchBar
          onSearch={handleSearchChange}
          placeholder="Search projects by name or description..."
          defaultValue={searchQuery}
        />
        <div className="view-controls">
          <Button
            variant={viewMode === 'list' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            aria-pressed={viewMode === 'list'}
            aria-label="Switch to list view"
          >
            List View
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            aria-pressed={viewMode === 'grid'}
            aria-label="Switch to grid view"
          >
            Grid View
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="error-card" padding="lg">
          <div className="error-content">
            <ProjectIcon size={32} />
            <h3>Failed to load projects</h3>
            <p>{error}</p>
            <Button onClick={fetchProjects} variant="primary">
              Try Again
            </Button>
          </div>
        </Card>
      )}

      {/* Content */}
      {!error && (
        <>
          {!isLoading && projects.length === 0 ? (
            <EmptyState
              icon={<ProjectIcon size={48} />}
              title="No Projects Found"
              description={
                searchQuery
                  ? 'No projects match your search criteria. Try adjusting your search.'
                  : "You haven't created any projects yet. Get started by creating your first project."
              }
              action={
                <Button 
                  variant="primary"
                  leftIcon={<PlusIcon size={16} />}
                  onClick={handleCreateClick}
                  aria-label="Create your first project"
                >
                  Create Your First Project
                </Button>
              }
            />
          ) : viewMode === 'list' ? (
            <Card padding="none">
              <ProjectTable
                projects={projects}
                pagination={pagination}
                onPageChange={handlePageChange}
                onSort={handleSortChange}
                sortBy={sortBy}
                sortOrder={sortOrder}
                isLoading={isLoading}
                onEdit={handleEditProject}
                onDelete={handleProjectDelete}
                onArchive={handleProjectArchive}
              />
            </Card>
          ) : (
            <div className="projects-grid">
              <ProjectCard
                projects={projects}
                pagination={pagination}
                onPageChange={handlePageChange}
                isLoading={isLoading}
              />
            </div>
          )}
        </>
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