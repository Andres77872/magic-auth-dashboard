import React, { forwardRef, useState, useRef, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import type { TooltipPosition } from '../types';
import './Tooltip.css';

export interface TooltipProps {
  content: React.ReactNode;
  position?: TooltipPosition;
  delay?: number;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
  (
    {
      content,
      position = 'top',
      delay = 200,
      disabled = false,
      className = '',
      children,
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLSpanElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const tooltipId = useId();

    const updatePosition = () => {
      if (!triggerRef.current || !tooltipRef.current) return;

      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;

      let top = 0;
      let left = 0;

      switch (position) {
        case 'top':
          top = triggerRect.top + scrollY - tooltipRect.height - 8;
          left = triggerRect.left + scrollX + (triggerRect.width - tooltipRect.width) / 2;
          break;
        case 'bottom':
          top = triggerRect.bottom + scrollY + 8;
          left = triggerRect.left + scrollX + (triggerRect.width - tooltipRect.width) / 2;
          break;
        case 'left':
          top = triggerRect.top + scrollY + (triggerRect.height - tooltipRect.height) / 2;
          left = triggerRect.left + scrollX - tooltipRect.width - 8;
          break;
        case 'right':
          top = triggerRect.top + scrollY + (triggerRect.height - tooltipRect.height) / 2;
          left = triggerRect.right + scrollX + 8;
          break;
      }

      const padding = 8;
      left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding));
      top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding + scrollY));

      setCoords({ top, left });
    };

    useEffect(() => {
      if (isVisible) {
        updatePosition();
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);
        return () => {
          window.removeEventListener('scroll', updatePosition, true);
          window.removeEventListener('resize', updatePosition);
        };
      }
    }, [isVisible, position]);

    const handleMouseEnter = () => {
      if (disabled) return;
      timeoutRef.current = setTimeout(() => {
        setIsVisible(true);
      }, delay);
    };

    const handleMouseLeave = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setIsVisible(false);
    };

    const handleFocus = () => {
      if (disabled) return;
      setIsVisible(true);
    };

    const handleBlur = () => {
      setIsVisible(false);
    };

    const classes = [
      'tooltip',
      `tooltip-${position}`,
      isVisible && 'tooltip-visible',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <>
        <span
          ref={triggerRef}
          className="tooltip-trigger"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onFocus={handleFocus}
          onBlur={handleBlur}
          aria-describedby={isVisible ? tooltipId : undefined}
        >
          {children}
        </span>
        {isVisible &&
          createPortal(
            <div
              ref={(node) => {
                tooltipRef.current = node;
                if (typeof ref === 'function') {
                  ref(node);
                } else if (ref) {
                  ref.current = node;
                }
              }}
              id={tooltipId}
              role="tooltip"
              className={classes}
              style={{ top: coords.top, left: coords.left }}
            >
              {content}
              <span className="tooltip-arrow" aria-hidden="true" />
            </div>,
            document.body
          )}
      </>
    );
  }
);

Tooltip.displayName = 'Tooltip';

export default Tooltip;
