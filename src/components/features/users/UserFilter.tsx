import React from 'react';
import { EntityFilter, type EntityFilterConfig } from '@/components/common/EntityFilter';

interface UserFilterProps {
  onFiltersChange: (filters: UserFilters) => void;
  initialFilters?: UserFilters;
}

export interface UserFilters {
  search?: string;
  userType?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
  sort_by?: string;
  sort_order?: string;
}

const USER_TYPE_OPTIONS = [
  { value: '', label: 'All User Types' },
  { value: 'root', label: 'ROOT Users' },
  { value: 'admin', label: 'ADMIN Users' },
  { value: 'consumer', label: 'CONSUMER Users' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

const filterConfig: EntityFilterConfig<UserFilters> = {
  searchPlaceholder: 'Search by username or email...',
  filterOptions: [
    {
      key: 'userType',
      label: 'User Type',
      options: USER_TYPE_OPTIONS,
    },
    {
      key: 'isActive',
      label: 'Status',
      options: STATUS_OPTIONS,
    },
  ],
};

/**
 * UserFilter component using consolidated EntityFilter
 * Follows Design System guidelines for spacing, icons, and interactions
 */
export function UserFilter({ 
  onFiltersChange, 
  initialFilters = {} 
}: UserFilterProps): React.JSX.Element {
  const handleClear = () => {
    onFiltersChange({});
  };

  return (
    <EntityFilter
      filters={initialFilters}
      onFiltersChange={onFiltersChange}
      onClear={handleClear}
      config={filterConfig}
      className="user-filter"
    />
  );
}

export default UserFilter; 