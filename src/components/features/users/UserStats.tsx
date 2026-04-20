import React from 'react';
import { User as UserIcon, Check, AlertTriangle, Users } from 'lucide-react';
import { StatCard } from '@/components/common';
import type { User } from '@/types/auth.types';

interface UserStatsProps {
  users: User[];
  isLoading?: boolean;
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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Users"
        value={totalUsers}
        icon={<UserIcon className="h-5 w-5" aria-hidden="true" />}
        loading={isLoading}
      />
      <StatCard
        title="Active Users"
        value={activeUsers}
        icon={<Check className="h-5 w-5" aria-hidden="true" />}
        variant="success"
        gradient
        loading={isLoading}
      />
      <StatCard
        title="Inactive Users"
        value={inactiveUsers}
        icon={<AlertTriangle className="h-5 w-5" aria-hidden="true" />}
        variant="warning"
        gradient
        loading={isLoading}
      />
      <StatCard
        title="Admin Users"
        value={usersByType.admin}
        icon={<Users className="h-5 w-5" aria-hidden="true" />}
        variant="info"
        gradient
        loading={isLoading}
      />
    </div>
  );
}

export default UserStats;
