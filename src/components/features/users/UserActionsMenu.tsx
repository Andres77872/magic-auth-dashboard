import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Ban,
  ExternalLink,
  KeyRound,
  MoreHorizontal,
  Pencil,
  ShieldHalf,
  Trash2,
  UserX,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/common';
import { useAuth, useToast, useUserActions, useUserType } from '@/hooks';
import { formatDateTime } from '@/utils/formatters';
import { ROUTES } from '@/utils/routes';
import type { User } from '@/types/auth.types';
import { ChangeUserTypeDialog } from './ChangeUserTypeDialog';
import { EditUserDialog } from './EditUserDialog';
import { getUserCapabilities } from './user-capabilities';

interface UserActionsMenuProps {
  user: User;
  /** Refresh after a change that keeps the user around. */
  onUserUpdated?: () => void;
  /** Called after the user is deactivated or deleted. Defaults to `onUserUpdated`. */
  onUserRemoved?: () => void;
  /** `icon` for table rows, `button` for page headers. */
  trigger?: 'icon' | 'button';
  /** Hide the "View profile" item (e.g. on the profile page itself). */
  hideViewProfile?: boolean;
}

type Dialog =
  | 'edit'
  | 'type'
  | 'reset'
  | 'deactivate'
  | 'delete'
  | 'hardDelete'
  | null;

