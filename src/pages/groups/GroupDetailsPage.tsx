import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Badge, Button, LoadingSpinner, ConfirmDialog } from '@/components/common';
import { groupService } from '@/services';
import { GroupMembersTable } from '@/components/features/groups/GroupMembersTable';
import { GroupPermissionsTab } from '@/components/features/groups/GroupPermissionsTab';
import { BulkMemberAssignmentModal } from '@/components/features/groups/BulkMemberAssignmentModal';
import { GroupFormModal } from '@/components/features/groups/GroupFormModal';
import type { GroupMember } from '@/components/features/groups/GroupMembersTable';
import { ROUTES } from '@/utils/routes';
import type { UserGroup, GroupFormData } from '@/types/group.types';
import { useUsersByGroup } from '@/hooks/useUsersByGroup';
import { useToast } from '@/hooks';
import { formatDate } from '@/utils/component-utils';
import '../../styles/pages/group-details.css';

type TabType = 'members' | 'permissions';

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
  const members: GroupMember[] = groupUsers.map(user => ({
    user_hash: user.user_hash,
    username: user.username,
    email: user.email,
    user_type: user.user_type,
    joined_at: user.created_at,
    is_active: user.is_active
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

  if (isLoading) {
    return (
      <div className="group-details-page">
        <div className="group-details-loading">
          <LoadingSpinner size="lg" />
          <p>Loading group details...</p>
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="group-details-page">
        <div className="group-details-error">
          <p>{error || 'Group not found'}</p>
          <Button
            variant="primary"
            onClick={() => navigate(ROUTES.GROUPS)}
          >
            Back to Groups
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group-details-page">
      <div className="group-details-header">
        <div className="group-details-header-text">
          <h1 className="group-details-title">{group.group_name}</h1>
          {group.description && (
            <p className="group-details-description">
              {group.description}
            </p>
          )}
        </div>
        
        <div className="group-details-header-actions">
          <Button
            variant="outline"
            onClick={() => setIsEditModalOpen(true)}
          >
            Edit Group
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(ROUTES.GROUPS)}
          >
            Back to Groups
          </Button>
        </div>
      </div>

      <div className="group-details-content">
        <Card title="Group Information" className="group-info-card">
          <div className="group-info-grid">
            <div className="group-info-item">
              <span className="group-info-label">Group Name</span>
              <span className="group-info-value">{group.group_name}</span>
            </div>
            
            <div className="group-info-item">
              <span className="group-info-label">Description</span>
              <span className="group-info-value">{group.description || 'No description'}</span>
            </div>
            
            <div className="group-info-item">
              <span className="group-info-label">Members</span>
              <Badge variant="secondary">
                {statistics?.total_members ?? group.member_count ?? 0} member{(statistics?.total_members ?? group.member_count ?? 0) !== 1 ? 's' : ''}
              </Badge>
            </div>
            
            <div className="group-info-item">
              <span className="group-info-label">Created</span>
              <span className="group-info-value">{formatDate(group.created_at)}</span>
            </div>
            
            <div className="group-info-item">
              <span className="group-info-label">Projects</span>
              <Badge variant="secondary">
                {statistics?.total_projects ?? 0} project{(statistics?.total_projects ?? 0) !== 1 ? 's' : ''}
              </Badge>
            </div>
            
            {group.updated_at && (
              <div className="group-info-item">
                <span className="group-info-label">Last Updated</span>
                <span className="group-info-value">{formatDate(group.updated_at)}</span>
              </div>
            )}
          </div>
        </Card>

        <div className="group-details-tabs">
          {/* Tabs Navigation */}
          <div className="tabs-nav">
            <button
              className={`tab-button ${activeTab === 'members' ? 'active' : ''}`}
              onClick={() => setActiveTab('members')}
            >
              Members ({members.length})
            </button>
            <button
              className={`tab-button ${activeTab === 'permissions' ? 'active' : ''}`}
              onClick={() => setActiveTab('permissions')}
            >
              Permission Groups
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === 'members' && (
              <Card>
                <div className="members-tab-header">
                  <h3 className="members-tab-title">Group Members ({members.length})</h3>
                  <Button 
                    variant="primary"
                    onClick={() => setIsAddMembersModalOpen(true)}
                  >
                    Add Members
                  </Button>
                </div>
                
                {membersError && (
                  <div className="members-error-banner">
                    Error loading members: {membersError}
                  </div>
                )}
                
                {members.length === 0 && !membersError ? (
                  <div className="members-empty-state">
                    <p>No members in this group yet.</p>
                    <Button
                      variant="primary"
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
              </Card>
            )}

            {activeTab === 'permissions' && group && (
              <GroupPermissionsTab
                groupHash={group.group_hash}
                groupName={group.group_name}
              />
            )}
          </div>
        </div>
      </div>

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
    </div>
  );
};
