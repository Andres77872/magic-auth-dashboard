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
            aria-label={`Activate ${selectedCount} selected users`}
          >
            <CheckIcon size={16} />
            <span className="btn-label">Activate</span>
          </Button>
        )}
        
        {onDeactivate && (
          <Button
            variant="outline"
            size="sm"
            onClick={onDeactivate}
            disabled={isLoading}
            aria-label={`Deactivate ${selectedCount} selected users`}
          >
            <ErrorIcon size={16} />
            <span className="btn-label">Deactivate</span>
          </Button>
        )}
        
        {onAssignGroup && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAssignGroup}
            disabled={isLoading}
            aria-label={`Assign group to ${selectedCount} selected users`}
          >
            <GroupIcon size={16} />
            <span className="btn-label">Assign Group</span>
          </Button>
        )}
        
        {onDelete && (
          <Button
            variant="danger"
            size="sm"
            onClick={onDelete}
            disabled={isLoading}
            aria-label={`Delete ${selectedCount} selected users`}
          >
            <DeleteIcon size={16} />
            <span className="btn-label">Delete</span>
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          disabled={isLoading}
          aria-label="Clear selection"
        >
          <CloseIcon size={16} />
          <span className="btn-label">Clear</span>
        </Button>
      </div>
    </div>
  );
}

export default BulkActionsBar;
