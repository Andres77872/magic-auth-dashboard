import React from 'react';
import { ActionsMenu } from '@/components/common';
import type { ActionMenuItem } from '@/components/common';
import { ViewIcon, EditIcon, DeleteIcon } from '@/components/icons';
import type { UserGroup } from '@/types/group.types';

interface GroupActionsMenuProps {
  group: UserGroup;
  onEdit?: (group: UserGroup) => void;
  onDelete?: (group: UserGroup) => void;
  onView?: (group: UserGroup) => void;
}

export const GroupActionsMenu: React.FC<GroupActionsMenuProps> = ({ 
  group, 
  onEdit,
  onDelete,
  onView 
}) => {

  const handleViewDetails = () => {
    if (onView) {
      onView(group);
    } else {
      // Fallback to navigation if callback not provided
      window.location.href = `/dashboard/groups/${group.group_hash}`;
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(group);
    } else {
      // Fallback to navigation if callback not provided
      window.location.href = `/dashboard/groups/${group.group_hash}/edit`;
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(group);
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
      label: 'Edit Group',
      icon: <EditIcon size="sm" />,
      onClick: handleEdit,
    },
  ];

  // Only add delete option if onDelete callback is provided
  if (onDelete) {
    menuItems.push({
      key: 'delete',
      label: 'Delete Group',
      icon: <DeleteIcon size="sm" />,
      onClick: handleDelete,
      destructive: true,
    });
  }

  return (
    <ActionsMenu
      items={menuItems}
      ariaLabel={`Actions for ${group.group_name}`}
      placement="bottom-right"
    />
  );
};
