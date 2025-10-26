import React, { useState } from 'react';
import { Button, Card, EmptyState } from '@/components/common';
import { ProjectTable, ProjectCard, ProjectFilter, ProjectFormModal } from '@/components/features/projects';
import { useProjects } from '@/hooks';
import { ProjectIcon, PlusIcon, RefreshIcon } from '@/components/icons';
import type { ProjectDetails } from '@/types/project.types';
import '@/styles/pages/ProjectListPage.css';

export const ProjectListPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectDetails | null>(null);
  
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

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
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

  if (error) {
    return (
      <div className="project-list-page" role="main" aria-labelledby="error-title">
        <div className="error-container">
          <Card>
            <h2 id="error-title" className="text-error">Error Loading Projects</h2>
            <p role="alert" className="text-secondary">{error}</p>
            <Button 
              onClick={fetchProjects}
              leftIcon={<RefreshIcon size={16} aria-hidden="true" />}
              aria-label="Retry loading projects"
            >
              Retry
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="project-list-page" role="main" aria-labelledby="page-title">
      <header className="project-list-page-header">
        <div className="project-list-page-header-content">
          <h1 id="page-title">Project Management</h1>
          <p className="text-secondary">Manage and organize your projects</p>
        </div>
        <div className="project-list-page-header-actions" aria-label="Project actions">
          <Button 
            variant="primary"
            leftIcon={<PlusIcon size={16} aria-hidden="true" />}
            onClick={handleCreateClick}
            aria-label="Create a new project"
          >
            Create Project
          </Button>
        </div>
      </header>

      <Card className="content-card">
        <section className="filters-section" aria-label="Project filters">
          <ProjectFilter
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        </section>

        <div className="view-controls">
          <div className="view-switcher" role="group" aria-label="View mode selection">
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

        <section className="projects-content" aria-label="Projects list" aria-live="polite">
          {!isLoading && projects.length === 0 ? (
            <EmptyState
              icon={<ProjectIcon size="lg" aria-hidden="true" />}
              title="No Projects Found"
              description={
                filters.search
                  ? 'No projects match your search criteria. Try adjusting your filters.'
                  : "You haven't created any projects yet. Get started by creating your first project."
              }
              action={
                <Button 
                  variant="primary"
                  leftIcon={<PlusIcon size={16} aria-hidden="true" />}
                  onClick={handleCreateClick}
                  aria-label="Create your first project"
                >
                  Create Your First Project
                </Button>
              }
            />
          ) : viewMode === 'list' ? (
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
          ) : (
            <ProjectCard
              projects={projects}
              pagination={pagination}
              onPageChange={handlePageChange}
              isLoading={isLoading}
            />
          )}
        </section>
      </Card>

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
    </div>
  );
}; 