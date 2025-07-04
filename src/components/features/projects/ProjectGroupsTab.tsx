import React, { useState, useEffect } from 'react';
import { Button, LoadingSpinner, Table, Pagination, ConfirmDialog } from '@/components/common';
import { projectService } from '@/services';
import type { ProjectDetails } from '@/types/project.types';
import type { UserGroup } from '@/types/group.types';
import { AssignGroupToProjectModal } from './AssignGroupToProjectModal';

interface ProjectGroupsTabProps {
  project: ProjectDetails;
}

export const ProjectGroupsTab: React.FC<ProjectGroupsTabProps> = ({ project }) => {
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<UserGroup | null>(null);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  const fetchGroups = async (page = 1) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await projectService.getProjectGroups(project.project_hash, {
        limit: 10,
        offset: (page - 1) * 10,
      });
      
      if (response.success && response.user_groups) {
        setGroups(response.user_groups);
        // Handle pagination data
        if (response.pagination) {
          setTotalPages(Math.ceil(response.pagination.total / 10));
          setTotalItems(response.pagination.total);
        } else {
          setTotalItems(response.user_groups.length);
        }
      } else {
        setError(response.message || 'Failed to load groups');
      }
    } catch (err) {
      console.error('Error fetching groups:', err);
      setError('Failed to load groups. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups(currentPage);
  }, [project.project_hash, currentPage]);

  const handleAssignGroup = async (groupHash: string) => {
    try {
      setIsAssigning(true);
      const response = await projectService.assignGroupToProject(
        project.project_hash,
        groupHash
      );
      
      if (response.success) {
        // Refresh groups list
        await fetchGroups(currentPage);
        setIsAssignModalOpen(false);
      } else {
        setError(response.message || 'Failed to assign group. Please try again.');
      }
    } catch (err) {
      console.error('Error assigning group:', err);
      setError('Failed to assign group. Please try again.');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveGroup = async (group: UserGroup) => {
    try {
      setIsRemoving(group.group_hash);
      const response = await projectService.removeGroupFromProject(
        project.project_hash,
        group.group_hash
      );
      
      if (response.success) {
        // Refresh groups list
        await fetchGroups(currentPage);
        setConfirmRemove(null);
      } else {
        setError(response.message || 'Failed to remove group. Please try again.');
      }
    } catch (err) {
      console.error('Error removing group:', err);
      setError('Failed to remove group. Please try again.');
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

  type TableRow = {
    group_name: string;
    description: string;
    member_count: string;
    created_at: string;
    actions: React.ReactElement;
  };

  const columns: Array<{ key: keyof TableRow; header: string; sortable: boolean }> = [
    { key: 'group_name', header: 'Group Name', sortable: true },
    { key: 'description', header: 'Description', sortable: false },
    { key: 'member_count', header: 'Members', sortable: true },
    { key: 'created_at', header: 'Created', sortable: true },
    { key: 'actions', header: 'Actions', sortable: false },
  ];

  const tableData: TableRow[] = groups.map(group => ({
    group_name: group.group_name,
    description: group.description || 'No description',
    member_count: String(group.member_count || 0),
    created_at: formatDate(group.created_at),
    actions: (
      <Button
        variant="outline"
        size="small"
        onClick={() => setConfirmRemove(group)}
        disabled={isRemoving === group.group_hash}
        isLoading={isRemoving === group.group_hash}
      >
        Remove
      </Button>
    ),
  }));

  if (error) {
    return (
      <div className="project-groups-tab">
        <div className="groups-error">
          <div className="groups-error-content">
            <p>{error}</p>
            <Button onClick={() => fetchGroups(currentPage)}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="project-groups-tab">
      <div className="groups-header">
        <div className="groups-title">
          <h3>Project Groups ({totalItems})</h3>
          <p>Manage user groups that have access to this project</p>
        </div>
        <Button
          onClick={() => setIsAssignModalOpen(true)}
          disabled={isLoading}
        >
          Assign Group
        </Button>
      </div>

      {isLoading ? (
        <div className="groups-loading">
          <LoadingSpinner />
          <p>Loading groups...</p>
        </div>
      ) : groups.length === 0 ? (
        <div className="groups-empty">
          <div className="empty-content">
            <h4>No Groups Assigned</h4>
            <p>This project doesn't have any user groups assigned yet.</p>
            <Button onClick={() => setIsAssignModalOpen(true)}>
              Assign First Group
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="groups-table">
            <Table
              data={tableData}
              columns={columns}
              isLoading={isLoading}
              emptyMessage="No groups found"
            />
          </div>
          
          {totalPages > 1 && (
            <div className="groups-pagination">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={totalItems}
                itemsPerPage={10}
              />
            </div>
          )}
        </>
      )}

      {/* Assign Group Modal */}
      <AssignGroupToProjectModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onConfirm={handleAssignGroup}
        isLoading={isAssigning}
        projectName={project.project_name}
        assignedGroups={groups.map(g => g.group_hash)}
      />

      {/* Remove Group Confirmation */}
      {confirmRemove && (
        <ConfirmDialog
          isOpen={true}
          title="Remove Group"
          message={`Are you sure you want to remove "${confirmRemove.group_name}" from this project? This action cannot be undone.`}
          confirmText="Remove Group"
          cancelText="Cancel"
          variant="danger"
          onConfirm={() => handleRemoveGroup(confirmRemove)}
          onClose={() => setConfirmRemove(null)}
          isLoading={isRemoving === confirmRemove.group_hash}
        />
      )}
    </div>
  );
}; 