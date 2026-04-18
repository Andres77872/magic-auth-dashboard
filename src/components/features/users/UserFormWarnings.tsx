import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

interface UserFormWarningsProps {
  mode: 'create' | 'edit';
  userType: string;
  isEditingSelf: boolean;
}

/**
 * Security warning boxes for UserFormModal.
 * Displays contextual warnings for ROOT user creation and self-editing scenarios.
 */
export function UserFormWarnings({
  mode,
  userType,
  isEditingSelf,
}: UserFormWarningsProps): React.JSX.Element | null {
  // Only render warnings when relevant
  const showRootWarning = mode === 'create' && userType === 'root';
  const showSelfEditWarning = isEditingSelf;

  if (!showRootWarning && !showSelfEditWarning) {
    return null;
  }

  return (
    <div className="space-y-3">
      {showRootWarning && (
        <div className="flex items-start gap-3 rounded-md bg-warning-subtle p-3 border border-warning/20">
          <AlertTriangle
            size={20}
            className="mt-0.5 text-warning-subtle-foreground shrink-0"
            aria-hidden="true"
          />
          <div>
            <p className="font-medium text-warning-subtle-foreground">
              Creating ROOT User
            </p>
            <p className="text-sm text-warning-subtle-foreground/80">
              You are about to create a ROOT user with full system access.
            </p>
          </div>
        </div>
      )}

      {showSelfEditWarning && (
        <div className="flex items-start gap-3 rounded-md bg-info-subtle p-3 border border-info/20">
          <Info size={20} className="mt-0.5 text-info-subtle-foreground shrink-0" aria-hidden="true" />
          <p className="text-sm text-info-subtle-foreground">
            You are editing your own account. Some restrictions apply for
            security reasons.
          </p>
        </div>
      )}
    </div>
  );
}

export default UserFormWarnings;
