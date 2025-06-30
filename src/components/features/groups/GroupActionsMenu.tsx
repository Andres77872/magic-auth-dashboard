import React from 'react';
import { Button } from '@/components/common';
import type { UserGroup } from '@/types/group.types';
import { ROUTES } from '@/utils/routes';

interface GroupActionsMenuProps {
  group: UserGroup;
}

export const GroupActionsMenu: React.FC<GroupActionsMenuProps> = ({ group }) => {

  const handleViewDetails = () => {
    window.location.href = `${ROUTES.GROUPS}/${group.group_hash}`;
  };

  const handleEdit = () => {
    window.location.href = `${ROUTES.GROUPS_EDIT}/${group.group_hash}`;
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete the group "${group.group_name}"?`)) {
      // TODO: Implement delete functionality
      console.log('Delete group:', group.group_hash);
    }
  };

  return (
    <div className="group-actions-menu">
      <div className="actions-inline">
        <Button
          variant="outline"
          size="small"
          onClick={handleViewDetails}
        >
          View
        </Button>
        <Button
          variant="outline"
          size="small"
          onClick={handleEdit}
        >
          Edit
        </Button>
        <Button
          variant="outline"
          size="small"
          onClick={handleDelete}
          style={{ color: 'var(--color-danger)' }}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}; 