import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PageContainer,
  PageHeader,
  Card,
  CardContent,
  Badge,
  Button,
  LoadingSpinner,
  ConfirmDialog,
  EmptyState,
  DataView
} from '@/components/common';
import type { DataViewColumn } from '@/components/common';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { projectGroupService, projectService } from '@/services';
import type { ProjectGroupDetailsResponse, AssignedProject } from '@/services/project-group.service';
import { ROUTES } from '@/utils/routes';
import { useToast } from '@/hooks';
import { formatDate } from '@/utils/component-utils';
import { FolderOpen, Plus, Trash2, Search, ExternalLink } from 'lucide-react';

interface AvailableProject {
  project_hash: string;
  project_name: string;
  project_description?: string;
}

export function ProjectGroupDetailsPage(): React.JSX.Element {
  const { groupHash } = useParams<{ groupHash: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [groupDetails, setGroupDetails] = useState<ProjectGroupDetailsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add projects modal state
  const [isAddProjectsModalOpen, setIsAddProjectsModalOpen] = useState(false);
  const [availableProjects, setAvailableProjects] = useState<AvailableProject[]>([]);
  const [selectedProjectHashes, setSelectedProjectHashes] = useState<string[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [projectSearchTerm, setProjectSearchTerm] = useState('');

  // Remove project confirmation
  const [confirmRemove, setConfirmRemove] = useState<AssignedProject | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const fetchGroupDetails = useCallback(async () => {
    if (!groupHash) {
      setError('Group hash is required');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await projectGroupService.getProjectGroup(groupHash);
      if (response.success) {
        setGroupDetails(response);
      } else {
        setError(response.message || 'Failed to load project group');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project group');
    } finally {
      setIsLoading(false);
    }
  }, [groupHash]);

  useEffect(() => {
    fetchGroupDetails();
  }, [fetchGroupDetails]);

  const fetchAvailableProjects = async () => {
    setIsLoadingProjects(true);
    try {
      const response = await projectService.getProjects({ limit: 500 });
      if (response.success && response.projects) {
        // Filter out projects already assigned to this group
        const assignedHashes = new Set(
          groupDetails?.assigned_projects?.map(p => p.project_hash) || []
        );
        const available = response.projects.filter(
          (p: any) => !assignedHashes.has(p.project_hash)
        );
        setAvailableProjects(available);
      }
    } catch (err) {
      showToast('Failed to load available projects', 'error');
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const handleOpenAddModal = () => {
    setIsAddProjectsModalOpen(true);
    setSelectedProjectHashes([]);
    setProjectSearchTerm('');
    fetchAvailableProjects();
  };

  const handleAssignProjects = async () => {
    if (!groupHash || selectedProjectHashes.length === 0) return;

    setIsAssigning(true);
    let successCount = 0;
    let errorCount = 0;

    for (const projectHash of selectedProjectHashes) {
      try {
        const response = await projectGroupService.assignProjectToGroup(groupHash, projectHash);
        if (response.success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch {
        errorCount++;
      }
    }

    if (successCount > 0) {
      showToast(`Successfully assigned ${successCount} project(s) to the group`, 'success');
      await fetchGroupDetails();
    }
    if (errorCount > 0) {
      showToast(`Failed to assign ${errorCount} project(s)`, 'error');
    }

    setIsAddProjectsModalOpen(false);
    setIsAssigning(false);
    setSelectedProjectHashes([]);
  };

  const handleRemoveProject = async () => {
    if (!groupHash || !confirmRemove) return;

    setIsRemoving(true);
    try {
      const response = await projectGroupService.removeProjectFromGroup(
        groupHash,
        confirmRemove.project_hash
      );
      if (response.success) {
        showToast(`Removed "${confirmRemove.project_name}" from the group`, 'success');
        await fetchGroupDetails();
        setConfirmRemove(null);
      } else {
        throw new Error(response.message || 'Failed to remove project');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to remove project', 'error');
    } finally {
      setIsRemoving(false);
    }
  };

  const toggleProjectSelection = (projectHash: string) => {
    setSelectedProjectHashes(prev =>
      prev.includes(projectHash)
        ? prev.filter(h => h !== projectHash)
        : [...prev, projectHash]
    );
  };

  const filteredAvailableProjects = availableProjects.filter(project => {
    if (!projectSearchTerm) return true;
    const term = projectSearchTerm.toLowerCase();
    return (
      project.project_name.toLowerCase().includes(term) ||
      (project.project_description?.toLowerCase().includes(term) ?? false)
    );
  });

  const projectColumns: DataViewColumn<AssignedProject>[] = [
    {
      key: 'project_name',
      header: 'Project Name',
      sortable: true,
      render: (_value, project) => (
        <div className="space-y-0.5">
          <button
            onClick={() => navigate(`${ROUTES.PROJECTS_DETAILS}/${project.project_hash}`)}
            className="font-medium text-primary hover:underline text-left flex items-center gap-1"
          >
            {project.project_name}
            <ExternalLink size={14} />
          </button>
          {project.project_description && (
            <p className="text-sm text-muted-foreground truncate max-w-xs">
              {project.project_description}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'project_hash',
      header: 'Actions',
      width: '100px',
      align: 'center',
      render: (_value, project) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setConfirmRemove(project)}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 size={16} />
        </Button>
      ),
    },
  ];

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner size="lg" message="Loading project group..." />
        </div>
      </PageContainer>
    );
  }

  if (error || !groupDetails?.project_group) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <FolderOpen size={48} className="text-muted-foreground" />
          <p className="text-muted-foreground">{error || 'Project group not found'}</p>
          <Button variant="primary" onClick={() => navigate(ROUTES.PROJECT_GROUPS)}>
            Back to Project Groups
          </Button>
        </div>
      </PageContainer>
    );
  }

  const { project_group, assigned_projects, statistics } = groupDetails;

  return (
    <PageContainer>
      <PageHeader
        title={project_group.group_name}
        subtitle={project_group.description || undefined}
        icon={<FolderOpen size={28} />}
        actions={
          <>
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate(ROUTES.PROJECT_GROUPS)}
            >
              Back to Project Groups
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate(`${ROUTES.PROJECT_GROUPS_EDIT}/${groupHash}`)}
            >
              Edit Group
            </Button>
          </>
        }
      />

      {/* Group Information Card */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Group Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Group Name</span>
              <p className="font-medium">{project_group.group_name}</p>
            </div>

            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Description</span>
              <p className="font-medium">{project_group.description || 'No description'}</p>
            </div>

            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Projects</span>
              <div>
                <Badge variant="info">
                  {statistics?.total_projects ?? project_group.project_count ?? 0} project
                  {(statistics?.total_projects ?? project_group.project_count ?? 0) !== 1 ? 's' : ''}
                </Badge>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Created</span>
              <p className="font-medium">{formatDate(project_group.created_at)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assigned Projects Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              Assigned Projects ({assigned_projects?.length || 0})
            </h3>
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus size={16} />}
              onClick={handleOpenAddModal}
            >
              Add Projects
            </Button>
          </div>

          {!assigned_projects || assigned_projects.length === 0 ? (
            <EmptyState
              icon={<FolderOpen size={40} />}
              title="No Projects Assigned"
              description="This project group doesn't have any projects assigned yet. Click 'Add Projects' to assign some."
            />
          ) : (
            <DataView<AssignedProject>
              data={assigned_projects}
              columns={projectColumns}
              viewMode="table"
              showViewToggle={false}
              emptyMessage="No projects assigned"
            />
          )}
        </CardContent>
      </Card>

      {/* Add Projects Modal */}
      <Dialog
        open={isAddProjectsModalOpen}
        onOpenChange={(open) => !isAssigning && !open && setIsAddProjectsModalOpen(false)}
      >
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>Add Projects to {project_group.group_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Search projects..."
              value={projectSearchTerm}
              onChange={(e) => setProjectSearchTerm(e.target.value)}
              leftIcon={<Search size={16} />}
              disabled={isLoadingProjects}
              fullWidth
            />

            {selectedProjectHashes.length > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {selectedProjectHashes.length} project
                  {selectedProjectHashes.length !== 1 ? 's' : ''} selected
                </span>
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => setSelectedProjectHashes([])}
                >
                  Clear selection
                </button>
              </div>
            )}

            <div className="max-h-[400px] overflow-y-auto border rounded-md">
              {isLoadingProjects ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="md" message="Loading projects..." />
                </div>
              ) : filteredAvailableProjects.length === 0 ? (
                <EmptyState
                  icon={<FolderOpen size={32} />}
                  title={projectSearchTerm ? 'No projects found' : 'No available projects'}
                  description={
                    projectSearchTerm
                      ? 'Try adjusting your search criteria'
                      : 'All projects are already assigned to this group'
                  }
                />
              ) : (
                <div className="divide-y">
                  {filteredAvailableProjects.map(project => (
                    <div
                      key={project.project_hash}
                      className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                        selectedProjectHashes.includes(project.project_hash)
                          ? 'bg-primary/5'
                          : 'hover:bg-accent/50'
                      }`}
                      onClick={() => toggleProjectSelection(project.project_hash)}
                    >
                      <Checkbox
                        checked={selectedProjectHashes.includes(project.project_hash)}
                        onCheckedChange={() => toggleProjectSelection(project.project_hash)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{project.project_name}</div>
                        {project.project_description && (
                          <div className="text-sm text-muted-foreground truncate">
                            {project.project_description}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddProjectsModalOpen(false)}
              disabled={isAssigning}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAssignProjects}
              disabled={selectedProjectHashes.length === 0 || isAssigning}
              loading={isAssigning}
            >
              Add {selectedProjectHashes.length > 0 ? `(${selectedProjectHashes.length})` : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Project Confirmation */}
      {confirmRemove && (
        <ConfirmDialog
          isOpen={true}
          title="Remove Project"
          message={`Are you sure you want to remove "${confirmRemove.project_name}" from this project group?`}
          confirmText="Remove"
          cancelText="Cancel"
          variant="danger"
          onConfirm={handleRemoveProject}
          onClose={() => setConfirmRemove(null)}
          isLoading={isRemoving}
        />
      )}
    </PageContainer>
  );
}

export default ProjectGroupDetailsPage;
