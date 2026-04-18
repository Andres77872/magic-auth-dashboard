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
import { projectGroupService } from '@/services';
import type { ProjectGroupDetailsResponse, AssignedProject } from '@/services/project-group.service';
import { ROUTES } from '@/utils/routes';
import { useToast } from '@/hooks';
import { formatDate } from '@/utils/component-utils';
import { FolderOpen, Plus, Trash2, ExternalLink } from 'lucide-react';
import { AddProjectsToGroupModal } from '@/components/features/groups/AddProjectsToGroupModal';

export function ProjectGroupDetailsPage(): React.JSX.Element {
  const { groupHash } = useParams<{ groupHash: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [groupDetails, setGroupDetails] = useState<ProjectGroupDetailsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add projects modal state
  const [isAddProjectsModalOpen, setIsAddProjectsModalOpen] = useState(false);

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

  const handleOpenAddModal = () => {
    setIsAddProjectsModalOpen(true);
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
      <AddProjectsToGroupModal
        isOpen={isAddProjectsModalOpen}
        onClose={() => setIsAddProjectsModalOpen(false)}
        onSuccess={fetchGroupDetails}
        groupHash={groupHash || ''}
        groupName={project_group.group_name}
        assignedProjectHashes={assigned_projects?.map(p => p.project_hash) || []}
      />

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

