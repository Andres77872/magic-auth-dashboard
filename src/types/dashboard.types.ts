import type { HealthComponent } from './system.types';

// Dashboard Types
export interface DashboardStats {
  totalUsers: number;
  activeProjects: number;
  activeSessions: number;
  userGroups: number;
  systemVersion: string;
  environment: string;
  rootUsers?: number;
  adminUsers?: number;
  consumerUsers?: number;
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
  status: 'healthy' | 'warning' | 'critical';
  timestamp: string;
  components: {
    database: HealthComponent;
    cache: HealthComponent;
    authentication: HealthComponent;
  };
}

export interface WelcomeData {
  userName: string;
  userType: string;
  lastLogin?: string;
  currentTime: string;
  systemStatus: 'online' | 'maintenance';
} 