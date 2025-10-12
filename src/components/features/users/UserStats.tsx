import React from 'react';
import { UserIcon, CheckIcon, WarningIcon, GroupIcon } from '@/components/icons';
import type { User } from '@/types/auth.types';

interface UserStatsProps {
  users: User[];
  isLoading?: boolean;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  variant?: 'default' | 'success' | 'warning' | 'info';
  isLoading?: boolean;
}

function StatCard({ icon, label, value, variant = 'default', isLoading }: StatCardProps) {
  const variantClasses = {
    default: 'stat-card-default',
    success: 'stat-card-success',
    warning: 'stat-card-warning',
    info: 'stat-card-info',
  };

  return (
    <div className={`user-stat-card ${variantClasses[variant]}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <div className="stat-label">{label}</div>
        {isLoading ? (
          <div className="stat-value skeleton skeleton-text"></div>
        ) : (
          <div className="stat-value">{value}</div>
        )}
      </div>
    </div>
  );
}

export function UserStats({ users, isLoading }: UserStatsProps): React.JSX.Element {
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.is_active).length;
  const inactiveUsers = totalUsers - activeUsers;
  
  const usersByType = {
    root: users.filter(u => u.user_type === 'root').length,
    admin: users.filter(u => u.user_type === 'admin').length,
    consumer: users.filter(u => u.user_type === 'consumer').length,
  };

  return (
    <div className="user-stats-container">
      <StatCard
        icon={<UserIcon size="medium" />}
        label="Total Users"
        value={totalUsers}
        variant="default"
        isLoading={isLoading}
      />
      <StatCard
        icon={<CheckIcon size="medium" />}
        label="Active Users"
        value={activeUsers}
        variant="success"
        isLoading={isLoading}
      />
      <StatCard
        icon={<WarningIcon size="medium" />}
        label="Inactive Users"
        value={inactiveUsers}
        variant="warning"
        isLoading={isLoading}
      />
      <StatCard
        icon={<GroupIcon size="medium" />}
        label="Admin Users"
        value={usersByType.admin}
        variant="info"
        isLoading={isLoading}
      />
    </div>
  );
}

export default UserStats;
