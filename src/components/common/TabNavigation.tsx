import React from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
  disabled?: boolean;
}

export interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
  contained?: boolean;
  children?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-4 text-sm',
  lg: 'h-10 px-5 text-base',
};

export function TabNavigation({
  tabs,
  activeTab,
  onChange,
  className = '',
  contained = false,
  children,
  size = 'md',
}: TabNavigationProps): React.JSX.Element {
  const tabNavigation = (
    <div
      className={cn(
        'inline-flex items-center rounded-lg bg-muted p-1 text-muted-foreground',
        className
      )}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            className={cn(
              'inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              sizeClasses[size],
              isActive
                ? 'bg-background text-foreground shadow'
                : 'hover:bg-background/50 hover:text-foreground',
              tab.disabled && 'pointer-events-none opacity-50'
            )}
            onClick={() => !tab.disabled && onChange(tab.id)}
            disabled={tab.disabled}
            tabIndex={isActive ? 0 : -1}
          >
            {tab.icon && (
              <span className="mr-2 [&>svg]:h-4 [&>svg]:w-4" aria-hidden="true">
                {tab.icon}
              </span>
            )}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                {tab.count}
              </Badge>
            )}
          </button>
        );
      })}
    </div>
  );

  if (contained) {
    return (
      <Card className="overflow-hidden">
        <div className="border-b p-1">{tabNavigation}</div>
        {children && (
          <div
            className="p-4"
            role="tabpanel"
            id={`tabpanel-${activeTab}`}
            aria-labelledby={`tab-${activeTab}`}
          >
            {children}
          </div>
        )}
      </Card>
    );
  }

  return tabNavigation;
}

export default TabNavigation;

