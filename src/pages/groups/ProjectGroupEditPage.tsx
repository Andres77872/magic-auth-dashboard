import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Button, LoadingSpinner } from '@/components/common';
import { ProjectGroupForm } from '@/components/features/groups';
import { useProjectGroups } from '@/hooks';
import { projectGroupService } from '@/services';
import type { CreateProjectGroupRequest, ProjectGroup } from '@/services/project-group.service';

export function ProjectGroupEditPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { groupHash } = useParams<{ groupHash: string }>();
  const { updateProjectGroup } = useProjectGroups();
  
  const [group, setGroup] = useState<ProjectGroup | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGroup, setIsLoadingGroup] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroup = async () => {
      if (!groupHash) {
        setError('Group hash is required');
        setIsLoadingGroup(false);
        return;
      }

      try {
        setIsLoadingGroup(true);
        const response = await projectGroupService.getProjectGroup(groupHash);
        if (response.success && response.project_group) {
          setGroup(response.project_group);
        } else {
          setError('Failed to load project group');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load project group');
      } finally {
        setIsLoadingGroup(false);
      }
    };

    fetchGroup();
  }, [groupHash]);

  const handleSubmit = async (data: CreateProjectGroupRequest) => {
    if (!group) return;

    setIsLoading(true);
    try {
      await updateProjectGroup(group.group_hash, data);
      navigate('/dashboard/groups/project-groups');
    } catch (error) {
      console.error('Failed to update project group:', error);
      // Handle error (show toast, etc.)
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard/groups/project-groups');
  };

  if (isLoadingGroup) {
    return (
      <div className="page-container">
        <div className="page-content">
          <Card className="loading-card">
            <LoadingSpinner size="md" message="Loading project group..." />
          </Card>
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="page-container">
        <div className="page-content">
          <Card className="error-card">
            <h2>Error Loading Project Group</h2>
            <p>{error || 'Project group not found'}</p>
            <Button onClick={() => navigate('/dashboard/groups/project-groups')}>
              Back to Project Groups
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title-section">
          <h1>Edit Project Group</h1>
          <p className="page-description">
            Update the details and permissions for "{group.group_name}".
          </p>
        </div>
        
        <div className="page-actions">
          <Button 
            variant="outline" 
            onClick={handleCancel}
          >
            Cancel
          </Button>
        </div>
      </div>

      <div className="page-content">
        <Card className="form-card">
          <ProjectGroupForm
            group={group}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        </Card>
      </div>
    </div>
  );
}

export default ProjectGroupEditPage; 