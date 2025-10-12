import React from 'react';
import { ActionsMenu } from '@/components/common';
import type { ActionMenuItem } from '@/components/common';
import { ViewIcon, EditIcon, DeleteIcon } from '@/components/icons';
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

  const menuItems: ActionMenuItem[] = [
    {
      key: 'view',
      label: 'View Details',
      icon: <ViewIcon size="sm" />,
      onClick: handleViewDetails,
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: <EditIcon size="sm" />,
      onClick: handleEdit,
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <DeleteIcon size="sm" />,
      onClick: handleDelete,
      destructive: true,
    },
  ];

  return (
    <ActionsMenu
      items={menuItems}
      ariaLabel={`Actions for ${group.group_name}`}
      placement="bottom-right"
    />
  );
}; 