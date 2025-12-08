import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { User as UserIcon, Check, AlertTriangle, Users } from 'lucide-react';
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

const variantStyles = {
  default: 'bg-card text-foreground [&_.stat-icon]:bg-muted [&_.stat-icon]:text-muted-foreground',
  success: 'bg-card text-foreground [&_.stat-icon]:bg-green-100 [&_.stat-icon]:text-green-600 dark:[&_.stat-icon]:bg-green-950 dark:[&_.stat-icon]:text-green-400',
  warning: 'bg-card text-foreground [&_.stat-icon]:bg-yellow-100 [&_.stat-icon]:text-yellow-600 dark:[&_.stat-icon]:bg-yellow-950 dark:[&_.stat-icon]:text-yellow-400',
  info: 'bg-card text-foreground [&_.stat-icon]:bg-blue-100 [&_.stat-icon]:text-blue-600 dark:[&_.stat-icon]:bg-blue-950 dark:[&_.stat-icon]:text-blue-400',
};

function StatCard({ icon, label, value, variant = 'default', isLoading }: StatCardProps) {
  return (
    <Card className={cn('overflow-hidden', variantStyles[variant])}>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="stat-icon flex h-12 w-12 items-center justify-center rounded-lg">
          {icon}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
          {isLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <span className="text-2xl font-bold">{value}</span>
          )}
        </div>
      </CardContent>
    </Card>
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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={<UserIcon size={20} aria-hidden="true" />}
        label="Total Users"
        value={totalUsers}
        variant="default"
        isLoading={isLoading}
      />
      <StatCard
        icon={<Check size={20} aria-hidden="true" />}
        label="Active Users"
        value={activeUsers}
        variant="success"
        isLoading={isLoading}
      />
      <StatCard
        icon={<AlertTriangle size={20} aria-hidden="true" />}
        label="Inactive Users"
        value={inactiveUsers}
        variant="warning"
        isLoading={isLoading}
      />
      <StatCard
        icon={<Users size={20} aria-hidden="true" />}
        label="Admin Users"
        value={usersByType.admin}
        variant="info"
        isLoading={isLoading}
      />
    </div>
  );
}

export default UserStats;
