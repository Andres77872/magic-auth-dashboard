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
  DataView,
  CopyableId,
  StatsGrid,
} from '@/components/common';
import type { DataViewColumn } from '@/components/common';
import { projectGroupService } from '@/services';
import type { ProjectGroupDetailsResponse, AssignedProject } from '@/services/project-group.service';
import { ROUTES } from '@/utils/routes';
import { useToast } from '@/hooks';
import { useUserGroupsWithAccess } from '@/hooks/useUserGroupsWithAccess';
import { isDefaultUserGroup } from '@/utils/default-groups';
import { formatDate } from '@/utils/component-utils';
import { FolderOpen, Plus, Trash2, ExternalLink, Users, Info } from 'lucide-react';
import { AddProjectsToGroupModal } from '@/components/features/groups/AddProjectsToGroupModal';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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

  // User groups with access (bidirectional visibility)
  const {
    userGroups: userGroupsWithAccess,
    isLoading: isLoadingUserGroups,
    error: userGroupsError,
    refetch: refetchUserGroupsAccess,
  } = useUserGroupsWithAccess(groupHash);

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

  const userGroupColumns: DataViewColumn<(typeof userGroupsWithAccess)[number]>[] = [
    {
      key: 'group_name',
      header: 'User Group',
      sortable: true,
      render: (_value, group) => {
        const isDefault = isDefaultUserGroup(group.group_name);
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`${ROUTES.GROUPS}/${group.group_hash}`)}
              className="font-medium text-primary hover:underline text-left flex items-center gap-1"
            >
              {group.group_name}
              <ExternalLink size={14} />
            </button>
            {isDefault && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="subtleInfo" size="sm" className="cursor-help">
                      Default
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    Auto-created when the project was created. Can be deleted like any other group.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        );
      },
    },
    {
      key: 'description',
      header: 'Description',
      sortable: false,
      render: (_value, group) => (
        <span className="text-muted-foreground">
          {group.description || 'No description'}
        </span>
      ),
    },
    {
      key: 'member_count',
      header: 'Members',
      sortable: true,
      align: 'center',
      render: (_value, group) => (
        <Badge variant="secondary">
          {group.member_count ?? 0} member{(group.member_count ?? 0) !== 1 ? 's' : ''}
        </Badge>
      ),
    },
    {
      key: 'group_hash',
      header: 'Actions',
      width: '120px',
      align: 'center',
      render: (_value, group) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`${ROUTES.GROUPS}/${group.group_hash}`)}
        >
          <ExternalLink size={14} className="mr-1" />
          Manage
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
        badge={<Badge variant="secondary">Project Group</Badge>}
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

      {/* Statistics Grid */}
      <div className="mb-6">
        <StatsGrid
          stats={[
            {
              title: 'Assigned Projects',
              value: statistics?.total_projects ?? project_group.project_count ?? 0,
              icon: <FolderOpen size={16} />,
              variant: 'info',
              gradient: true,
            },
          ]}
          columns={2}
          loading={isLoading}
        />
      </div>

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
              <span className="text-sm text-muted-foreground">Group Hash</span>
              <CopyableId id={project_group.group_hash} />
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

      {/* User Groups with Access Section */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users size={20} />
                User Groups with Access
              </h3>
              <p className="text-sm text-muted-foreground">
                User groups that have been granted access to this project group.
              </p>
            </div>
          </div>

          {userGroupsError ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-muted-foreground mb-3">{userGroupsError}</p>
              <Button variant="outline" size="sm" onClick={() => refetchUserGroupsAccess()}>
                Retry
              </Button>
            </div>
          ) : isLoadingUserGroups ? (
            <div className="flex flex-col items-center justify-center py-8">
              <LoadingSpinner size="md" />
              <p className="text-sm text-muted-foreground mt-2">Loading user groups...</p>
            </div>
          ) : userGroupsWithAccess.length === 0 ? (
            <EmptyState
              icon={<Users size={40} />}
              title="No User Groups Have Access"
              description="Grant user groups access to this project group so they can access its projects."
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(ROUTES.GROUPS)}
                >
                  Go to User Groups
                </Button>
              }
            />
          ) : (
            <>
              {userGroupsWithAccess.length > 0 && (
                <div className="flex items-start gap-2 rounded-md border border-muted bg-muted/30 p-3 mb-4 text-sm text-muted-foreground">
                  <Info size={16} className="mt-0.5 flex-shrink-0 text-primary" />
                  <span>
                    To grant a user group access to this project group, go to the{' '}
                    <button
                      className="text-primary hover:underline font-medium"
                      onClick={() => navigate(ROUTES.GROUPS)}
                    >
                      User Groups
                    </button>{' '}
                    page, open a user group, and use the <strong>Project Groups</strong> tab.
                  </span>
                </div>
              )}
              <DataView
                data={userGroupsWithAccess}
                columns={userGroupColumns}
                viewMode="table"
                showViewToggle={false}
                emptyMessage="No user groups found"
              />
            </>
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

