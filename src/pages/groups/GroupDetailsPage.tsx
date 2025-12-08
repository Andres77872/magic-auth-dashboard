import React, { useState, useEffect } from 'react';
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
  TabNavigation,
  type Tab
} from '@/components/common';
import { groupService } from '@/services';
import { GroupMembersTable } from '@/components/features/groups/GroupMembersTable';
import { GroupPermissionsTab } from '@/components/features/groups/GroupPermissionsTab';
import { GroupProjectGroupsTab } from '@/components/features/groups/GroupProjectGroupsTab';
import { BulkMemberAssignmentModal } from '@/components/features/groups/BulkMemberAssignmentModal';
import { GroupFormModal } from '@/components/features/groups/GroupFormModal';
import type { GroupMember } from '@/components/features/groups/GroupMembersTable';
import { ROUTES } from '@/utils/routes';
import type { UserGroup, GroupFormData } from '@/types/group.types';
import { useUsersByGroup } from '@/hooks/useUsersByGroup';
import { useToast } from '@/hooks';
import { formatDate } from '@/utils/component-utils';
import { Users, User, Lock, FolderOpen, Plus } from 'lucide-react';

type TabType = 'members' | 'project-groups' | 'permissions';

export const GroupDetailsPage: React.FC = () => {
  const { groupHash } = useParams<{ groupHash: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [group, setGroup] = useState<UserGroup | null>(null);
  const [statistics, setStatistics] = useState<{ total_members: number; total_projects: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('members');

  // Use the hook to fetch group members
  const { users: groupUsers, refetch: refetchMembers, error: membersError } = useUsersByGroup(groupHash);

  // Modal states
  const [isAddMembersModalOpen, setIsAddMembersModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<GroupMember | null>(null);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  // Map users to GroupMember type for the table
  // API returns joined_at for group membership date
  const members: GroupMember[] = groupUsers.map((user: any) => ({
    user_hash: user.user_hash,
    username: user.username,
    email: user.email,
    user_type: user.user_type,
    joined_at: user.joined_at || user.created_at
  }));

  useEffect(() => {
    const fetchGroup = async () => {
      if (!groupHash) {
        setError('Group ID is required');
        setIsLoading(false);
        return;
      }

      try {
        const response = await groupService.getGroup(groupHash);
        if (response.success && response.user_group) {
          setGroup(response.user_group);
          setStatistics(response.statistics);
        } else {
          setError(response.message || 'Failed to fetch group');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch group');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroup();
  }, [groupHash]);

  const handleBulkAddMembers = async (userHashes: string[]) => {
    if (!groupHash) return;

    try {
      const response = await groupService.bulkAddMembers(groupHash, userHashes);
      
      if (response.success) {
        showToast(`Successfully added ${userHashes.length} member(s) to the group`, 'success');
        await refetchMembers();
      } else {
        throw new Error(response.message || 'Failed to add members');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to add members', 'error');
      throw err;
    }
  };

  const handleRemoveMember = async (member: GroupMember) => {
    if (!groupHash) return;

    setIsRemoving(member.user_hash);
    try {
      const response = await groupService.removeMemberFromGroup(groupHash, member.user_hash);

      if (response.success) {
        showToast(`Successfully removed ${member.username} from the group`, 'success');
        await refetchMembers();
        setConfirmRemove(null);
      } else {
        throw new Error(response.message || 'Failed to remove member');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to remove member', 'error');
    } finally {
      setIsRemoving(null);
    }
  };

  const handleEditGroup = async (data: GroupFormData) => {
    if (!groupHash) return;

    try {
      const response = await groupService.updateGroup(groupHash, data);
      if (response.success && response.user_group) {
        setGroup(response.user_group);
        showToast('Group updated successfully', 'success');
      } else {
        throw new Error(response.message || 'Failed to update group');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update group', 'error');
      throw err;
    }
  };

  // Define tabs
  const tabs: Tab[] = [
    {
      id: 'members',
      label: 'Members',
      icon: <User size={16} />,
      count: members.length,
    },
    {
      id: 'project-groups',
      label: 'Project Groups',
      icon: <FolderOpen size={16} />,
    },
    {
      id: 'permissions',
      label: 'Permission Groups',
      icon: <Lock size={16} />,
    },
  ];

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-muted-foreground">Loading group details...</p>
        </div>
      </PageContainer>
    );
  }

  if (error || !group) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <Users size={48} className="text-muted-foreground" />
          <p className="text-muted-foreground">{error || 'Group not found'}</p>
          <Button
            variant="primary"
            onClick={() => navigate(ROUTES.GROUPS)}
          >
            Back to Groups
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={group.group_name}
        subtitle={group.description || undefined}
        icon={<Users size={28} />}
        actions={
          <>
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate(ROUTES.GROUPS)}
            >
              Back to Groups
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsEditModalOpen(true)}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Group Name</span>
              <p className="font-medium">{group.group_name}</p>
            </div>
            
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Description</span>
              <p className="font-medium">{group.description || 'No description'}</p>
            </div>
            
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Members</span>
              <div>
                <Badge variant="secondary">
                  {statistics?.total_members ?? group.member_count ?? 0} member{(statistics?.total_members ?? group.member_count ?? 0) !== 1 ? 's' : ''}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Created</span>
              <p className="font-medium">{formatDate(group.created_at)}</p>
            </div>
            
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Projects</span>
              <div>
                <Badge variant="secondary">
                  {statistics?.total_projects ?? 0} project{(statistics?.total_projects ?? 0) !== 1 ? 's' : ''}
                </Badge>
              </div>
            </div>
            
            {group.updated_at && (
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Last Updated</span>
                <p className="font-medium">{formatDate(group.updated_at)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs Section */}
      <TabNavigation 
        tabs={tabs} 
        activeTab={activeTab} 
        onChange={(tabId) => setActiveTab(tabId as TabType)}
        contained
      >
        {activeTab === 'members' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Group Members ({members.length})</h3>
              <Button 
                variant="primary"
                size="md"
                leftIcon={<Plus size={16} />}
                onClick={() => setIsAddMembersModalOpen(true)}
              >
                Add Members
              </Button>
            </div>
            
            {membersError && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
                Error loading members: {membersError}
              </div>
            )}
            
            {members.length === 0 && !membersError ? (
              <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                <User size={48} className="text-muted-foreground" />
                <p className="text-muted-foreground">No members in this group yet.</p>
                <Button
                  variant="primary"
                  leftIcon={<Plus size={16} />}
                  onClick={() => setIsAddMembersModalOpen(true)}
                >
                  Add Your First Member
                </Button>
              </div>
            ) : (
              <GroupMembersTable 
                members={members} 
                onRemove={setConfirmRemove}
                removingMember={isRemoving}
              />
            )}
          </div>
        )}

        {activeTab === 'project-groups' && group && (
          <GroupProjectGroupsTab
            groupHash={group.group_hash}
            groupName={group.group_name}
          />
        )}

        {activeTab === 'permissions' && group && (
          <GroupPermissionsTab
            groupHash={group.group_hash}
            groupName={group.group_name}
          />
        )}
      </TabNavigation>

      {/* Add Members Modal */}
      <BulkMemberAssignmentModal
        isOpen={isAddMembersModalOpen}
        onClose={() => setIsAddMembersModalOpen(false)}
        onAssign={handleBulkAddMembers}
        groupName={group.group_name}
        existingMemberHashes={members.map(m => m.user_hash)}
      />

      {/* Edit Group Modal */}
      <GroupFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditGroup}
        mode="edit"
        group={group}
      />

      {/* Remove Member Confirmation */}
      {confirmRemove && (
        <ConfirmDialog
          isOpen={true}
          title="Remove Member"
          message={`Are you sure you want to remove ${confirmRemove.username} from this group?`}
          confirmText="Remove"
          cancelText="Cancel"
          variant="danger"
          onConfirm={() => handleRemoveMember(confirmRemove)}
          onClose={() => setConfirmRemove(null)}
          isLoading={isRemoving === confirmRemove.user_hash}
        />
      )}
    </PageContainer>
  );
};
