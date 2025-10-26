import React from 'react';

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
}

/**
 * Standardized tab navigation component
 * Use this for consistent tab UI across all pages
 */
export function TabNavigation({
  tabs,
  activeTab,
  onChange,
  className = '',
}: TabNavigationProps): React.JSX.Element {
  return (
    <div className={`tab-navigation ${className}`.trim()} role="tablist">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const buttonClasses = [
          'tab-navigation-item',
          isActive && 'tab-navigation-item-active',
          tab.disabled && 'tab-navigation-item-disabled',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            className={buttonClasses}
            onClick={() => !tab.disabled && onChange(tab.id)}
            disabled={tab.disabled}
          >
            {tab.icon && <span className="tab-navigation-icon" aria-hidden="true">{tab.icon}</span>}
            <span className="tab-navigation-label">{tab.label}</span>
            {tab.count !== undefined && (
              <span className="tab-navigation-count" aria-label={`${tab.count} items`}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default TabNavigation;

