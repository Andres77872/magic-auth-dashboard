import React from 'react';
import { Card, Badge } from '../primitives';
import { cn } from '@/utils/component-utils';

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
    <div className={cn('tab-navigation', `tab-navigation--${size}`, className)} role="tablist">
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
              'tab-navigation__item',
              isActive && 'tab-navigation__item--active',
              tab.disabled && 'tab-navigation__item--disabled'
            )}
            onClick={() => !tab.disabled && onChange(tab.id)}
            disabled={tab.disabled}
            tabIndex={isActive ? 0 : -1}
          >
            {tab.icon && <span className="tab-navigation__icon" aria-hidden="true">{tab.icon}</span>}
            <span className="tab-navigation__label">{tab.label}</span>
            {tab.count !== undefined && (
              <Badge variant="secondary" size="sm" className="tab-navigation__count">
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
      <Card className="tab-navigation__container" padding="none">
        {tabNavigation}
        {children && (
          <div 
            className="tab-navigation__panel"
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

