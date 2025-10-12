import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Badge, Button, Modal, Input, LoadingSpinner, ConfirmDialog } from '@/components/common';
import { groupService, userService } from '@/services';
import { GroupMembersTable } from '@/components/features/groups/GroupMembersTable';
import type { GroupMember } from '@/components/features/groups/GroupMembersTable';
import { ROUTES } from '@/utils/routes';
import type { UserGroup } from '@/types/group.types';
import type { User } from '@/types/auth.types';
import { useUsersByGroup } from '@/hooks/useUsersByGroup';

export const GroupDetailsPage: React.FC = () => {
  const { groupHash } = useParams<{ groupHash: string }>();
  const [group, setGroup] = useState<UserGroup | null>(null);
  const [statistics, setStatistics] = useState<{ total_members: number; total_projects: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use the new hook to fetch group members
  const { users: groupUsers, refetch: refetchMembers, error: membersError } = useUsersByGroup(groupHash);
  
  // Log members data for debugging
  useEffect(() => {
    console.log('Group members data:', groupUsers);
    console.log('Members error:', membersError);
  }, [groupUsers, membersError]);

  // Add member modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState<string | null>(null);

  // Remove member state
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
        console.log('getGroup() full response:', response);
        if (response.success && response.user_group) {
          setGroup(response.user_group);
          setStatistics(response.statistics);
          
          // The getGroup() API returns members directly in the response
          // This is the source of truth - use these members if hook fails
          console.log('Members from getGroup():', response.members);
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

  // Search users for adding to group
  const searchUsers = async (query: string = '') => {
    if (!groupHash) return;

    try {
      setIsSearching(true);
      const response = await userService.getUsers({
        search: query.trim() || undefined,
        limit: 20,
      });

      if (response.success && response.users) {
        // Filter out users already in the group
        const memberHashes = groupUsers.map(u => u.user_hash);
        const availableUsers = response.users.filter((user: User) =>
          !memberHashes.includes(user.user_hash)
        );
        setSearchResults(availableUsers);
      }
    } catch (err) {
      console.error('Error searching users:', err);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (!isAddModalOpen) return;

    const debounceTimer = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, isAddModalOpen, groupUsers]);

  // Load initial users when modal opens
  useEffect(() => {
    if (isAddModalOpen) {
      searchUsers('');
    }
  }, [isAddModalOpen]);

  const handleAddMember = async (user: User) => {
    if (!groupHash) return;

    try {
      setIsAdding(user.user_hash);
      const response = await groupService.addMemberToGroup(groupHash, {
        user_hash: user.user_hash
      });

      if (response.success) {
        await refetchMembers();
        setIsAddModalOpen(false);
        setSearchQuery('');
        setSearchResults([]);
      } else {
        setError(response.message || 'Failed to add member');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add member');
    } finally {
      setIsAdding(null);
    }
  };

  const handleRemoveMember = async (member: GroupMember) => {
    if (!groupHash) return;

    try {
      setIsRemoving(member.user_hash);
      const response = await groupService.removeMemberFromGroup(groupHash, member.user_hash);

      if (response.success) {
        await refetchMembers();
        setConfirmRemove(null);
      } else {
        setError(response.message || 'Failed to remove member');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    } finally {
      setIsRemoving(null);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="group-details-page">
        <div>Loading group details...</div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="group-details-page">
        <div className="danger-text">
          {error || 'Group not found'}
        </div>
        {membersError && (
          <div className="danger-text" style={{ marginTop: '1rem' }}>
            Members error: {membersError}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="group-details-page">
      <div className="page-header-flex">
        <div>
          <h1>{group.group_name}</h1>
          {group.description && (
            <p className="description-secondary">
              {group.description}
            </p>
          )}
        </div>
        
        <div className="button-group">
          <Button
            variant="outline"
            onClick={() => window.location.href = `${ROUTES.GROUPS_EDIT}/${group.group_hash}`}
          >
            Edit Group
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = ROUTES.GROUPS}
          >
            Back to Groups
          </Button>
        </div>
      </div>

      <div className="group-details-content">
        <Card title="Group Information">
          <div className="info-grid">
            <div className="info-item">
              <span className="detail-label">Group Name</span>
              <span>{group.group_name}</span>
            </div>
            
            <div className="info-item">
              <span className="detail-label">Description</span>
              <span>{group.description || 'No description'}</span>
            </div>
            
            <div className="info-item">
              <span className="detail-label">Members</span>
              <Badge variant="secondary">
                {statistics?.total_members ?? group.member_count ?? 0} member{(statistics?.total_members ?? group.member_count ?? 0) !== 1 ? 's' : ''}
              </Badge>
            </div>
            
            <div className="info-item">
              <span className="detail-label">Created</span>
              <span>{formatDate(group.created_at)}</span>
            </div>
            
            <div className="info-item">
              <span className="detail-label">Projects</span>
              <Badge variant="secondary">
                {statistics?.total_projects ?? 0} project{(statistics?.total_projects ?? 0) !== 1 ? 's' : ''}
              </Badge>
            </div>
            
            {group.updated_at && (
              <div className="info-item">
                <span className="detail-label">Last Updated</span>
                <span>{formatDate(group.updated_at)}</span>
              </div>
            )}
          </div>
        </Card>

        <div className="mt-8">
          <Card title="Members">
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Group Members ({members.length})</h3>
              <Button onClick={() => setIsAddModalOpen(true)}>
                Add Member
              </Button>
            </div>
            
            {membersError && (
              <div className="danger-text" style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#fee', borderRadius: '0.25rem' }}>
                Error loading members: {membersError}
              </div>
            )}
            
            {members.length === 0 && !membersError && (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                No members in this group. Click "Add Member" to get started.
              </div>
            )}
            
            {members.length > 0 && (
              <GroupMembersTable 
                members={members} 
                onRemove={setConfirmRemove}
                removingMember={isRemoving}
              />
            )}
          </Card>
        </div>

        {/* Add Member Modal */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setSearchQuery('');
            setSearchResults([]);
          }}
          title="Add Member to Group"
        >
          <div style={{ padding: '1rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <Input
                placeholder="Search users by username or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {isSearching ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <LoadingSpinner />
              </div>
            ) : searchResults.length > 0 ? (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {searchResults.map(user => (
                  <div
                    key={user.user_hash}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem',
                      marginBottom: '0.5rem'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 500 }}>{user.username}</div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{user.email}</div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{user.user_type}</div>
                    </div>
                    <Button
                      size="small"
                      onClick={() => handleAddMember(user)}
                      disabled={isAdding === user.user_hash}
                      isLoading={isAdding === user.user_hash}
                    >
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            ) : searchQuery ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                No users found matching "{searchQuery}"
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                No available users to add
              </div>
            )}
          </div>
        </Modal>

        {/* Remove Member Confirmation */}
        {confirmRemove && (
          <ConfirmDialog
            isOpen={true}
            title="Remove Member"
            message={`Are you sure you want to remove ${confirmRemove.username} from this group?`}
            confirmText="Remove"
            cancelText="Cancel"
            onConfirm={() => handleRemoveMember(confirmRemove)}
            onClose={() => setConfirmRemove(null)}
            isLoading={isRemoving === confirmRemove.user_hash}
          />
        )}
      </div>
    </div>
  );
}; 