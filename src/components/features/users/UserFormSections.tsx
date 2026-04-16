import React from 'react';
import { Button } from '@/components/ui/button';
import { FolderKanban, Users } from 'lucide-react';

interface UserFormSectionsProps {
  userType: string;
  assignedProjects?: string[];
  assignedGroup?: string;
  assignmentError?: string;
  isLoading: boolean;
  onOpenProjectModal: () => void;
  onOpenGroupModal: () => void;
}

/**
 * Assignment sections for UserFormModal.
 * Renders project assignment for admin users and group assignment for consumer users.
 */
export function UserFormSections({
  userType,
  assignedProjects = [],
  assignedGroup,
  assignmentError,
  isLoading,
  onOpenProjectModal,
  onOpenGroupModal,
}: UserFormSectionsProps): React.JSX.Element | null {
  // Render project assignment section for admin users
  if (userType === 'admin') {
    return (
      <div className="space-y-3 rounded-md border p-4">
        <h4 className="font-medium">Project Assignment</h4>
        <p className="text-sm text-muted-foreground">
          Assign this admin user to specific projects they can manage.
        </p>

        <div className="flex items-center justify-between">
          {assignedProjects.length > 0 ? (
            <p className="text-sm">
              {assignedProjects.length} project
              {assignedProjects.length !== 1 ? 's' : ''} assigned
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No projects assigned
            </p>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenProjectModal}
            disabled={isLoading}
          >
            <FolderKanban size={16} aria-hidden="true" />
            {assignedProjects.length > 0 ? 'Change' : 'Assign'} Projects
          </Button>
        </div>
      </div>
    );
  }

  // Render group assignment section for consumer users
  if (userType === 'consumer') {
    return (
      <div className="space-y-3 rounded-md border p-4">
        <h4 className="font-medium">User Group Assignment</h4>
        <p className="text-sm text-muted-foreground">
          Assign this consumer user to a user group. This is required.
        </p>

        <div className="flex items-center justify-between">
          {assignedGroup ? (
            <p className="text-sm">1 group assigned</p>
          ) : (
            <p className="text-sm text-muted-foreground">No group assigned</p>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenGroupModal}
            disabled={isLoading}
          >
            <Users size={16} aria-hidden="true" />
            {assignedGroup ? 'Change Group' : 'Assign Group'}
          </Button>
        </div>

        {assignmentError && (
          <p className="text-xs text-destructive">{assignmentError}</p>
        )}
      </div>
    );
  }

  // No assignment sections for root users
  return null;
}

export default UserFormSections;
