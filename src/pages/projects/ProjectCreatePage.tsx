import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from '@/components/common';
import { ProjectForm } from '@/components/features/projects';
import { projectService } from '@/services';
import { ROUTES } from '@/utils/routes';
import type { ProjectFormData } from '@/types/project.types';
import '@/styles/pages/ProjectCreatePage.css';

export const ProjectCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: ProjectFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await projectService.createProject({
        project_name: formData.project_name,
        project_description: formData.project_description,
      });

      if (response.success) {
        // Navigate back to project list with success toast
        navigate(ROUTES.PROJECTS, { 
          state: { 
            message: 'Project created successfully!',
            type: 'success'
          }
        });
      } else {
        setError(response.message || 'Failed to create project');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(ROUTES.PROJECTS);
  };

  return (
    <div className="project-create-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Create New Project</h1>
          <p>Set up a new project for your team</p>
        </div>
        <div className="header-actions">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      </div>

      <Card className="content-card">
        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        <ProjectForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
          mode="create"
        />
      </Card>
    </div>
  );
}; 