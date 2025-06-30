import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, LoadingSpinner, Card } from '@/components/common';
import { ProjectTable, ProjectCard, ProjectFilter } from '@/components/features/projects';
import { useProjects } from '@/hooks';
import { ROUTES } from '@/utils/routes';
import './ProjectListPage.css';

export const ProjectListPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
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

  if (error) {
    return (
      <div className="project-list-page">
        <div className="error-container">
          <Card>
            <h2>Error Loading Projects</h2>
            <p>{error}</p>
            <Button onClick={fetchProjects}>Retry</Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="project-list-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Project Management</h1>
          <p>Manage and organize your projects</p>
        </div>
        <div className="header-actions">
          <Link to={ROUTES.PROJECTS_CREATE}>
            <Button>Create Project</Button>
          </Link>
        </div>
      </div>

      <Card className="content-card">
        <div className="filters-section">
          <ProjectFilter
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        </div>

        <div className="view-controls">
          <div className="view-switcher">
            <Button
              variant={viewMode === 'list' ? 'primary' : 'outline'}
              size="small"
              onClick={() => setViewMode('list')}
            >
              List View
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'outline'}
              size="small"
              onClick={() => setViewMode('grid')}
            >
              Grid View
            </Button>
          </div>
        </div>

        <div className="projects-content">
          {isLoading ? (
            <div className="loading-container">
              <LoadingSpinner />
            </div>
          ) : projects.length === 0 ? (
            <div className="empty-state">
              <h3>No Projects Found</h3>
              <p>
                {filters.search
                  ? 'No projects match your search criteria.'
                  : 'You haven\'t created any projects yet.'}
              </p>
              <Link to={ROUTES.PROJECTS_CREATE}>
                <Button>Create Your First Project</Button>
              </Link>
            </div>
          ) : viewMode === 'list' ? (
            <ProjectTable
              projects={projects}
              pagination={pagination}
              onPageChange={handlePageChange}
              onSort={handleSortChange}
              sortBy={sortBy}
              sortOrder={sortOrder}
            />
          ) : (
            <ProjectCard
              projects={projects}
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </Card>
    </div>
  );
}; 