/**
 * Per-project binding policy editor.
 *
 * Provisioning mode and existing-user policy change ACCOUNT behaviour, so both are
 * rendered as explained choices rather than bare enum labels. The account-creating
 * modes and the "join default group" policy are blocked client-side until a default
 * user group is chosen, because api.auth rejects those combinations anyway.
 *
 * Saves send only the fields that changed (api.auth keeps omitted fields), so a save
 * never rewrites a value the operator did not touch.
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import type {
  OAuthBindingInfo,
  OAuthBindingUpsertRequest,
  OAuthExistingUserPolicy,
  OAuthProvisioningMode,
} from '@/types/oauth.types';
import type { UserGroup } from '@/types/group.types';
import {
  EXISTING_USER_POLICY_OPTIONS,
  PROVISIONING_MODE_OPTIONS,
  provisioningModeRequiresGroup,
} from './oauth-status';

/** Sentinel for "no default group", since Radix Select forbids an empty item value. */
const NO_GROUP = '__none__';

export interface OAuthBindingEditorProps {
  binding: OAuthBindingInfo;
  /** User groups that already reach this project. */
  availableGroups: UserGroup[];
  groupsLoading?: boolean;
  /** Resolves after the API saved the binding and it was refetched. */
  onSave: (request: OAuthBindingUpsertRequest) => Promise<void>;
  disabled?: boolean;
}

interface PolicyState {
  enabled: boolean;
  loginEnabled: boolean;
  linkEnabled: boolean;
  mode: OAuthProvisioningMode;
  groupHash: string;
  policy: OAuthExistingUserPolicy;
}

