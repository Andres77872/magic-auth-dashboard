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
        <div className="flex items-start gap-3 rounded-md bg-yellow-50 p-3 dark:bg-yellow-950">
          <AlertTriangle
            size={20}
            className="mt-0.5 text-yellow-600"
            aria-hidden="true"
          />
          <div>
            <p className="font-medium text-yellow-800 dark:text-yellow-200">
              Creating ROOT User
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              You are about to create a ROOT user with full system access.
            </p>
          </div>
        </div>
      )}

      {showSelfEditWarning && (
        <div className="flex items-start gap-3 rounded-md bg-blue-50 p-3 dark:bg-blue-950">
          <Info size={20} className="mt-0.5 text-blue-600" aria-hidden="true" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            You are editing your own account. Some restrictions apply for
            security reasons.
          </p>
        </div>
      )}
    </div>
  );
}

export default UserFormWarnings;
