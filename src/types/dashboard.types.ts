import type { HealthComponent } from './system.types';

// Dashboard Types
export interface DashboardStats {
  // Core totals
  totalUsers: number;
  activeProjects: number;
  activeSessions: number;
  userGroups: number;
  projectGroups: number;
  recentActivities: number;
  
  // User breakdown
  rootUsers: number;
  adminUsers: number;
  consumerUsers: number;
  
  // Growth metrics (7-day)
  newUsersWeek: number;
  newProjectsWeek: number;
  activitiesWeek: number;
  userGrowthPercent: number;
  projectGrowthPercent: number;
  
  // Group averages
  avgUsersPerGroup: number;
  avgProjectsPerGroup: number;
  
  // System info (from /system/info)
  systemVersion: string;
  environment: string;
  authType: string;
  
  // Health status
  systemHealthStatus: 'healthy' | 'warning' | 'critical';
}

export interface StatCardData {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
  };
  icon: string;
  color: 'primary' | 'success' | 'warning' | 'info';
  clickable?: boolean;
  href?: string;
}

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  href: string;
  color: 'primary' | 'success' | 'warning' | 'info';
  requiredUserType: 'admin' | 'root';
}

export interface SystemHealthData {
  status: 'healthy' | 'warning' | 'critical' | 'degraded' | 'unhealthy';
  timestamp: string;
  components: {
    database: HealthComponent;
    redis: HealthComponent;
    group_system: HealthComponent;
  };
}

export interface WelcomeData {
  userName: string;
  userType: string;
  lastLogin?: string;
  currentTime: string;
  systemStatus: 'online' | 'maintenance';
} 