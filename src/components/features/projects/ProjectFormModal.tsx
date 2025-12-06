import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Textarea } from '@/components/common';
import { FormField } from '@/components/forms';
import { projectService } from '@/services';
import { useToast } from '@/hooks';
import type { ProjectFormData, ProjectFormErrors, ProjectDetails } from '@/types/project.types';

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: 'create' | 'edit';
  project?: ProjectDetails | null;
}

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  mode,
  project,
}) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState<ProjectFormData>({
    project_name: '',
    project_description: '',
  });
  const [errors, setErrors] = useState<ProjectFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens/closes or mode changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && project) {
        setFormData({
          project_name: project.project_name || '',
          project_description: project.project_description || '',
        });
      } else {
        setFormData({
          project_name: '',
          project_description: '',
        });
      }
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen, mode, project]);

  const validateForm = (): boolean => {
    const newErrors: ProjectFormErrors = {};

    // Validate project name
    if (!formData.project_name.trim()) {
      newErrors.project_name = 'Project name is required';
    } else if (formData.project_name.trim().length < 3) {
      newErrors.project_name = 'Project name must be at least 3 characters';
    } else if (formData.project_name.trim().length > 100) {
      newErrors.project_name = 'Project name must be less than 100 characters';
    }

    // Validate project description (optional but has constraints if provided)
    if (formData.project_description && formData.project_description.length > 500) {
      newErrors.project_description = 'Project description must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof ProjectFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData(prev => ({
        ...prev,
        [field]: e.target.value,
      }));

      // Clear error when user starts typing
      if (errors[field]) {
        setErrors(prev => ({
          ...prev,
          [field]: undefined,
        }));
      }
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const projectData = {
        project_name: formData.project_name.trim(),
        project_description: formData.project_description.trim() || '',
      };

      if (mode === 'create') {
        const response = await projectService.createProject(projectData);
        if (response.success) {
          showToast('Project created successfully', 'success');
          onSuccess();
          onClose();
        } else {
          showToast(response.message || 'Failed to create project', 'error');
        }
      } else if (mode === 'edit' && project) {
        const response = await projectService.updateProject(project.project_hash, projectData);
        if (response.success) {
          showToast('Project updated successfully', 'success');
          onSuccess();
          onClose();
        } else {
          showToast(response.message || 'Failed to update project', 'error');
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      showToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={mode === 'create' ? 'Create New Project' : 'Edit Project'}
      size="md"
      closeOnBackdrop={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      <form onSubmit={handleSubmit} className="project-form-modal">
        <div className="modal-form-content">
          <FormField
            label="Project Name"
            htmlFor="project_name"
            error={errors.project_name}
            required
          >
            <Input
              id="project_name"
              type="text"
              value={formData.project_name}
              onChange={handleInputChange('project_name')}
              placeholder="Enter project name"
              disabled={isSubmitting}
              required
              autoFocus
            />
          </FormField>

          <FormField
            label="Project Description"
            htmlFor="project_description"
            error={errors.project_description}
          >
            <Textarea
              id="project_description"
              value={formData.project_description}
              onChange={handleInputChange('project_description')}
              placeholder="Enter project description (optional)"
              disabled={isSubmitting}
              rows={4}
            />
          </FormField>
        </div>

        <div className="modal-form-actions">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {mode === 'create' ? 'Create Project' : 'Update Project'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

