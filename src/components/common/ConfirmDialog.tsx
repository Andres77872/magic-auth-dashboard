import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
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
  const handleConfirm = () => {
    onConfirm();
  };

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <ErrorIcon size="lg" className="confirm-icon confirm-icon-danger" />;
      case 'warning':
        return <WarningIcon size="lg" className="confirm-icon confirm-icon-warning" />;
      case 'info':
        return <InfoIcon size="lg" className="confirm-icon confirm-icon-info" />;
      default:
        return null;
    }
  };

  const getConfirmButtonVariant = () => {
    switch (variant) {
      case 'danger':
        return 'danger';
      case 'warning':
        return 'primary';
      case 'info':
        return 'primary';
      default:
        return 'primary';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      className="confirm-dialog"
      closeOnBackdropClick={!isLoading}
      closeOnEscape={!isLoading}
    >
      <div className="confirm-dialog-content">
        <div className="confirm-dialog-icon">
          {getIcon()}
        </div>
        
        <div className="confirm-dialog-message">
          <p>{message}</p>
        </div>
        
        <div className="confirm-dialog-actions">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={getConfirmButtonVariant()}
            onClick={handleConfirm}
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