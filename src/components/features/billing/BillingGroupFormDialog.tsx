/**
 * Create a billing group (`POST /admin/billing`, Form) or edit its name,
 * description and status (`PUT /admin/billing/{group_hash}`, Form).
 * Empty fields keep their value on update, so a description can't be cleared.
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ValueSelect } from '@/components/features/shared-pickers';
import type {
  BillingGroup,
  BillingGroupStatus,
  BillingGroupUpdateRequest,
} from '@/types/billing.types';
import { useBillingGroupMutations } from './useBilling';

export interface BillingGroupFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (group: BillingGroup) => void;
  /** Present = edit mode. */
  group?: BillingGroup | null;
}

const STATUS_OPTIONS: { value: BillingGroupStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'archived', label: 'Archived' },
];

const NAME_MAX = 120;

export function BillingGroupFormDialog({
  isOpen,
  onClose,
  onSaved,
  group,
}: BillingGroupFormDialogProps): React.JSX.Element {
  const { createGroup, updateGroup, pending } = useBillingGroupMutations();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<BillingGroupStatus>('active');
  const [error, setError] = useState<string | null>(null);
  const saving = pending === 'create' || pending === 'update';

  const [openedFor, setOpenedFor] = useState<string | null>(null);
  const openKey = isOpen ? (group?.group_hash ?? 'new') : null;
  if (openKey !== openedFor) {
    setOpenedFor(openKey);
    if (openKey) {
      setName(group?.name ?? '');
      setDescription(group?.description ?? '');
      setStatus(group?.status ?? 'active');
      setError(null);
    }
  }

  const submit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Enter a name for the group.');
      return;
    }
    setError(null);
    try {
      if (group) {
        const request: BillingGroupUpdateRequest = {};
        if (trimmedName !== group.name) request.group_name = trimmedName;
        if (
          description.trim() &&
          description.trim() !== (group.description ?? '')
        )
          request.description = description.trim();
        if (status !== group.status) request.status = status;
        if (Object.keys(request).length === 0) {
          setError('Nothing has changed.');
          return;
        }
        onSaved(await updateGroup(group.group_hash, request));
      } else {
        onSaved(
          await createGroup({
            group_name: trimmedName,
            description: description.trim() || undefined,
          })
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'The billing group could not be saved.'
      );
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !saving && onClose()}
    >
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>
            {group ? 'Edit billing group' : 'Create billing group'}
          </DialogTitle>
          <DialogDescription>
            {group
              ? 'Suspending or archiving a group turns off all of its billing capabilities.'
              : 'A group holds one Stripe account and one catalog shared by its projects. It starts without credentials and with every capability off.'}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => void submit(event)}
          noValidate
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <label
              htmlFor="billing-group-name"
              className="block text-[13px] font-medium text-foreground"
            >
              Name
            </label>
            <Input
              id="billing-group-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={NAME_MAX}
              disabled={saving}
              className="h-8 text-[13px]"
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="billing-group-description"
              className="block text-[13px] font-medium text-foreground"
            >
              Description{' '}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </label>
            <Textarea
              id="billing-group-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={2}
              disabled={saving}
              className="text-[13px]"
            />
            {group && (
              <p className="m-0 text-xs text-muted-foreground">
                Descriptions can be replaced but not cleared.
              </p>
            )}
          </div>
          {group && (
            <div className="space-y-1.5">
              <span className="block text-[13px] font-medium text-foreground">
                Status
              </span>
              <ValueSelect<BillingGroupStatus>
                value={status}
                onChange={setStatus}
                options={STATUS_OPTIONS}
                ariaLabel="Status"
                className="w-48"
              />
            </div>
          )}
          {error && (
            <p
              role="alert"
              className="m-0 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-[13px] text-destructive"
            >
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {group ? 'Save changes' : 'Create group'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default BillingGroupFormDialog;
