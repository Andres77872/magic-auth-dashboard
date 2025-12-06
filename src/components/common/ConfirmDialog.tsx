import React from 'react';
import { Modal, Button } from '../primitives';
import { ErrorIcon, WarningIcon, InfoIcon } from '@/components/icons';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps): React.JSX.Element {
  const getIcon = () => {
    const iconSize = 32;
    switch (variant) {
      case 'danger':
        return <ErrorIcon size={iconSize} />;
      case 'warning':
        return <WarningIcon size={iconSize} />;
      case 'info':
        return <InfoIcon size={iconSize} />;
      default:
        return null;
    }
  };

  const getConfirmButtonVariant = (): 'danger' | 'primary' => {
    return variant === 'danger' ? 'danger' : 'primary';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      className="confirm-dialog"
      closeOnBackdrop={!isLoading}
      closeOnEscape={!isLoading}
    >
      <div className="confirm-dialog__content">
        <div className={`confirm-dialog__icon confirm-dialog__icon--${variant}`} aria-hidden="true">
          {getIcon()}
        </div>
        
        <div className="confirm-dialog__message">
          <p>{message}</p>
        </div>
        
        <div className="confirm-dialog__actions">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={getConfirmButtonVariant()}
            onClick={onConfirm}
            loading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default ConfirmDialog; 