export function UserActionsMenu({
  user,
  onUserUpdated,
  onUserRemoved,
  trigger = 'icon',
  hideViewProfile = false,
}: UserActionsMenuProps): React.JSX.Element | null {
  const [dialog, setDialog] = useState<Dialog>(null);
  const { user: currentUser } = useAuth();
  const { userType } = useUserType();
  const { showToast } = useToast();
  const actions = useUserActions();

  const caps = getUserCapabilities(
    { userType, userHash: currentUser?.user_hash },
    {
      user_hash: user.user_hash,
      user_type: user.user_type,
      is_active: user.is_active,
    }
  );
  const refresh = (): void => onUserUpdated?.();
  const removed = (): void => (onUserRemoved ?? onUserUpdated)?.();
  const close = (): void => setDialog(null);

  const runRemoval = async (
    action: (hash: string) => Promise<void>,
    success: string,
    fallback: string
  ): Promise<void> => {
    try {
      await action(user.user_hash);
      showToast(success, 'success');
      close();
      removed();
    } catch (error) {
      showToast(error instanceof Error ? error.message : fallback, 'error');
    }
  };

  const handleReset = async (): Promise<void> => {
    try {
      const res = await actions.resetPassword(user.user_hash);
      const expires = res.reset_data?.expires_at
        ? ` The link expires ${formatDateTime(res.reset_data.expires_at)}.`
        : '';
      showToast(
        res.reset_data?.has_delivery_target === false
          ? `${user.username} has no verified email, so no reset link could be sent.`
          : `Password reset link sent to ${user.username}.${expires}`,
        res.reset_data?.has_delivery_target === false ? 'warning' : 'success'
      );
      close();
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : 'The reset link could not be sent.',
        'error'
      );
    }
  };

  const hasAnyAction =
    !hideViewProfile ||
    caps.canEdit ||
    caps.canChangeType ||
    caps.canResetPassword ||
    caps.canDeactivate ||
    caps.canDelete ||
    caps.canHardDelete;
  if (!hasAnyAction) return null;

  const hasDanger = caps.canDeactivate || caps.canDelete || caps.canHardDelete;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {trigger === 'button' ? (
            <Button variant="secondary">
              Actions
              <MoreHorizontal aria-hidden="true" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label={`Actions for ${user.username}`}
            >
              <MoreHorizontal aria-hidden="true" />
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">
            {user.username}
          </DropdownMenuLabel>
          {!hideViewProfile && (
            <DropdownMenuItem asChild>
              <Link
                to={`${ROUTES.USERS}/${encodeURIComponent(user.user_hash)}`}
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                View profile
              </Link>
            </DropdownMenuItem>
          )}
          {caps.canEdit && (
            <DropdownMenuItem onSelect={() => setDialog('edit')}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit details
            </DropdownMenuItem>
          )}
          {caps.canChangeType && (
            <DropdownMenuItem onSelect={() => setDialog('type')}>
              <ShieldHalf className="h-4 w-4" aria-hidden="true" />
              Change user type
            </DropdownMenuItem>
          )}
          {caps.canResetPassword && (
            <DropdownMenuItem onSelect={() => setDialog('reset')}>
              <KeyRound className="h-4 w-4" aria-hidden="true" />
              Send password reset
            </DropdownMenuItem>
          )}
          {hasDanger && <DropdownMenuSeparator />}
          {caps.canDeactivate && (
            <DropdownMenuItem onSelect={() => setDialog('deactivate')}>
              <Ban className="h-4 w-4" aria-hidden="true" />
              Deactivate
            </DropdownMenuItem>
          )}
          {caps.canDelete && (
            <DropdownMenuItem destructive onSelect={() => setDialog('delete')}>
              <UserX className="h-4 w-4" aria-hidden="true" />
              Delete user
            </DropdownMenuItem>
          )}
          {caps.canHardDelete && (
            <DropdownMenuItem
              destructive
              onSelect={() => setDialog('hardDelete')}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Delete permanently
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <EditUserDialog
        user={user}
        open={dialog === 'edit'}
        onOpenChange={(open) => !open && close()}
        onSaved={refresh}
      />
      <ChangeUserTypeDialog
        user={user}
        open={dialog === 'type'}
        onOpenChange={(open) => !open && close()}
        onChanged={refresh}
      />

      <ConfirmDialog
        isOpen={dialog === 'reset'}
        onClose={close}
        onConfirm={() => void handleReset()}
        variant="info"
        title="Send password reset"
        message={`${user.username} will get an email with a single-use link to choose a new password. Their current password keeps working until they use it.`}
        confirmText="Send link"
        isLoading={actions.pending === 'resetPassword'}
      />
      <ConfirmDialog
        isOpen={dialog === 'deactivate'}
        onClose={close}
        onConfirm={() =>
          void runRemoval(
            actions.deactivateUser,
            `${user.username} was deactivated.`,
            'The user could not be deactivated.'
          )
        }
        variant="warning"
        title={`Deactivate ${user.username}?`}
        message={
          <>
            They&apos;ll be signed out of all sessions and can&apos;t sign in.
            Group memberships are kept.{' '}
            <strong className="text-foreground">
              The API can&apos;t reactivate accounts yet
            </strong>
            , so treat this as permanent.
          </>
        }
        confirmText="Deactivate"
        isLoading={actions.pending === 'deactivate'}
      />
      <ConfirmDialog
        isOpen={dialog === 'delete'}
        onClose={close}
        onConfirm={() =>
          void runRemoval(
            actions.deleteUser,
            `${user.username} was deleted.`,
            'The user could not be deleted.'
          )
        }
        title={`Delete ${user.username}?`}
        message="The account is deactivated, removed from all groups and signed out everywhere. The record is kept for auditing."
        confirmText="Delete user"
        confirmationPhrase={user.username}
        isLoading={actions.pending === 'delete'}
      />
      <ConfirmDialog
        isOpen={dialog === 'hardDelete'}
        onClose={close}
        onConfirm={() =>
          void runRemoval(
            actions.hardDeleteUser,
            `${user.username} was permanently deleted.`,
            'The user could not be permanently deleted.'
          )
        }
        title={`Permanently delete ${user.username}?`}
        message="This removes the account, the content it owns and its linked emails and sign-in identities. It cannot be undone."
        confirmText="Delete permanently"
        confirmationPhrase={user.username}
        isLoading={actions.pending === 'hardDelete'}
      />
    </>
  );
}

export default UserActionsMenu;
