import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/common';
import { ProjectForm } from './ProjectForm';
import { projectService, userService } from '@/services';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/utils/routes';
import type { ProjectDetails, ProjectFormData } from '@/types/project.types';
import { AlertTriangle, X } from 'lucide-react';

interface ProjectSettingsTabProps {
  project: ProjectDetails;
  onProjectUpdate: (updatedProject: ProjectDetails) => void;
  onProjectDeleted: () => void;
}

interface User {
  user_hash: string;
  username: string;
  email: string;
  user_type: string;
}

export const ProjectSettingsTab: React.FC<ProjectSettingsTabProps> = ({
  project,
  onProjectUpdate,
  onProjectDeleted
}) => {
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [selectedNewOwner, setSelectedNewOwner] = useState<string>('');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async (formData: ProjectFormData) => {
    try {
      setIsUpdating(true);
      setError(null);
      const response = await projectService.updateProject(project.project_hash, formData);
      
      if (response.success && response.project) {
        // Map the response to our expected format
        const updatedProject: ProjectDetails = {
          ...project,
          project_name: response.project.project_name,
          project_description: response.project.project_description,
          updated_at: new Date().toISOString(), // Set current time as updated
        };
        onProjectUpdate(updatedProject);
      } else {
        setError('Failed to update project. Please try again.');
      }
    } catch (err) {
      console.error('Error updating project:', err);
      setError('Failed to update project. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleArchive = async () => {
    try {
      setIsArchiving(true);
      const response = await projectService.toggleProjectArchive(
        project.project_hash,
        project.is_active !== false
      );
      
      if (response.success && response.data) {
        onProjectUpdate(response.data);
        setShowArchiveConfirm(false);
      } else {
        setError('Failed to archive project. Please try again.');
      }
    } catch (err) {
      console.error('Error archiving project:', err);
      setError('Failed to archive project. Please try again.');
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await projectService.deleteProject(project.project_hash);
      
      if (response.success) {
        onProjectDeleted();
        setShowDeleteConfirm(false);
      } else {
        setError('Failed to delete project. Please try again.');
      }
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Failed to delete project. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const response = await userService.getUsers({
        limit: 100,
        user_type_filter: 'admin', // Only allow admins to own projects
      });
      
      if (response.success && response.data) {
        // Filter out current project admin
        const availableUsers = (response.data as User[]).filter((user: User) => 
          user.user_hash !== project.admin_user
        );
        setUsers(availableUsers);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users for transfer.');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleTransferOwnership = async () => {
    if (!selectedNewOwner) return;

    try {
      setIsTransferring(true);
      const response = await projectService.transferOwnership(
        project.project_hash,
        selectedNewOwner
      );
      
      if (response.success) {
        const updatedProject = {
          ...project,
          admin_user: selectedNewOwner,
        };
        onProjectUpdate(updatedProject);
        setShowTransferModal(false);
        setSelectedNewOwner('');
      } else {
        setError('Failed to transfer ownership. Please try again.');
      }
    } catch (err) {
      console.error('Error transferring ownership:', err);
      setError('Failed to transfer ownership. Please try again.');
    } finally {
      setIsTransferring(false);
    }
  };

  const openTransferModal = () => {
    setShowTransferModal(true);
    fetchUsers();
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center justify-between p-4 rounded-lg bg-destructive/10 border border-destructive/20">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setError(null)}
            className="h-6 w-6"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Project Information */}
      <Card>
        <CardHeader>
          <CardTitle>Project Information</CardTitle>
          <p className="text-sm text-muted-foreground">
            Update the basic information about your project.
          </p>
        </CardHeader>
        <CardContent>
          <ProjectForm
            mode="edit"
            initialData={{
              project_name: project.project_name,
              project_description: project.project_description,
            }}
            onSubmit={handleUpdate}
            onCancel={() => navigate(ROUTES.PROJECTS)}
            isSubmitting={isUpdating}
          />
        </CardContent>
      </Card>

      {/* Project Management */}
      <Card>
        <CardHeader>
          <CardTitle>Project Management</CardTitle>
          <p className="text-sm text-muted-foreground">
            Transfer ownership or change project status.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={openTransferModal}
            >
              Transfer Ownership
            </Button>
            
            <Button
              variant={project.is_active !== false ? "secondary" : "primary"}
              onClick={() => setShowArchiveConfirm(true)}
              loading={isArchiving}
            >
              {project.is_active !== false ? "Archive Project" : "Unarchive Project"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Irreversible and destructive actions. Please be cautious.
          </p>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete Project
          </Button>
        </CardContent>
      </Card>

      {/* Archive Confirmation */}
      {showArchiveConfirm && (
        <ConfirmDialog
          isOpen={true}
          title={`${project.is_active !== false ? 'Archive' : 'Unarchive'} Project`}
          message={`Are you sure you want to ${project.is_active !== false ? 'archive' : 'unarchive'} "${project.project_name}"? ${project.is_active !== false ? 'This will make the project read-only.' : 'This will make the project active again.'}`}
          confirmText={project.is_active !== false ? 'Archive' : 'Unarchive'}
          cancelText="Cancel"
          variant={project.is_active !== false ? 'warning' : 'info'}
          onConfirm={handleArchive}
          onClose={() => setShowArchiveConfirm(false)}
          isLoading={isArchiving}
        />
      )}

      {/* Delete Confirmation */}
      <Dialog open={showDeleteConfirm} onOpenChange={(open) => {
        if (!open) {
          setShowDeleteConfirm(false);
          setDeleteConfirmation('');
        }
      }}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 space-y-2">
              <p className="text-sm font-semibold text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                This action cannot be undone!
              </p>
              <p className="text-sm text-muted-foreground">
                This will permanently delete the project "{project.project_name}" and all associated data.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>
                Please type <strong>{project.project_name}</strong> to confirm:
              </Label>
              <Input
                placeholder="Enter project name"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                fullWidth
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirm(false);
                setDeleteConfirmation('');
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteConfirmation !== project.project_name || isDeleting}
              loading={isDeleting}
            >
              Delete Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Ownership Modal */}
      <Dialog open={showTransferModal} onOpenChange={(open) => {
        if (!open) {
          setShowTransferModal(false);
          setSelectedNewOwner('');
        }
      }}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Transfer Project Ownership</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select a new owner for the project "{project.project_name}". Only admin users can own projects.
            </p>
            
            {isLoadingUsers ? (
              <div className="flex items-center justify-center py-8">
                <Spinner size="lg" />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>New Owner</Label>
                <Select
                  value={selectedNewOwner}
                  onValueChange={setSelectedNewOwner}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select new owner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.user_hash} value={user.user_hash}>
                        {user.username} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowTransferModal(false);
                setSelectedNewOwner('');
              }}
              disabled={isTransferring}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleTransferOwnership}
              disabled={!selectedNewOwner || isTransferring}
              loading={isTransferring}
            >
              Transfer Ownership
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 