function policyFromBinding(binding: OAuthBindingInfo): PolicyState {
  return {
    enabled: binding.enabled,
    loginEnabled: binding.login_enabled,
    linkEnabled: binding.link_enabled,
    mode: binding.provisioning_mode,
    groupHash: binding.default_user_group_hash || NO_GROUP,
    policy: binding.existing_user_policy,
  };
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

const SWITCHES: Array<{
  key: 'enabled' | 'loginEnabled' | 'linkEnabled';
  label: string;
  description: string;
}> = [
  {
    key: 'enabled',
    label: 'Enabled',
    description: 'Master switch for this project.',
  },
  {
    key: 'loginEnabled',
    label: 'Sign-in',
    description: 'Allow signing in with this provider.',
  },
  {
    key: 'linkEnabled',
    label: 'Account linking',
    description: 'Allow signed-in users to link this provider.',
  },
];

export function OAuthBindingEditor({
  binding,
  availableGroups,
  groupsLoading = false,
  onSave,
  disabled = false,
}: OAuthBindingEditorProps): React.JSX.Element {
  const { showToast } = useToast();
  const server = policyFromBinding(binding);
  const serverKey = JSON.stringify(server);

  const [state, setState] = React.useState<PolicyState>(server);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  // Follow the server whenever the stored binding changes (after a save or a refetch).
  const [seenKey, setSeenKey] = React.useState(serverKey);
  if (serverKey !== seenKey) {
    setSeenKey(serverKey);
    setState(server);
    setFormError(null);
  }

  const hasGroup = state.groupHash !== NO_GROUP;
  const fieldsDisabled = disabled || saving;
  const idBase = `oauth-binding-${binding.connection_key}`;
  const dirty = JSON.stringify(state) !== serverKey;

  // The stored group may no longer reach the project; keep it selectable so the form
  // shows the truth instead of silently switching to "No default group".
  const groupOptions = React.useMemo(() => {
    const options = availableGroups.map((group) => ({
      value: group.group_hash,
      label: group.group_name,
    }));
    if (
      binding.default_user_group_hash &&
      !options.some(
        (option) => option.value === binding.default_user_group_hash
      )
    ) {
      options.push({
        value: binding.default_user_group_hash,
        label: `${binding.default_user_group_name || binding.default_user_group_hash} (does not reach this project)`,
      });
    }
    return options;
  }, [
    availableGroups,
    binding.default_user_group_hash,
    binding.default_user_group_name,
  ]);

  const update = (changes: Partial<PolicyState>): void => {
    setState((previous) => ({ ...previous, ...changes }));
    if (formError) setFormError(null);
  };

  const validate = (): boolean => {
    if (provisioningModeRequiresGroup(state.mode) && !hasGroup) {
      setFormError(
        'Choose a default user group before allowing account creation.'
      );
      return false;
    }
    if (state.policy === 'join_default_group' && !hasGroup) {
      setFormError(
        'Choose a default user group before letting existing users join it.'
      );
      return false;
    }
    setFormError(null);
    return true;
  };

  const save = async (): Promise<void> => {
    if (!validate()) return;
    const request: OAuthBindingUpsertRequest = {
      connection_hash: binding.connection_hash,
    };
    if (state.enabled !== server.enabled) request.enabled = state.enabled;
    if (state.loginEnabled !== server.loginEnabled)
      request.login_enabled = state.loginEnabled;
    if (state.linkEnabled !== server.linkEnabled)
      request.link_enabled = state.linkEnabled;
    if (state.mode !== server.mode) request.provisioning_mode = state.mode;
    // An empty string clears the default group.
    if (state.groupHash !== server.groupHash)
      request.default_user_group_hash = hasGroup ? state.groupHash : '';
    if (state.policy !== server.policy)
      request.existing_user_policy = state.policy;

    setSaving(true);
    try {
      await onSave(request);
      showToast('Sign-in policy saved', 'success');
    } catch (err) {
      showToast(
        errorMessage(err, 'The sign-in policy could not be saved.'),
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const joinWarning = EXISTING_USER_POLICY_OPTIONS.find(
    (option) => option.value === 'join_default_group'
  )?.warning;

  return (
    <div className="space-y-5">
      <ul className="m-0 list-none divide-y divide-border rounded-md border border-border p-0">
        {SWITCHES.map((item) => (
          <li
            key={item.key}
            className="flex items-center justify-between gap-3 px-3 py-2.5"
          >
            <div className="min-w-0">
              <Label
                htmlFor={`${idBase}-${item.key}`}
                className="text-[13px] font-medium"
              >
                {item.label}
              </Label>
              <p className="m-0 text-xs text-muted-foreground">
                {item.description}
              </p>
            </div>
            <Switch
              id={`${idBase}-${item.key}`}
              checked={state[item.key]}
              disabled={fieldsDisabled}
              onCheckedChange={(checked) =>
                update({ [item.key]: checked === true })
              }
            />
          </li>
        ))}
      </ul>

      <div className="space-y-1.5">
        <Label htmlFor={`${idBase}-group`}>Default user group</Label>
        <Select
          value={state.groupHash}
          onValueChange={(next) => update({ groupHash: next })}
          disabled={fieldsDisabled || groupsLoading}
        >
          <SelectTrigger id={`${idBase}-group`} className="w-full sm:w-80">
            <SelectValue
              placeholder={
                groupsLoading ? 'Loading groups…' : 'No default group'
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_GROUP}>No default group</SelectItem>
            {groupOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="m-0 text-xs text-muted-foreground">
          Only user groups that already reach this project can be used. New
          accounts join this group.
        </p>
      </div>

      <fieldset className="m-0 space-y-2 border-0 p-0">
        <legend className="mb-2 text-[13px] font-medium">
          Provisioning mode
        </legend>
        {PROVISIONING_MODE_OPTIONS.map((option) => {
          const blocked = option.requiresDefaultGroup && !hasGroup;
          const optionId = `${idBase}-mode-${option.value}`;
          return (
            <label
              key={option.value}
              htmlFor={optionId}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-md border border-border px-3 py-2.5 text-[13px] transition-colors',
                state.mode === option.value && 'border-primary bg-primary/5',
                (blocked || disabled) && 'cursor-not-allowed opacity-70'
              )}
            >
              <input
                id={optionId}
                type="radio"
                name={`${idBase}-mode`}
                value={option.value}
                checked={state.mode === option.value}
                disabled={fieldsDisabled || blocked}
                onChange={() => update({ mode: option.value })}
                className="mt-0.5 h-4 w-4 accent-primary"
              />
              <span className="min-w-0">
                <span className="block font-medium">{option.label}</span>
                <span className="block text-xs text-muted-foreground">
                  {option.description}
                </span>
                {blocked && (
                  <span className="mt-1 block text-xs text-warning">
                    Choose a default user group first.
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </fieldset>

      <fieldset className="m-0 space-y-2 border-0 p-0">
        <legend className="mb-2 text-[13px] font-medium">
          Existing-user policy
        </legend>
        {EXISTING_USER_POLICY_OPTIONS.map((option) => {
          const blocked = option.value === 'join_default_group' && !hasGroup;
          const optionId = `${idBase}-policy-${option.value}`;
          return (
            <label
              key={option.value}
              htmlFor={optionId}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-md border border-border px-3 py-2.5 text-[13px] transition-colors',
                state.policy === option.value && 'border-primary bg-primary/5',
                (blocked || disabled) && 'cursor-not-allowed opacity-70'
              )}
            >
              <input
                id={optionId}
                type="radio"
                name={`${idBase}-policy`}
                value={option.value}
                checked={state.policy === option.value}
                disabled={fieldsDisabled || blocked}
                onChange={() => update({ policy: option.value })}
                className="mt-0.5 h-4 w-4 accent-primary"
              />
              <span className="min-w-0">
                <span className="block font-medium">{option.label}</span>
                <span className="block text-xs text-muted-foreground">
                  {option.description}
                </span>
                {blocked && (
                  <span className="mt-1 block text-xs text-warning">
                    Choose a default user group first.
                  </span>
                )}
              </span>
            </label>
          );
        })}
        {state.policy === 'join_default_group' && joinWarning && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/5 px-3 py-2.5 text-xs text-warning"
          >
            <AlertTriangle
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            <span>{joinWarning}</span>
          </div>
        )}
      </fieldset>

      {formError && (
        <p role="alert" className="m-0 text-xs text-destructive">
          {formError}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          onClick={() => void save()}
          loading={saving}
          disabled={disabled || !dirty}
        >
          Save policy
        </Button>
        {dirty && !saving && (
          <Button
            variant="ghost"
            onClick={() => update(server)}
            disabled={disabled}
          >
            Discard changes
          </Button>
        )}
      </div>
    </div>
  );
}

export default OAuthBindingEditor;
