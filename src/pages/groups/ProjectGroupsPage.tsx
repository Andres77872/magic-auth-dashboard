import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Card } from '@/components/common';
import { ProjectGroupTable } from '@/components/features/groups';
import { useProjectGroups } from '@/hooks';
import type { ProjectGroup } from '@/services/project-group.service';

export function ProjectGroupsPage(): React.JSX.Element {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleEditGroup = (group: ProjectGroup) => {
    navigate(`/dashboard/groups/project-groups/${group.group_hash}/edit`);
  };

  const handleViewGroup = (group: ProjectGroup) => {
    navigate(`/dashboard/groups/project-groups/${group.group_hash}`);
  };

  const handleDeleteGroup = async (group: ProjectGroup) => {
    try {
      await deleteProjectGroup(group.group_hash);
      // Refresh the list
      await fetchProjectGroups();
    } catch (error) {
      console.error('Failed to delete project group:', error);
      // Handle error (show toast, etc.)
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    fetchProjectGroups({ search: term, offset: 0 });
  };

  const filteredGroups = projectGroups.filter(group =>
    group.group_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (error) {
    return (
      <div className="page-container">
        <Card className="error-card">
          <h2>Error Loading Project Groups</h2>
          <p>{error}</p>
          <Button onClick={() => fetchProjectGroups()}>
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title-section">
          <h1>Project Groups</h1>
          <p className="page-description">
            Manage permission-based groups that can be assigned to multiple projects.
          </p>
        </div>
        
        <div className="page-actions">
          <Button 
            variant="primary" 
            onClick={handleCreateGroup}
          >
            Create Project Group
          </Button>
        </div>
      </div>

      <div className="page-content">
        <div className="content-toolbar">
          <div className="search-section">
            <Input
              placeholder="Search project groups..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="max-w-300"
            />
          </div>

          <div className="view-controls">
            <button
              className={`view-toggle ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
            >
              Table
            </button>
            <button
              className={`view-toggle ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => setViewMode('cards')}
            >
              Cards
            </button>
          </div>
        </div>

        <div className="content-main">
          {viewMode === 'table' ? (
            <ProjectGroupTable
              projectGroups={filteredGroups}
              isLoading={isLoading}
              onEdit={handleEditGroup}
              onDelete={handleDeleteGroup}
              onView={handleViewGroup}
            />
          ) : (
            <div className="project-groups-grid">
              {filteredGroups.map(group => (
                <ProjectGroupCard
                  key={group.group_hash}
                  group={group}
                  onEdit={handleEditGroup}
                  onDelete={handleDeleteGroup}
                  onView={handleViewGroup}
                />
              ))}
            </div>
          )}
        </div>

        {pagination && pagination.total > pagination.limit && (
          <div className="content-footer">
            <div className="pagination-info">
              Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} project groups
            </div>
            {/* Add pagination component here if needed */}
          </div>
        )}
      </div>
    </div>
  );
}

// Project Group Card component for grid view
interface ProjectGroupCardProps {
  group: ProjectGroup;
  onEdit: (group: ProjectGroup) => void;
  onDelete: (group: ProjectGroup) => void;
  onView: (group: ProjectGroup) => void;
}

function ProjectGroupCard({ group, onEdit, onDelete, onView }: ProjectGroupCardProps) {
  return (
    <Card className="project-group-card">
      <div className="card-header">
        <h3 
          className="group-name cursor-pointer"
          onClick={() => onView(group)}
        >
          {group.group_name}
        </h3>
        <div className="card-actions">
          <Button size="small" variant="outline" onClick={() => onEdit(group)}>
            Edit
          </Button>
        </div>
      </div>
      
      <div className="card-content">
        {group.description && (
          <p className="group-description">{group.description}</p>
        )}
        
        <div className="group-stats">
          <div className="stat">
            <span className="stat-label">Permissions:</span>
            <span className="stat-value">{group.permissions.length}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Projects:</span>
            <span className="stat-value">{group.project_count}</span>
          </div>
        </div>
      </div>
      
      <div className="card-footer">
        <small className="text-muted">
          Created {new Date(group.created_at).toLocaleDateString()}
        </small>
        <Button 
          size="small" 
          variant="outline" 
          onClick={() => onDelete(group)}
          className="text-error"
        >
          Delete
        </Button>
      </div>
    </Card>
  );
}

export default ProjectGroupsPage; 