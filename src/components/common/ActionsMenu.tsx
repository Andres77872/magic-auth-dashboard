import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MoreIcon } from '@/components/icons';
import { cn } from '@/utils/component-utils';

export interface ActionMenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
  hidden?: boolean;
}

export interface ActionsMenuProps {
  items: ActionMenuItem[];
  triggerLabel?: string;
  triggerIcon?: React.ReactNode;
  triggerClassName?: string;
  menuClassName?: string;
  placement?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  /** Use portal for positioning (default: true) */
  usePortal?: boolean;
  /** Aria label for accessibility */
  ariaLabel?: string;
}

/**
 * Reusable actions menu component with dropdown
 * Supports both portal-based and inline positioning
 */
export function ActionsMenu({
  items,
  triggerLabel,
  triggerIcon = <MoreIcon size="sm" />,
  triggerClassName,
  menuClassName,
  placement = 'bottom-right',
  usePortal = true,
  ariaLabel = 'Actions menu',
}: ActionsMenuProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyles, setMenuStyles] = useState<{ top: number; left: number; minWidth: number } | null>(null);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstItemRef = useRef<HTMLButtonElement>(null);

  // Filter out hidden items
  const visibleItems = items.filter(item => !item.hidden);
  
  // Group items by divider (destructive items typically separated)
  const regularItems = visibleItems.filter(item => !item.destructive);
  const destructiveItems = visibleItems.filter(item => item.destructive);
  const hasDivider = regularItems.length > 0 && destructiveItems.length > 0;

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger || !usePortal) return;

    const rect = trigger.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const menuWidth = 240;
    const menuHeight = 280; // approximate
    const offset = 6;

    let top = rect.bottom + offset;
    let left = rect.right - menuWidth;

    // Adjust based on placement preference
    if (placement.startsWith('top')) {
      top = rect.top - offset - menuHeight;
    }
    if (placement.endsWith('left')) {
      left = rect.left;
    }

    // Prevent overflow
    if (top + menuHeight > viewportHeight) {
      top = Math.max(8, viewportHeight - menuHeight - 8);
    }
    if (top < 8) {
      top = 8;
    }
    if (left + menuWidth > viewportWidth) {
      left = Math.max(8, viewportWidth - menuWidth - 8);
    }
    if (left < 8) {
      left = 8;
    }

    setMenuStyles({ top, left, minWidth: 200 });
  }, [placement, usePortal]);

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current &&
        triggerRef.current &&
        !menuRef.current.contains(target) &&
        !triggerRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    const handleScroll = () => {
      if (isOpen && usePortal) updateMenuPosition();
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside, true);
      document.addEventListener('keydown', handleKeyDown);
      window.addEventListener('resize', handleScroll);
      document.addEventListener('scroll', handleScroll, true);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleScroll);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen, updateMenuPosition, usePortal]);

  // Position menu when opened
  useEffect(() => {
    if (isOpen) {
      updateMenuPosition();
      setTimeout(() => firstItemRef.current?.focus(), 0);
    }
  }, [isOpen, updateMenuPosition]);

  const handleItemClick = (item: ActionMenuItem) => {
    if (!item.disabled) {
      item.onClick();
      setIsOpen(false);
    }
  };

  const renderMenuItem = (item: ActionMenuItem, index: number) => (
    <button
      key={item.key}
      type="button"
      ref={index === 0 ? firstItemRef : undefined}
      className={cn(
        'menu-item',
        item.destructive && 'destructive',
        item.disabled && 'disabled'
      )}
      role="menuitem"
      onClick={() => handleItemClick(item)}
      disabled={item.disabled}
    >
      {item.icon && <span className="menu-item-icon">{item.icon}</span>}
      <span className="menu-item-label">{item.label}</span>
    </button>
  );

  const renderMenu = () => (
    <div
      className={cn('menu-dropdown', menuClassName)}
      role="menu"
      ref={menuRef}
      style={
        usePortal && menuStyles
          ? { position: 'fixed', top: menuStyles.top, left: menuStyles.left, minWidth: menuStyles.minWidth, zIndex: 1000 }
          : undefined
      }
    >
      {regularItems.map((item, index) => renderMenuItem(item, index))}
      
      {hasDivider && <div className="menu-divider" />}
      
      {destructiveItems.map((item, index) => renderMenuItem(item, regularItems.length + index))}
    </div>
  );

  return (
    <div className="actions-menu">
      <button
        type="button"
        className={cn('menu-trigger', triggerClassName)}
        ref={triggerRef}
        onClick={() => setIsOpen(v => !v)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={ariaLabel}
      >
        {triggerIcon}
        {triggerLabel && <span className="menu-trigger-label">{triggerLabel}</span>}
      </button>
      
      {isOpen && (usePortal && menuStyles ? createPortal(renderMenu(), document.body) : renderMenu())}
    </div>
  );
}

export default ActionsMenu;
