import React, { useId, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

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
  /** Wrap the tab bar and `children` panel in a card. */
  contained?: boolean;
  children?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /**
   * `underline` (default) is for page sections; `segmented` is a compact
   * switch for filters and view modes.
   */
  variant?: 'underline' | 'segmented';
  /** Accessible name for the tab list. */
  ariaLabel?: string;
}

const segmentedSize = {
  sm: 'h-7 px-2.5 text-xs',
  md: 'h-8 px-3 text-[13px]',
  lg: 'h-9 px-4 text-sm',
};

const underlineSize = {
  sm: 'pb-2 text-xs',
  md: 'pb-2.5 text-[13px]',
  lg: 'pb-3 text-sm',
};

/**
 * Accessible tabs (WAI-ARIA tabs pattern): one tab stop, arrow keys / Home /
 * End move focus and activate, disabled tabs are skipped.
 */
export function TabNavigation({
  tabs,
  activeTab,
  onChange,
  className = '',
  contained = false,
  children,
  size = 'md',
  variant = 'underline',
  ariaLabel,
}: TabNavigationProps): React.JSX.Element {
  const baseId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const tabId = (id: string): string => `${baseId}-tab-${id}`;
  const panelId = (id: string): string => `${baseId}-panel-${id}`;

  const enabledTabs = tabs.filter((tab) => !tab.disabled);

  const focusTab = (id: string): void => {
    const buttons =
      listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ??
      [];
    Array.from(buttons)
      .find((button) => button.dataset.tabId === id)
      ?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (enabledTabs.length === 0) return;
    const currentIndex = Math.max(
      enabledTabs.findIndex((tab) => tab.id === activeTab),
      0
    );
    let nextIndex: number;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = (currentIndex + 1) % enabledTabs.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex =
          (currentIndex - 1 + enabledTabs.length) % enabledTabs.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = enabledTabs.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    const next = enabledTabs[nextIndex];
    onChange(next.id);
    focusTab(next.id);
  };

  // Keep exactly one tab reachable with Tab, even if activeTab is unknown.
  const focusableId = enabledTabs.some((tab) => tab.id === activeTab)
    ? activeTab
    : enabledTabs[0]?.id;

  const tabList = (
    <div
      ref={listRef}
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      className={cn(
        variant === 'segmented'
          ? 'inline-flex items-center gap-0.5 rounded-md border border-border bg-secondary p-[3px]'
          : 'flex items-end gap-5 overflow-x-auto overflow-y-hidden shadow-[inset_0_-1px_0_var(--color-border)]',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={tabId(tab.id)}
            data-tab-id={tab.id}
            aria-selected={isActive}
            aria-controls={contained && children ? panelId(tab.id) : undefined}
            tabIndex={tab.id === focusableId ? 0 : -1}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && onChange(tab.id)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:h-4 [&_svg]:w-4',
              variant === 'segmented'
                ? cn(
                    'justify-center rounded-[4px]',
                    segmentedSize[size],
                    isActive
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )
                : cn(
                    'border-b-2 px-0.5',
                    underlineSize[size],
                    isActive
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )
            )}
          >
            {tab.icon && <span aria-hidden="true">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  'font-mono text-[11px] tabular-nums',
                  isActive
                    ? 'text-muted-foreground'
                    : 'text-muted-foreground/80'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  if (contained) {
    return (
      <Card className="overflow-hidden">
        <div
          className={cn(variant === 'segmented' ? 'border-b p-2' : 'px-4 pt-3')}
        >
          {tabList}
        </div>
        {children && (
          <div
            className="p-4"
            role="tabpanel"
            id={panelId(activeTab)}
            aria-labelledby={tabId(activeTab)}
          >
            {children}
          </div>
        )}
      </Card>
    );
  }

  return tabList;
}

export default TabNavigation;
