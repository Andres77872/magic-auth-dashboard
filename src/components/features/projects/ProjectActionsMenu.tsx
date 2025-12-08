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
import { MoreHorizontal, Eye, Pencil, Trash2, Archive } from 'lucide-react';
import { usePermissions, useToast } from '@/hooks';
import { ROUTES } from '@/utils/routes';
import { projectService } from '@/services';
import type { ProjectDetails } from '@/types/project.types';

interface ProjectActionsMenuProps {
  project: ProjectDetails;
  onEdit?: (project: ProjectDetails) => void;
  onDelete?: () => void;
  onArchive?: () => void;
}

export const ProjectActionsMenu: React.FC<ProjectActionsMenuProps> = ({
  project,
  onEdit,
  onDelete,
  onArchive,
}) => {
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const handleViewDetails = () => {
    navigate(`${ROUTES.PROJECTS_DETAILS}/${project.project_hash}`);
  };

  const handleEditProject = () => {
    if (onEdit) {
      onEdit(project);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleArchiveClick = () => {
    setShowArchiveDialog(true);
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
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      showToast(errorMessage, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmArchive = async () => {
    try {
      setIsArchiving(true);
      const isCurrentlyActive = project.is_active ?? true;
      const response = await projectService.toggleProjectArchive(
        project.project_hash,
        !isCurrentlyActive
      );
      
      if (response.success) {
        showToast(
          isCurrentlyActive ? 'Project archived successfully' : 'Project unarchived successfully',
          'success'
        );
        setShowArchiveDialog(false);
        if (onArchive) {
          onArchive();
        }
      } else {
        showToast(response.message || 'Failed to update project status', 'error');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      showToast(errorMessage, 'error');
    } finally {
      setIsArchiving(false);
    }
  };

  const canEdit = hasPermission('projects:edit');
  const canDelete = hasPermission('projects:delete');
  const canArchive = hasPermission('projects:archive');
  const isActive = project.is_active ?? true;

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
          {canArchive && (
            <DropdownMenuItem onClick={handleArchiveClick}>
              <Archive className="mr-2 h-4 w-4" />
              {isActive ? 'Archive Project' : 'Unarchive Project'}
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

      {/* Archive/Unarchive Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showArchiveDialog}
        onClose={() => setShowArchiveDialog(false)}
        onConfirm={handleConfirmArchive}
        title={isActive ? 'Archive Project' : 'Unarchive Project'}
        message={
          isActive
            ? `Are you sure you want to archive "${project.project_name}"? Archiving will make the project inactive, hide it from active project lists, and preserve all project data. You can unarchive it later if needed.`
            : `Are you sure you want to unarchive "${project.project_name}"? This will make the project active again and visible in project lists.`
        }
        confirmText={isActive ? 'Archive Project' : 'Unarchive Project'}
        cancelText="Cancel"
        variant={isActive ? 'warning' : 'info'}
        isLoading={isArchiving}
      />
    </>
  );
}; 