import React from 'react';
import { Modal, Badge, Button } from '@/components/common';
import { UserAvatar } from './UserAvatar';
import { EditIcon, GroupIcon, ProjectIcon, ClockIcon } from '@/components/icons';
import { formatDateTime, getUserTypeBadgeVariant, truncateHash } from '@/utils/component-utils';
import type { User } from '@/types/auth.types';

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onEdit?: () => void;
}

export function UserDetailsModal({
  isOpen,
  onClose,
  user,
  onEdit
}: UserDetailsModalProps): React.JSX.Element {
  if (!user) return <></>;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="User Details"
      size="md"
    >
      <div className="modal-body">
        {/* User Header */}
        <div className="user-details-header">
          <UserAvatar 
            username={user.username} 
            userType={user.user_type}
            size="lg"
          />
          <div className="user-details-header-info">
            <h3 className="user-details-username">{user.username}</h3>
            <p className="user-details-hash">{truncateHash(user.user_hash)}</p>
            <div className="user-details-badges">
              <Badge 
                variant={getUserTypeBadgeVariant(user.user_type)}
                size="sm"
              >
                {user.user_type.toUpperCase()}
              </Badge>
              <Badge 
                variant={user.is_active ? 'success' : 'secondary'} 
                size="sm" 
                dot
              >
                {user.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </div>

        {/* User Information */}
        <div className="user-details-section">
          <h4 className="user-details-section-title">Contact Information</h4>
          <div className="user-details-grid">
            <div className="user-details-field">
              <span className="user-details-label">Email</span>
              <span className="user-details-value">{user.email || 'Not provided'}</span>
            </div>
            <div className="user-details-field">
              <span className="user-details-label">Created At</span>
              <span className="user-details-value">
                <ClockIcon size={14} />
                {formatDateTime(user.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Groups */}
        {user.groups && user.groups.length > 0 && (
          <div className="user-details-section">
            <h4 className="user-details-section-title">
              <GroupIcon size={16} aria-hidden="true" />
              Groups ({user.groups.length})
            </h4>
            <div className="user-details-badges-list">
              {user.groups.map(group => (
                <Badge key={group.group_hash} variant="secondary" size="sm">
                  {group.group_name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {user.projects && user.projects.length > 0 && (
          <div className="user-details-section">
            <h4 className="user-details-section-title">
              <ProjectIcon size={16} aria-hidden="true" />
              Projects ({user.projects.length})
            </h4>
            <div className="user-details-badges-list">
              {user.projects.map(project => (
                <Badge key={project.project_hash} variant="info" size="sm">
                  {project.project_name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* User Type Info */}
        {user.user_type_info && (
          <div className="user-details-section">
            <h4 className="user-details-section-title">User Type Information</h4>
            <div className="user-details-info-box">
              {user.user_type_info.error ? (
                <p className="text-error">{user.user_type_info.error}</p>
              ) : (
                <p className="text-muted">No additional information available</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="modal-footer">
        {onEdit && (
          <Button
            variant="primary"
            onClick={onEdit}
            leftIcon={<EditIcon size={16} aria-hidden="true" />}
          >
            Edit User
          </Button>
        )}
        <Button
          variant="outline"
          onClick={onClose}
        >
          Close
        </Button>
      </div>
    </Modal>
  );
}

export default UserDetailsModal;

