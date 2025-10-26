import React from 'react';
import { Table, Badge } from '@/components/common';
import type { TableColumn } from '@/components/common/Table';
import { ActionsMenu } from '@/components/common';
import type { ActionMenuItem } from '@/components/common';
import { EditIcon, DeleteIcon, ViewIcon } from '@/components/icons';
import type { Role } from '@/types/rbac.types';

interface RoleTableProps {
  roles: Role[];
  loading?: boolean;
  onEdit?: (role: Role) => void;
  onDelete?: (role: Role) => void;
  onView?: (role: Role) => void;
  emptyAction?: React.ReactNode;
}

export const RoleTable: React.FC<RoleTableProps> = ({
  roles,
  loading = false,
  onEdit,
  onDelete,
  onView,
  emptyAction
}) => {
  const columns: TableColumn<Role>[] = [
    {
      key: 'group_name',
      header: 'Role Name',
      sortable: true,
      render: (_value: any, role: Role) => (
        <div className="table-role-name-cell">
          <div className="table-role-name">{role.group_name}</div>
          {role.description && (
            <div className="table-role-description">
              {role.description}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      align: 'center',
      width: '100px',
      render: (_value: any, role: Role) => (
        <Badge variant="secondary">
          {role.priority || 50}
        </Badge>
      )
    },
    {
      key: 'is_active',
      header: 'Status',
      sortable: true,
      align: 'center',
      width: '120px',
      render: (_value: any, role: Role) => (
        <Badge variant={role.is_active ? 'success' : 'secondary'}>
          {role.is_active ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      key: 'id',
      header: 'Actions',
      width: '80px',
      align: 'center',
      render: (_value: any, role: Role) => {
        const menuItems: ActionMenuItem[] = [];

        if (onView) {
          menuItems.push({
            key: 'view',
            label: 'View Details',
            icon: <ViewIcon size="sm" />,
            onClick: () => onView(role)
          });
        }

        if (onEdit) {
          menuItems.push({
            key: 'edit',
            label: 'Edit Role',
            icon: <EditIcon size="sm" />,
            onClick: () => onEdit(role)
          });
        }

        if (onDelete) {
          menuItems.push({
            key: 'delete',
            label: 'Delete Role',
            icon: <DeleteIcon size="sm" />,
            onClick: () => onDelete(role),
            destructive: true
          });
        }

        return menuItems.length > 0 ? (
          <ActionsMenu
            items={menuItems}
            ariaLabel={`Actions for ${role.group_name}`}
            placement="bottom-right"
          />
        ) : null;
      }
    }
  ];

  return (
    <Table<Role>
      data={roles}
      columns={columns}
      isLoading={loading}
      emptyMessage="No roles found"
      emptyAction={emptyAction}
      skeletonRows={5}
      className="roles-table"
    />
  );
};
