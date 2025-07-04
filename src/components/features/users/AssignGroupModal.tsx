import React, { useState, useEffect } from 'react';
import { Modal, Button, Input } from '@/components/common';
import { groupService } from '@/services';
import type { UserGroup } from '@/types/group.types';
import { SearchIcon, LoadingIcon, ErrorIcon, HealthIcon } from '@/components/icons';
import '@/styles/components/assign-project-modal.css'; // Reuse same styles

interface AssignGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedGroupHash: string) => void;
  initialSelection?: string[];
  isLoading?: boolean;
  userName?: string;
}

export function AssignGroupModal({
  isOpen,
  onClose,
  onConfirm,
  initialSelection = [],
  isLoading = false,
  userName = 'user'
}: AssignGroupModalProps): React.JSX.Element {
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>(initialSelection[0] || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [fetchingGroups, setFetchingGroups] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchGroups();
      setSelectedGroup(initialSelection[0] || '');
    }
  }, [isOpen, initialSelection]);

  const fetchGroups = async () => {
    setFetchingGroups(true);
    setError('');

    try {
      const response = await groupService.getGroups({ limit: 100 });
      if (response.success && Array.isArray(response.user_groups)) {
        setGroups(response.user_groups);
      } else {
        setError('Failed to load user groups');
      }
    } catch (err) {
      console.error('Error fetching groups:', err);
      setError('Failed to load user groups');
    } finally {
      setFetchingGroups(false);
    }
  };

  const filteredGroups = groups.filter(group =>
    group.group_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (group.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGroupSelect = (groupHash: string) => {
    setSelectedGroup(prev => (prev === groupHash ? '' : groupHash));
  };

  const handleConfirm = () => {
    if (!selectedGroup) return;
    onConfirm(selectedGroup);
  };

  const handleCancel = () => {
    setSelectedGroup(initialSelection[0] || '');
    setSearchTerm('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={`Assign Group to ${userName}`}
      size="large"
      className="assign-project-modal"
      closeOnBackdropClick={!isLoading}
      closeOnEscape={!isLoading}
    >
      <div className="assign-project-content">
        <div className="selection-header">
          <p className="selection-count">
            {selectedGroup ? 'Group selected' : 'Select a group (required)'}
          </p>
        </div>

        <div className="project-controls">
          <div className="search-section">
            <Input
              placeholder="Search groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<SearchIcon size="small" />}
              disabled={fetchingGroups}
            />
          </div>
        </div>

        <div className="project-list-container">
          {fetchingGroups ? (
            <div className="loading-state">
              <div className="loading-spinner">
                <LoadingIcon size="large" />
              </div>
              <p>Loading groups...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <div className="error-icon">
                <ErrorIcon size="large" />
              </div>
              <p>{error}</p>
              <Button variant="outline" size="small" onClick={fetchGroups}>
                Retry
              </Button>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <HealthIcon size="large" />
              </div>
              <p>{searchTerm ? 'No groups match your search.' : 'No user groups available.'}</p>
            </div>
          ) : (
            <div className="project-list">
              {filteredGroups.map(group => {
                const isSelected = selectedGroup === group.group_hash;
                return (
                  <div
                    key={group.group_hash}
                    className={`project-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleGroupSelect(group.group_hash)}
                  >
                    <div className="project-checkbox">
                      <input
                        type="radio"
                        name="group-selection"
                        checked={isSelected}
                        onChange={() => handleGroupSelect(group.group_hash)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="project-info">
                      <h4 className="project-name">{group.group_name}</h4>
                      {group.description && <p className="project-description">{group.description}</p>}
                      <div className="project-meta">
                        <span className="project-members">{group.member_count || 0} member{(group.member_count || 0) !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="modal-actions">
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>Cancel</Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            isLoading={isLoading}
            disabled={fetchingGroups || !selectedGroup}
          >
            {selectedGroup ? 'Assign Group' : 'Select a Group'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default AssignGroupModal; 