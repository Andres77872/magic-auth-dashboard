import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Users, FolderKanban, Activity, Settings, TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';
import type { StatCardData } from '@/types/dashboard.types';

interface StatCardProps {
  data: StatCardData;
  isLoading?: boolean;
}

const colorConfig: Record<string, { bg: string; icon: string; border: string }> = {
  primary: { 
    bg: 'bg-primary-50 dark:bg-primary-950/20', 
    icon: 'text-primary-600 dark:text-primary-400',
    border: 'border-l-primary-500'
  },
  success: { 
    bg: 'bg-green-50 dark:bg-green-950/20', 
    icon: 'text-success',
    border: 'border-l-success'
  },
  warning: { 
    bg: 'bg-amber-50 dark:bg-amber-950/20', 
    icon: 'text-warning',
    border: 'border-l-warning'
  },
  info: { 
    bg: 'bg-cyan-50 dark:bg-cyan-950/20', 
    icon: 'text-info',
    border: 'border-l-info'
  },
};

export function StatCard({ data, isLoading = false }: StatCardProps): React.JSX.Element {
  const config = colorConfig[data.color] || colorConfig.primary;

  const getIcon = (iconName: string) => {
    const iconProps = { size: 24, className: cn('shrink-0', config.icon) };
    
    const icons: Record<string, React.ReactElement> = {
      users: <Users {...iconProps} />,
      projects: <FolderKanban {...iconProps} />,
      sessions: <Activity {...iconProps} />,
      groups: <Users {...iconProps} />,
      settings: <Settings {...iconProps} />,
    };

    return icons[iconName] || icons.users;
  };

  const getChangeIcon = (type: 'increase' | 'decrease' | 'neutral') => {
    switch (type) {
      case 'increase':
        return <TrendingUp size={14} className="text-success" />;
      case 'decrease':
        return <TrendingDown size={14} className="text-destructive" />;
      default:
        return <Minus size={14} className="text-muted-foreground" />;
    }
  };

  if (isLoading) {
    return (
      <Card className="relative overflow-hidden border-l-4 border-l-muted">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-8 w-24 mb-2" />
          <Skeleton className="h-4 w-16" />
        </CardContent>
      </Card>
    );
  }

  const cardContent = (
    <Card 
      className={cn(
        'relative overflow-hidden border-l-4 transition-all duration-200',
        config.border,
        data.clickable && 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5 group'
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className={cn('p-2.5 rounded-lg', config.bg)}>
            {getIcon(data.icon)}
          </div>
          {data.change && (
            <div className={cn(
              'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
              data.change.type === 'increase' && 'bg-success/10 text-success',
              data.change.type === 'decrease' && 'bg-destructive/10 text-destructive',
              data.change.type === 'neutral' && 'bg-muted text-muted-foreground'
            )}>
              {getChangeIcon(data.change.type)}
              <span>{data.change.value > 0 ? '+' : ''}{data.change.value}%</span>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{data.title}</p>
          <p className="text-2xl font-bold text-foreground tracking-tight">{data.value}</p>
        </div>

        {data.clickable && (
          <div className="flex items-center gap-1 mt-4 pt-3 border-t border-border">
            <span className="text-xs font-medium text-muted-foreground group-hover:text-primary-600 transition-colors">
              View Details
            </span>
            <ChevronRight size={14} className="text-muted-foreground group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all" />
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (data.clickable && data.href) {
    return (
      <Link to={data.href} className="block no-underline">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}

export default StatCard;
