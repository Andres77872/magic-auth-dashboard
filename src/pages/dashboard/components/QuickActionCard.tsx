import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, User, FolderKanban, Users, Settings, Activity, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { QuickAction } from '@/types/dashboard.types';

interface QuickActionCardProps {
  action: QuickAction;
}

const colorStyles: Record<string, string> = {
  primary: 'border-l-primary hover:bg-blue-50 dark:hover:bg-blue-950/20',
  success: 'border-l-success hover:bg-green-50 dark:hover:bg-green-950/20',
  warning: 'border-l-warning hover:bg-amber-50 dark:hover:bg-amber-950/20',
  info: 'border-l-info hover:bg-cyan-50 dark:hover:bg-cyan-950/20',
};

const iconColorStyles: Record<string, string> = {
  primary: 'text-primary-600',
  success: 'text-success',
  warning: 'text-warning',
  info: 'text-info',
};

export function QuickActionCard({ action }: QuickActionCardProps): React.JSX.Element {
  const getIcon = (iconName: string) => {
    const icons: Record<string, React.ReactElement> = {
      'user-plus': <User size={24} />,
      'folder-plus': <FolderKanban size={24} />,
      'users': <Users size={24} />,
      'settings': <Settings size={24} />,
      'bar-chart': <Activity size={24} />,
      'shield': <ShieldCheck size={24} />,
    };

    return icons[iconName] || <User size={24} />;
  };

  return (
    <Link to={action.href} className="block no-underline">
      <div className={cn(
        'flex items-center gap-4 p-4 rounded-lg border border-border border-l-4 bg-card transition-colors',
        colorStyles[action.color]
      )}>
        <div className={cn('shrink-0', iconColorStyles[action.color])}>
          {getIcon(action.icon)}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground">{action.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
        </div>
        
        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
      </div>
    </Link>
  );
}

export default QuickActionCard; 