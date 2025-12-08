import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Users, Activity, Clock, ChevronRight, FolderKanban, User } from 'lucide-react';
import type { ProjectMetrics } from '@/types/analytics.types';

interface ProjectAnalyticsCardProps {
  project: ProjectMetrics;
  onClick?: () => void;
}

const healthConfig = {
  excellent: { color: 'text-success', bg: 'bg-success', label: 'Excellent' },
  good: { color: 'text-success', bg: 'bg-success', label: 'Good' },
  fair: { color: 'text-warning', bg: 'bg-warning', label: 'Fair' },
  poor: { color: 'text-destructive', bg: 'bg-destructive', label: 'Needs Attention' },
};

export function ProjectAnalyticsCard({ project, onClick }: ProjectAnalyticsCardProps): React.JSX.Element {
  const getHealthLevel = (score: number) => {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  };

  const formatLastActivity = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const healthLevel = getHealthLevel(project.healthScore);
  const config = healthConfig[healthLevel];

  return (
    <Card 
      className={cn(
        'transition-all duration-200 overflow-hidden',
        onClick && 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5 group'
      )}
      onClick={onClick}
    >
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-foreground truncate">{project.name}</h3>
            <p className="text-xs text-muted-foreground">ID: {project.id}</p>
          </div>
          
          <div className="text-right shrink-0">
            <div className={cn('text-2xl font-bold', config.color)}>
              {project.healthScore}%
            </div>
            <Badge variant="outline" className={cn('text-[10px]', config.color)}>
              {config.label}
            </Badge>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-lg font-semibold text-foreground">{project.memberCount}</p>
              <p className="text-[10px] text-muted-foreground">Members</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-lg font-semibold text-foreground">{project.activityCount}</p>
              <p className="text-[10px] text-muted-foreground">Activities</p>
            </div>
          </div>
        </div>

        {/* Last activity */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
          <Clock className="h-3.5 w-3.5" />
          <span>Last activity {formatLastActivity(project.lastActivity)}</span>
        </div>

        {/* Recent activities */}
        {project.recentActivities && project.recentActivities.length > 0 && (
          <div className="border-t border-border pt-4 mb-4">
            <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2">Recent Activity</h4>
            <div className="space-y-2">
              {project.recentActivities.slice(0, 3).map((activity) => (
                <div key={activity.id} className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                    {activity.type.includes('user') && <User className="h-3 w-3 text-muted-foreground" />}
                    {activity.type.includes('project') && <FolderKanban className="h-3 w-3 text-muted-foreground" />}
                    {activity.type.includes('group') && <Users className="h-3 w-3 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground truncate">{activity.title}</p>
                    <p className="text-[10px] text-muted-foreground">{formatLastActivity(activity.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {project.recentActivities.length > 3 && (
              <p className="text-xs text-muted-foreground mt-2">
                +{project.recentActivities.length - 3} more activities
              </p>
            )}
          </div>
        )}

        {/* Health bar & action */}
        <div className="space-y-3">
          <Progress 
            value={project.healthScore} 
            className={cn('h-1.5', config.bg)}
          />
          
          {onClick && (
            <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
              <span>View Details</span>
              <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ProjectAnalyticsCard;
