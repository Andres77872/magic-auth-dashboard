import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, XCircle, Users, Trash2, X } from 'lucide-react';

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
      className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-primary/20 bg-primary/5 p-3" 
      role="toolbar" 
      aria-label="Bulk actions toolbar"
      aria-busy={isLoading}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-foreground" aria-live="polite" aria-atomic="true">
          {selectedCount} user{selectedCount !== 1 ? 's' : ''} selected
        </span>
      </div>
      
      <div className="flex flex-wrap items-center gap-2">
        {onActivate && (
          <Button
            variant="outline"
            size="sm"
            onClick={onActivate}
            disabled={isLoading}
            aria-label={`Activate ${selectedCount} selected users`}
          >
            <Check size={14} aria-hidden="true" />
            Activate
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
            <XCircle size={14} aria-hidden="true" />
            Deactivate
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
            <Users size={14} aria-hidden="true" />
            Assign Group
          </Button>
        )}
        
        {onDelete && (
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            disabled={isLoading}
            aria-label={`Delete ${selectedCount} selected users`}
          >
            <Trash2 size={14} aria-hidden="true" />
            Delete
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          disabled={isLoading}
          aria-label="Clear selection"
        >
          <X size={14} aria-hidden="true" />
          Clear
        </Button>
      </div>
    </div>
  );
}

export default BulkActionsBar;
