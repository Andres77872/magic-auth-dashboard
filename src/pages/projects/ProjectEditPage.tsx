import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, LoadingSpinner, Button } from '@/components/common';
import { ProjectForm } from '@/components/features/projects';
import { projectService } from '@/services';
import { ROUTES } from '@/utils/routes';
import type { ProjectDetails, ProjectFormData } from '@/types/project.types';
import './ProjectCreatePage.css'; // Reuse existing styles

export const ProjectEditPage: React.FC = () => {
  const { projectHash } = useParams<{ projectHash: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectHash) {
      navigate(ROUTES.PROJECTS);
      return;
    }

    const fetchProject = async () => {
      try {
        setIsLoading(true);
        const response = await projectService.getProject(projectHash);
        if (response.success && response.project) {
          // Convert API response to ProjectDetails format
          const projectDetails: ProjectDetails = {
            ...response.project,
            member_count: response.statistics.total_users,
            group_count: response.statistics.total_groups,
            access_level: response.user_access.access_level,
            is_active: true, // Default to active unless specified otherwise
          };
          setProject(projectDetails);
        } else {
          setError('Failed to load project data');
        }
      } catch (err) {
        console.error('Error fetching project:', err);
        setError('Failed to load project. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [projectHash, navigate]);

  const handleSubmit = async (formData: ProjectFormData) => {
    if (!projectHash) return;

    try {
      setIsSubmitting(true);
      const response = await projectService.updateProject(projectHash, formData);
      
      if (response.success) {
        navigate(`${ROUTES.PROJECTS_DETAILS}/${projectHash}`, {
          state: { message: 'Project updated successfully' }
        });
      } else {
        setError('Failed to update project. Please try again.');
      }
    } catch (err) {
      console.error('Error updating project:', err);
      setError('Failed to update project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(ROUTES.PROJECTS);
  };

  if (isLoading) {
    return (
      <div className="project-create-page">
        <div className="loading-container">
          <LoadingSpinner />
          <p>Loading project data...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="project-create-page">
        <Card>
          <div className="error-container">
            <h2>Error</h2>
            <p>{error || 'Project not found'}</p>
            <div className="form-actions">
              <Button onClick={() => navigate(ROUTES.PROJECTS)}>
                Back to Projects
              </Button>
              {projectHash && (
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="project-create-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Edit Project</h1>
          <p>Update project information and settings</p>
        </div>
      </div>

      <Card>
        <ProjectForm
          mode="edit"
          initialData={{
            project_name: project.project_name,
            project_description: project.project_description,
          }}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </Card>
    </div>
  );
}; 