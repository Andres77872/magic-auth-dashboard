import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/common';
import { MoreHorizontal, Eye, Pencil, Trash2 } from 'lucide-react';
import { usePermissions, useToast } from '@/hooks';
import { ROUTES } from '@/utils/routes';
import { projectService } from '@/services';
import type { ProjectDetails } from '@/types/project.types';

interface ProjectActionsMenuProps {
  project: ProjectDetails;
  onEdit?: (project: ProjectDetails) => void;
  onDelete?: () => void;
}

export const ProjectActionsMenu: React.FC<ProjectActionsMenuProps> = ({
  project,
  onEdit,
  onDelete,
}) => {
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleViewDetails = () => {
    navigate(`${ROUTES.PROJECT}/${project.project_hash}`);
  };

  const handleEditProject = () => {
    if (onEdit) {
      onEdit(project);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await projectService.deleteProject(project.project_hash);

      if (response.success) {
        showToast('Project deleted successfully', 'success');
        setShowDeleteDialog(false);
        if (onDelete) {
          onDelete();
        }
      } else {
        showToast(response.message || 'Failed to delete project', 'error');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred';
      showToast(errorMessage, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const canEdit = hasPermission('projects:edit');
  const canDelete = hasPermission('projects:delete');

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <span className="sr-only">Actions for {project.project_name}</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleViewDetails}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
          {canEdit && (
            <DropdownMenuItem onClick={handleEditProject}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Project
            </DropdownMenuItem>
          )}
          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDeleteClick}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Project
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Project"
        message={`Are you sure you want to delete "${project.project_name}"? This action cannot be undone and will remove all project data, revoke all user group access, and delete all project-related configurations.`}
        confirmText="Delete Project"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
};
