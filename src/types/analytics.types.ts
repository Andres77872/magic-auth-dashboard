export interface Activity {
  id: string;
  type: 'user_created' | 'user_updated' | 'user_deleted' | 'login' | 'logout' | 
        'project_created' | 'project_updated' | 'project_deleted' |
        'group_created' | 'group_updated' | 'permission_changed' | 'system_event';
  title: string;
  description: string;
  user: {
    user_hash: string;
    username: string;
    user_type: string;
  };
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
  metadata?: Record<string, any>;
}

export interface ActivityFilters {
  type?: string;
  userType?: string;
  severity?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  search?: string;
}

export interface ActivityResponse {
  activities: Activity[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

export interface UseRecentActivityOptions {
  filters?: ActivityFilters;
  page?: number;
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseRecentActivityReturn {
  activities: Activity[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  refetch: () => void;
  loadMore: () => Promise<void>;
}

// User Analytics Types (ROOT users only)
export interface UserActivityMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsersThisWeek: number;
  userGrowthRate: number;
  usersByType: {
    root: number;
    admin: number;
    consumer: number;
  };
}

export interface UserEngagementData {
  dailyActiveUsers: Array<{
    date: string;
    count: number;
  }>;
  avgSessionDuration: number;
  mostActiveUsers: Array<{
    user_hash: string;
    username: string;
    activityCount: number;
    lastActive: string;
  }>;
}

export interface SecurityMetrics {
  failedLoginAttempts: number;
  suspiciousActivities: number;
  securityEvents: Array<{
    type: string;
    count: number;
    severity: 'low' | 'medium' | 'high';
  }>;
  recentSecurityAlerts: Activity[];
}

export interface SystemMetrics {
  totalProjects: number;
  totalGroups: number;
  systemLoad: {
    cpu: number;
    memory: number;
    storage: number;
  };
  apiResponseTimes: {
    avg: number;
    p95: number;
    p99: number;
  };
  uptime: string;
}

export interface UserAnalyticsData {
  metrics: UserActivityMetrics;
  engagement: UserEngagementData;
  security: SecurityMetrics;
  system: SystemMetrics;
}

// Project Analytics Types (ADMIN users)
export interface ProjectMetrics {
  id: string;
  name: string;
  memberCount: number;
  activityCount: number;
  lastActivity: string;
  healthScore: number;
  recentActivities: Activity[];
}

export interface ProjectEngagementData {
  projectActivity: Array<{
    date: string;
    activityCount: number;
  }>;
  memberEngagement: Array<{
    user_hash: string;
    username: string;
    activityCount: number;
    lastActive: string;
  }>;
  popularActions: Array<{
    action: string;
    count: number;
  }>;
}

export interface ProjectAnalyticsData {
  projects: ProjectMetrics[];
  totalProjects: number;
  avgHealthScore: number;
  totalActivity: number;
  engagement: ProjectEngagementData;
}

// Chart Data Types
export interface ChartDataPoint {
  label: string;
  value: number;
  date?: string;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'doughnut';
  data: ChartDataPoint[];
  title: string;
  color?: string;
  height?: number;
}

// Export Types
export interface ExportOptions {
  format: 'csv' | 'json' | 'pdf';
  dateRange: {
    start: string;
    end: string;
  };
  includeCharts?: boolean;
  filters?: ActivityFilters;
}

export interface ExportData {
  filename: string;
  url: string;
  size: number;
  generatedAt: string;
}

// Date Range Presets
export type DateRangePreset = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'custom';

export interface DateRange {
  start: string;
  end: string;
  preset?: DateRangePreset;
} 