import React, { forwardRef, useEffect, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import type { ModalSize } from '../types';
import './Modal.css';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  size?: ModalSize;
  title?: string;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      isOpen,
      onClose,
      size = 'md',
      title,
      closeOnBackdrop = true,
      closeOnEscape = true,
      showCloseButton = true,
      className = '',
      children,
    },
    ref
  ) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);
    const modalId = useId();
    const titleId = `${modalId}-title`;

    useEffect(() => {
      if (!isOpen || !closeOnEscape) return;

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, closeOnEscape, onClose]);

    useEffect(() => {
      if (isOpen) {
        previousActiveElement.current = document.activeElement as HTMLElement;

        setTimeout(() => {
          const targetRef = ref && typeof ref !== 'function' ? ref : modalRef;
          if (targetRef.current) {
            const focusable = targetRef.current.querySelector<HTMLElement>(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (focusable) {
              focusable.focus();
            } else {
              targetRef.current.focus();
            }
          }
        }, 0);
      } else if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    }, [isOpen, ref]);

    useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }

      return () => {
        document.body.style.overflow = '';
      };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleBackdropClick = (event: React.MouseEvent) => {
      if (closeOnBackdrop && event.target === event.currentTarget) {
        onClose();
      }
    };

    const classes = [
      'modal',
      `modal-${size}`,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return createPortal(
      <div className="modal-overlay" onClick={handleBackdropClick}>
        <div
          ref={ref || modalRef}
          className={classes}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          tabIndex={-1}
          onClick={(e) => e.stopPropagation()}
        >
          {(title || showCloseButton) && (
            <div className="modal-header">
              {title && (
                <h2 id={titleId} className="modal-title">
                  {title}
                </h2>
              )}
              {showCloseButton && (
                <button
                  type="button"
                  className="modal-close"
                  onClick={onClose}
                  aria-label="Close modal"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
            </div>
          )}

          <div className="modal-content">
            {children}
          </div>
        </div>
      </div>,
      document.body
    );
  }
);

Modal.displayName = 'Modal';

export default Modal;
