import React from 'react';
import { Link } from 'react-router-dom';
import { UserIcon, ProjectIcon, GroupIcon, SettingsIcon, HealthIcon, SecurityIcon, ChevronIcon } from '@/components/icons';
import type { QuickAction } from '@/types/dashboard.types';

interface QuickActionCardProps {
  action: QuickAction;
}

export function QuickActionCard({ action }: QuickActionCardProps): React.JSX.Element {
  const getIcon = (iconName: string) => {
    const icons: Record<string, React.ReactElement> = {
      'user-plus': <UserIcon size="lg" />,
      'folder-plus': <ProjectIcon size="lg" />,
      'users': <GroupIcon size="lg" />,
      'settings': <SettingsIcon size="lg" />,
      'bar-chart': <HealthIcon size="lg" />,
      'shield': <SecurityIcon size="lg" />,
    };

    return icons[iconName] || <UserIcon size="lg" />;
  };

  return (
    <Link to={action.href} className="quick-action-card-link">
      <div className={`quick-action-card quick-action-${action.color}`}>
        <div className="action-icon">
          {getIcon(action.icon)}
        </div>
        
        <div className="action-content">
          <h3 className="action-title">{action.title}</h3>
          <p className="action-description">{action.description}</p>
        </div>
        
        <div className="action-arrow">
          <ChevronIcon size="md" direction="right" />
        </div>
      </div>
    </Link>
  );
}

export default QuickActionCard; 