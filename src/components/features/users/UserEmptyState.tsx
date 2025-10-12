import React from 'react';
import { Button, EmptyState } from '@/components/common';
import { UserIcon, SearchIcon } from '@/components/icons';

interface UserEmptyStateProps {
  hasFilters: boolean;
  onClearFilters?: () => void;
  onCreateUser?: () => void;
  canCreateUser?: boolean;
}

export function UserEmptyState({
  hasFilters,
  onClearFilters,
  onCreateUser,
  canCreateUser = false
}: UserEmptyStateProps): React.JSX.Element {
  if (hasFilters) {
    return (
      <EmptyState
        icon={<SearchIcon size={40} />}
        title="No users found"
        description="No users match your current filters. Try adjusting your search criteria."
        action={
          onClearFilters ? (
            <Button variant="outline" onClick={onClearFilters}>
              Clear Filters
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <EmptyState
      icon={<UserIcon size={40} />}
      title="No users yet"
      description={
        canCreateUser
          ? "Get started by creating your first user account."
          : "No users have been created yet. Contact an administrator to create user accounts."
      }
      action={
        canCreateUser && onCreateUser ? (
          <Button variant="primary" onClick={onCreateUser}>
            <UserIcon size={16} />
            Create First User
          </Button>
        ) : undefined
      }
    />
  );
}

export default UserEmptyState;
