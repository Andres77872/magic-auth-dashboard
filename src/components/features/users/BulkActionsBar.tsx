import React from 'react';
import { Button } from '@/components/common';
import { CheckIcon, ErrorIcon, GroupIcon, DeleteIcon, CloseIcon } from '@/components/icons';

interface BulkActionsBarProps {
  selectedCount: number;
  onActivate?: () => void;
  onDeactivate?: () => void;
  onAssignGroup?: () => void;
  onDelete?: () => void;
  onClearSelection: () => void;
  isLoading?: boolean;
}

export function BulkActionsBar({
  selectedCount,
  onActivate,
  onDeactivate,
  onAssignGroup,
  onDelete,
  onClearSelection,
  isLoading = false
}: BulkActionsBarProps): React.JSX.Element {
  return (
    <div 
      className="bulk-actions-bar" 
      role="toolbar" 
      aria-label="Bulk actions toolbar"
      aria-busy={isLoading}
    >
      <div className="bulk-actions-info">
        <span className="selected-count" aria-live="polite" aria-atomic="true">
          {selectedCount} user{selectedCount !== 1 ? 's' : ''} selected
        </span>
      </div>
      
      <div className="bulk-actions-buttons">
        {onActivate && (
          <Button
            variant="outline"
            size="sm"
            onClick={onActivate}
            disabled={isLoading}
            leftIcon={<CheckIcon size={14} aria-hidden="true" />}
            aria-label={`Activate ${selectedCount} selected users`}
          >
            Activate
          </Button>
        )}
        
        {onDeactivate && (
          <Button
            variant="outline"
            size="sm"
            onClick={onDeactivate}
            disabled={isLoading}
            leftIcon={<ErrorIcon size={14} aria-hidden="true" />}
            aria-label={`Deactivate ${selectedCount} selected users`}
          >
            Deactivate
          </Button>
        )}
        
        {onAssignGroup && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAssignGroup}
            disabled={isLoading}
            leftIcon={<GroupIcon size={14} aria-hidden="true" />}
            aria-label={`Assign group to ${selectedCount} selected users`}
          >
            Assign Group
          </Button>
        )}
        
        {onDelete && (
          <Button
            variant="danger"
            size="sm"
            onClick={onDelete}
            disabled={isLoading}
            leftIcon={<DeleteIcon size={14} aria-hidden="true" />}
            aria-label={`Delete ${selectedCount} selected users`}
          >
            Delete
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          disabled={isLoading}
          leftIcon={<CloseIcon size={14} aria-hidden="true" />}
          aria-label="Clear selection"
        >
          Clear
        </Button>
      </div>
    </div>
  );
}

export default BulkActionsBar;
