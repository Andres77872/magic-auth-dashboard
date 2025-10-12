import React, { useState, useEffect } from 'react';
import { Button, LoadingSpinner, Table, Pagination, ConfirmDialog, Modal, Input } from '@/components/common';
import { projectService, userService } from '@/services';
import type { ProjectDetails, ProjectMember } from '@/types/project.types';
import type { User } from '@/types/auth.types';
import type { TableColumn } from '@/components/common/Table';

interface ProjectMembersTabProps {
  project: ProjectDetails;
}

export const ProjectMembersTab: React.FC<ProjectMembersTabProps> = ({ project }) => {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<ProjectMember | null>(null);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  // Add member modal state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState<string | null>(null);

  const fetchMembers = async (page = 1) => {
    try {
      setIsLoading(true);
      const response = await projectService.getProjectMembers(project.project_hash, {
        limit: 10,
        offset: (page - 1) * 10,
      });
      
      if (response.success && response.members) {
        setMembers(response.members);
        // Handle pagination data
        if (response.pagination) {
          setTotalPages(Math.ceil(response.pagination.total / 10));
          setTotalItems(response.pagination.total);
        } else {
          setTotalItems(response.members.length);
        }
      } else {
        setError('Failed to load members');
      }
    } catch (err) {
      console.error('Error fetching members:', err);
      setError('Failed to load members. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers(currentPage);
  }, [project.project_hash, currentPage]);

  const searchUsers = async (query: string = '') => {
    try {
      setIsSearching(true);
      const response = await userService.getUsers({
        search: query.trim() || undefined, // Send undefined instead of empty string
        limit: 10,
      });
      
      if (response.success && response.users) {
        // Filter out users who are already members
        const memberHashes = members.map(m => m.user_hash);
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
    const debounceTimer = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, members]);

  // Perform initial search when modal opens
  useEffect(() => {
    if (isAddModalOpen) {
      searchUsers(''); // Load all available users initially
    }
  }, [isAddModalOpen, members]);

  const handleAddMember = async (user: User) => {
    try {
      setIsAdding(user.user_hash);
      const response = await projectService.addProjectMember(
        project.project_hash,
        user.user_hash
      );
      
      if (response.success) {
        // Refresh members list
        fetchMembers(currentPage);
        setIsAddModalOpen(false);
        setSearchQuery('');
        setSearchResults([]);
      } else {
        setError('Failed to add member. Please try again.');
      }
    } catch (err) {
      console.error('Error adding member:', err);
      setError('Failed to add member. Please try again.');
    } finally {
      setIsAdding(null);
    }
  };

  const handleRemoveMember = async (member: ProjectMember) => {
    try {
      setIsRemoving(member.user_hash);
      const response = await projectService.removeProjectMember(
        project.project_hash,
        member.user_hash
      );
      
      if (response.success) {
        // Refresh members list
        fetchMembers(currentPage);
        setConfirmDelete(null);
      } else {
        setError('Failed to remove member. Please try again.');
      }
    } catch (err) {
      console.error('Error removing member:', err);
      setError('Failed to remove member. Please try again.');
    } finally {
      setIsRemoving(null);
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

  const columns: TableColumn<ProjectMember>[] = [
    { key: 'username', header: 'Username', sortable: true },
    { key: 'email', header: 'Email', sortable: false },
    { key: 'user_type', header: 'User Type', sortable: true },
    { 
      key: 'access_level', 
      header: 'Access Level', 
      sortable: false,
      render: (value) => value || 'read-only'
    },
    { 
      key: 'joined_at', 
      header: 'Added', 
      sortable: true,
      render: (value, member) => formatDate(value as string || member.created_at)
    },
    { 
      key: 'user_hash', 
      header: 'Actions', 
      sortable: false,
      render: (_, member) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setConfirmDelete(member)}
          disabled={isRemoving === member.user_hash}
          isLoading={isRemoving === member.user_hash}
        >
          Remove
        </Button>
      )
    },
  ];

  if (error) {
    return (
      <div className="project-members-tab">
        <div className="members-error">
          <div className="members-error-content">
            <p>{error}</p>
            <Button onClick={() => fetchMembers(currentPage)}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="project-members-tab">
      <div className="members-header">
        <h3>Project Members ({members.length})</h3>
        <Button onClick={() => setIsAddModalOpen(true)}>
          Add Member
        </Button>
      </div>

      {isLoading ? (
        <div className="members-loading">
          <LoadingSpinner />
        </div>
      ) : members.length === 0 ? (
        <div className="members-empty">
          <div className="members-empty-content">
            <p>No members found for this project.</p>
            <Button onClick={() => setIsAddModalOpen(true)}>
              Add First Member
            </Button>
          </div>
        </div>
      ) : (
        <>
          <Table
            columns={columns}
            data={members}
            emptyMessage="No members found"
          />
          
          {totalPages > 1 && (
            <div className="pagination-centered">
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

      {/* Add Member Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSearchQuery('');
          setSearchResults([]);
          setIsSearching(false);
        }}
        title="Add Project Member"
      >
                  <div className="project-modal-content-wide">
          <div className="modal-form-field">
            <Input
              placeholder="Search users by username or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {isSearching ? (
            <div className="modal-loading-centered">
              <LoadingSpinner />
            </div>
          ) : searchResults.length > 0 ? (
            <div className="user-search-results-container">
              {searchResults.map(user => (
                <div key={user.user_hash} className="user-search-item">
                  <div>
                    <div className="user-search-name">{user.username}</div>
                    <div className="user-search-email">
                      {user.email}
                    </div>
                    <div className="user-search-type">
                      {user.user_type}
                    </div>
                  </div>
                  <Button
                    size="sm"
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
            <div className="modal-text-centered">
              No users found matching "{searchQuery}"
            </div>
          ) : (
            <div className="modal-text-centered">
              No available users to add to this project
            </div>
          )}
        </div>
      </Modal>

      {/* Remove Member Confirmation */}
      {confirmDelete && (
        <ConfirmDialog
          isOpen={true}
          title="Remove Member"
          message={`Are you sure you want to remove ${confirmDelete.username} from this project?`}
          confirmText="Remove"
          cancelText="Cancel"
          onConfirm={() => handleRemoveMember(confirmDelete)}
          onClose={() => setConfirmDelete(null)}
          isLoading={isRemoving === confirmDelete.user_hash}
        />
      )}
    </div>
  );
}; 