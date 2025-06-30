import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from '@/components/common';
import { ProjectGroupForm } from '@/components/features/groups';
import { useProjectGroups } from '@/hooks';
import type { CreateProjectGroupRequest } from '@/services/project-group.service';

export function ProjectGroupCreatePage(): React.JSX.Element {
  const navigate = useNavigate();
  const { createProjectGroup } = useProjectGroups();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (data: CreateProjectGroupRequest) => {
    setIsLoading(true);
    try {
      await createProjectGroup(data);
      navigate('/dashboard/groups/project-groups');
    } catch (error) {
      console.error('Failed to create project group:', error);
      // Handle error (show toast, etc.)
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard/groups/project-groups');
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title-section">
          <h1>Create Project Group</h1>
          <p className="page-description">
            Create a new permission-based group that can be assigned to multiple projects.
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
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        </Card>
      </div>
    </div>
  );
}

export default ProjectGroupCreatePage; 