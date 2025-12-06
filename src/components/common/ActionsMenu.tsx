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
  usePortal?: boolean;
  ariaLabel?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ActionsMenu({
  items,
  triggerLabel,
  triggerIcon = <MoreIcon size={16} />,
  triggerClassName,
  menuClassName,
  placement = 'bottom-right',
  usePortal = true,
  ariaLabel = 'Actions menu',
  size = 'md',
}: ActionsMenuProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyles, setMenuStyles] = useState<{ top: number; left: number; minWidth: number } | null>(null);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstItemRef = useRef<HTMLButtonElement>(null);

  const visibleItems = items.filter(item => !item.hidden);
  const regularItems = visibleItems.filter(item => !item.destructive);
  const destructiveItems = visibleItems.filter(item => item.destructive);
  const hasDivider = regularItems.length > 0 && destructiveItems.length > 0;

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger || !usePortal) return;

    const rect = trigger.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const menuWidth = 220;
    const menuHeight = 280;
    const offset = 4;

    let top = rect.bottom + offset;
    let left = rect.right - menuWidth;

    if (placement.startsWith('top')) {
      top = rect.top - offset - menuHeight;
    }
    if (placement.endsWith('left')) {
      left = rect.left;
    }

    if (top + menuHeight > viewportHeight) {
      top = Math.max(8, viewportHeight - menuHeight - 8);
    }
    if (top < 8) top = 8;
    if (left + menuWidth > viewportWidth) {
      left = Math.max(8, viewportWidth - menuWidth - 8);
    }
    if (left < 8) left = 8;

    setMenuStyles({ top, left, minWidth: 180 });
  }, [placement, usePortal]);

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

  const handleKeyNavigation = (event: React.KeyboardEvent, currentIndex: number) => {
    const allItems = [...regularItems, ...destructiveItems];
    let nextIndex = currentIndex;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      nextIndex = (currentIndex + 1) % allItems.length;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      nextIndex = (currentIndex - 1 + allItems.length) % allItems.length;
    }

    if (nextIndex !== currentIndex) {
      const buttons = menuRef.current?.querySelectorAll('button[role="menuitem"]');
      (buttons?.[nextIndex] as HTMLButtonElement)?.focus();
    }
  };

  const renderMenuItem = (item: ActionMenuItem, _index: number, globalIndex: number) => (
    <button
      key={item.key}
      type="button"
      ref={globalIndex === 0 ? firstItemRef : undefined}
      className={cn(
        'actions-menu__item',
        item.destructive && 'actions-menu__item--destructive',
        item.disabled && 'actions-menu__item--disabled'
      )}
      role="menuitem"
      onClick={() => handleItemClick(item)}
      onKeyDown={(e) => handleKeyNavigation(e, globalIndex)}
      disabled={item.disabled}
      tabIndex={globalIndex === 0 ? 0 : -1}
    >
      {item.icon && <span className="actions-menu__item-icon" aria-hidden="true">{item.icon}</span>}
      <span className="actions-menu__item-label">{item.label}</span>
    </button>
  );

  const renderMenu = () => (
    <div
      className={cn('actions-menu__dropdown', `actions-menu__dropdown--${size}`, menuClassName)}
      role="menu"
      ref={menuRef}
      aria-label={ariaLabel}
      style={
        usePortal && menuStyles
          ? { position: 'fixed', top: menuStyles.top, left: menuStyles.left, minWidth: menuStyles.minWidth, zIndex: 1060 }
          : undefined
      }
    >
      {regularItems.map((item, index) => renderMenuItem(item, index, index))}
      {hasDivider && <div className="actions-menu__divider" role="separator" />}
      {destructiveItems.map((item, index) => renderMenuItem(item, index, regularItems.length + index))}
    </div>
  );

  const sizeClasses = {
    sm: 'btn btn-ghost btn-sm',
    md: 'btn btn-ghost btn-md',
    lg: 'btn btn-ghost btn-lg',
  };

  return (
    <div className="actions-menu">
      <button
        type="button"
        className={cn(sizeClasses[size], 'actions-menu__trigger', triggerClassName)}
        ref={triggerRef}
        onClick={() => setIsOpen(v => !v)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={ariaLabel}
      >
        {triggerIcon}
        {triggerLabel && <span className="actions-menu__trigger-label">{triggerLabel}</span>}
      </button>
      
      {isOpen && (usePortal && menuStyles ? createPortal(renderMenu(), document.body) : renderMenu())}
    </div>
  );
}

export default ActionsMenu;
