import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { DataView, Pagination, ErrorState, EmptyState } from '@/components/common';
import type { DataViewColumn } from '@/components/common';
import { projectService, groupService, userService } from '@/services';
import type { ProjectDetails, ProjectMember } from '@/types/project.types';
import type { UserGroup } from '@/types/group.types';
import { useToast } from '@/contexts/ToastContext';
import { 
  Users, 
  UserPlus,
  Search,
  ArrowRight,
  FolderTree,
  FolderOpen,
  ExternalLink,
  UserCheck
} from 'lucide-react';
import { ROUTES } from '@/utils/routes';

interface ProjectMembersTabProps {
  project: ProjectDetails;
}

interface SearchedUser {
  user_hash: string;
  username: string;
  email: string;
  user_type: string;
  is_active: boolean;
}

export const ProjectMembersTab: React.FC<ProjectMembersTabProps> = ({ project }) => {
  // Members state
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // User Groups with access state
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [groupsError, setGroupsError] = useState<string | null>(null);

  // Add member modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchedUser | null>(null);
  const [isAddingMember, setIsAddingMember] = useState(false);

  const { addToast } = useToast();

  // Fetch project members
  const fetchMembers = useCallback(async (page = 1) => {
    try {
      setIsLoadingMembers(true);
      setMembersError(null);
      const response = await projectService.getProjectMembers(project.project_hash, {
        limit: 10,
        offset: (page - 1) * 10,
      });
      
      if (response.success && response.members) {
        setMembers(response.members);
        if (response.pagination) {
          setTotalPages(Math.ceil(response.pagination.total / 10));
          setTotalItems(response.pagination.total);
        } else {
          setTotalItems(response.members.length);
        }
      } else {
        setMembersError('Failed to load members');
      }
    } catch (err) {
      console.error('Error fetching members:', err);
      setMembersError('Failed to load members. Please try again.');
    } finally {
      setIsLoadingMembers(false);
    }
  }, [project.project_hash]);

  // Fetch user groups with access
  const fetchUserGroups = useCallback(async () => {
    try {
      setIsLoadingGroups(true);
      setGroupsError(null);
      const response = await projectService.getProjectGroups(project.project_hash, {
        limit: 100,
      });
      
      if (response.success && response.user_groups) {
        setUserGroups(response.user_groups);
      } else {
        setGroupsError('Failed to load user groups');
      }
    } catch (err) {
      console.error('Error fetching user groups:', err);
      setGroupsError('Failed to load user groups');
    } finally {
      setIsLoadingGroups(false);
    }
  }, [project.project_hash]);

  useEffect(() => {
    fetchMembers(currentPage);
    fetchUserGroups();
  }, [fetchMembers, fetchUserGroups, currentPage]);

  // Search users for adding to group
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setIsSearching(true);
      const response = await userService.searchUsers({ 
        q: searchQuery.trim(),
        limit: 20 
      });
      
      if (response.success && response.users) {
        // Filter out users already in the selected group or already members
        const existingMemberHashes = new Set(members.map(m => m.user_hash));
        const filtered = response.users.filter(
          (u: SearchedUser) => !existingMemberHashes.has(u.user_hash)
        );
        setSearchResults(filtered);
      }
    } catch (err) {
      console.error('Error searching users:', err);
      addToast({ message: 'Failed to search users', variant: 'error' });
    } finally {
      setIsSearching(false);
    }
  };

  // Add user to selected group
  const handleAddMember = async () => {
    if (!selectedUser || !selectedGroup) return;

    setIsAddingMember(true);
    try {
      const response = await groupService.addMemberToGroup(
        selectedGroup.group_hash,
        { user_hash: selectedUser.user_hash }
      );

      if (response.success) {
        addToast({ 
          message: `Added ${selectedUser.username} to ${selectedGroup.group_name}`, 
          variant: 'success' 
        });
        setShowAddModal(false);
        setSelectedUser(null);
        setSelectedGroup(null);
        setSearchQuery('');
        setSearchResults([]);
        // Refresh members list
        await fetchMembers(currentPage);
      } else {
        throw new Error(response.message || 'Failed to add member');
      }
    } catch (err) {
      console.error('Error adding member:', err);
      addToast({ message: 'Failed to add member to group', variant: 'error' });
    } finally {
      setIsAddingMember(false);
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const memberColumns: DataViewColumn<ProjectMember>[] = [
    { 
      key: 'username', 
      header: 'Username', 
      sortable: true,
      render: (value, member) => (
        <Link 
          to={`${ROUTES.USERS}/${member.user_hash}`}
          className="font-medium text-primary hover:underline inline-flex items-center gap-1"
        >
          {String(value)}
          <ExternalLink className="h-3 w-3" />
        </Link>
      )
    },
    { key: 'email', header: 'Email', sortable: false },
    { 
      key: 'user_type', 
      header: 'User Type', 
      sortable: true,
      render: (value) => (
        <Badge variant="secondary">{String(value)}</Badge>
      )
    },
    { 
      key: 'access_level', 
      header: 'Access Level', 
      sortable: false,
      render: (value) => (
        <Badge variant="outline">{String(value || 'read-only')}</Badge>
      )
    },
    { 
      key: 'groups', 
      header: 'Via Groups', 
      sortable: false,
      render: (value) => {
        const groups = value as any[];
        if (!groups || groups.length === 0) return <span className="text-muted-foreground">Direct</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {groups.slice(0, 2).map((g: any, i: number) => (
              <Badge key={i} variant="info" className="text-xs">
                {g.group_name || g}
              </Badge>
            ))}
            {groups.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{groups.length - 2}
              </Badge>
            )}
          </div>
        );
      }
    },
    { 
      key: 'joined_at', 
      header: 'Added', 
      sortable: true,
      render: (value, member) => formatDate(value as string || member.created_at)
    },
  ];

  const openAddMemberModal = (group: UserGroup) => {
    setSelectedGroup(group);
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Architecture Info Banner */}
      <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 border text-sm">
        <div className="flex items-center gap-2 text-primary font-medium">
          <Users className="h-4 w-4" />
          <span>User</span>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>User Group</span>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <div className="flex items-center gap-2 text-muted-foreground">
          <FolderTree className="h-4 w-4" />
          <span>Project Group</span>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <div className="flex items-center gap-2 text-muted-foreground">
          <FolderOpen className="h-4 w-4" />
          <span>Project</span>
        </div>
      </div>

      {/* User Groups with Access Section */}
      <Card>
        <CardHeader>
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Groups with Access ({userGroups.length})
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              User groups that have access to this project. Add users to these groups to grant them access.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {groupsError ? (
            <ErrorState
              icon={<Users size={24} />}
              title="Failed to load user groups"
              message={groupsError}
              onRetry={fetchUserGroups}
              retryLabel="Retry"
              variant="inline"
              size="sm"
            />
          ) : isLoadingGroups ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Spinner size="lg" />
              <p className="text-sm text-muted-foreground mt-2">Loading user groups...</p>
            </div>
          ) : userGroups.length === 0 ? (
            <EmptyState
              icon={<Users className="h-10 w-10" aria-hidden="true" />}
              title="No User Groups Have Access"
              description="No user groups have access to this project yet. Go to the Groups tab to add this project to a project group and grant user groups access."
              size="sm"
              action={
                <Link to={`${ROUTES.PROJECTS_DETAILS}/${project.project_hash}?tab=groups`}>
                  <Button variant="outline" size="sm">
                    Go to Groups Tab
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {userGroups.map(group => (
                <div 
                  key={group.group_hash} 
                  className="group flex items-start justify-between gap-3 p-4 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="p-2 rounded-md bg-primary/10 flex-shrink-0">
                      <Users className="h-4 w-4 text-primary" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <Link
                        to={`${ROUTES.GROUPS}/${group.group_hash}`}
                        className="font-medium text-sm hover:underline flex items-center gap-1"
                      >
                        <span className="truncate">{group.group_name}</span>
                        <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                      <Badge variant="secondary" className="text-xs">
                        {group.member_count || 0} members
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openAddMemberModal(group)}
                    className="text-primary hover:text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    aria-label={`Add member to ${group.group_name}`}
                  >
                    <UserPlus className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Members Section */}
      <Card>
        <CardHeader>
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Project Members ({totalItems})
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              All users with access to this project through the user groups above.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {membersError ? (
            <ErrorState
              icon={<Users size={24} />}
              title="Failed to load members"
              message={membersError}
              onRetry={() => fetchMembers(currentPage)}
              retryLabel="Retry"
              variant="inline"
              size="sm"
            />
          ) : isLoadingMembers ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Spinner size="lg" />
              <p className="text-sm text-muted-foreground mt-2">Loading members...</p>
            </div>
          ) : members.length === 0 ? (
            <EmptyState
              icon={<Users className="h-10 w-10" aria-hidden="true" />}
              title="No Members Yet"
              description={
                userGroups.length === 0
                  ? "This project doesn't have any members yet. Add this project to a project group and grant user groups access."
                  : "No users are in the user groups that have access to this project. Add users to the groups above."
              }
              size="sm"
            />
          ) : (
            <>
              <DataView
                columns={memberColumns}
                data={members}
                viewMode="table"
                showViewToggle={false}
                emptyMessage="No members found"
              />
              
              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    itemsPerPage={10}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Member to Group Modal */}
      <Dialog open={showAddModal} onOpenChange={(open) => !isAddingMember && !open && setShowAddModal(false)}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>
              Add Member to {selectedGroup?.group_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Search for a user and add them to this user group. They will gain access to this project
              and all other projects accessible through this group.
            </p>

            {/* Search Input */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by username or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-9"
                />
              </div>
              <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}>
                {isSearching ? <Spinner size="sm" /> : 'Search'}
              </Button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="max-h-[300px] overflow-y-auto border rounded-md divide-y">
                {searchResults.map(user => (
                  <div
                    key={user.user_hash}
                    className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                      selectedUser?.user_hash === user.user_hash
                        ? 'bg-primary/10'
                        : 'hover:bg-accent/50'
                    }`}
                    onClick={() => setSelectedUser(user)}
                  >
                    <div className="p-2 rounded-full bg-muted">
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{user.username}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <Badge variant="secondary">{user.user_type}</Badge>
                    {selectedUser?.user_hash === user.user_hash && (
                      <UserCheck className="h-5 w-5 text-primary" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {searchQuery && searchResults.length === 0 && !isSearching && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No users found matching "{searchQuery}"</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddModal(false);
                setSelectedUser(null);
                setSearchQuery('');
                setSearchResults([]);
              }}
              disabled={isAddingMember}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddMember}
              disabled={!selectedUser || isAddingMember}
              loading={isAddingMember}
            >
              Add to Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 