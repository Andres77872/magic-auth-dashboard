/**
 * Per-project binding policy editor.
 *
 * Provisioning mode and existing-user policy change ACCOUNT behaviour, so both are
 * rendered as explained choices rather than bare enum labels. `auto_create` / `both`
 * are blocked client-side until a default user group is chosen, because the backend
 * rejects that combination anyway and the group must also reach this project.
 *
 * The default-group options come from the existing `GET /projects/{hash}/groups`
 * endpoint via `projectService`, so the list can only contain groups that already
 * reach this project.
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks';
import { oauthService } from '@/services/oauth.service';
import { cn } from '@/lib/utils';
import type {
  OAuthBindingInfo,
  OAuthExistingUserPolicy,
  OAuthProvisioningMode,
} from '@/types/oauth.types';
import type { UserGroup } from '@/types/group.types';
import {
  EXISTING_USER_POLICY_OPTIONS,
  PROVISIONING_MODE_OPTIONS,
  bindingEffectiveState,
  provisioningModeRequiresGroup,
} from './oauth-status';

/** Sentinel for "no default group", since Radix Select forbids an empty item value. */
const NO_GROUP = '__none__';

export interface OAuthBindingEditorProps {
  binding: OAuthBindingInfo;
  /** User groups that already reach this project. */
  availableGroups: UserGroup[];
  groupsLoading?: boolean;
  onChanged: () => void;
  disabled?: boolean;
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export function OAuthBindingEditor({
  binding,
  availableGroups,
  groupsLoading = false,
  onChanged,
  disabled = false,
}: OAuthBindingEditorProps): React.JSX.Element {
  const { showToast } = useToast();

  const [enabled, setEnabled] = React.useState(binding.enabled);
  const [loginEnabled, setLoginEnabled] = React.useState(binding.login_enabled);
  const [linkEnabled, setLinkEnabled] = React.useState(binding.link_enabled);
  const [mode, setMode] = React.useState<OAuthProvisioningMode>(
    binding.provisioning_mode || 'disabled',
  );
  const [groupHash, setGroupHash] = React.useState<string>(
    binding.default_user_group_hash || NO_GROUP,
  );
  const [policy, setPolicy] = React.useState<OAuthExistingUserPolicy>(
    binding.existing_user_policy || 'deny',
  );
  const [formError, setFormError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const hasGroup = groupHash !== NO_GROUP && groupHash !== '';
  const effective = bindingEffectiveState(binding);
  const radioName = `oauth-provisioning-${binding.connection_key}`;

  const handleModeChange = (next: OAuthProvisioningMode): void => {
    setMode(next);
    if (formError) setFormError(null);
  };

  const validateForm = (): boolean => {
    if (provisioningModeRequiresGroup(mode) && !hasGroup) {
      setFormError('Choose a default user group before allowing account creation.');
      return false;
    }
    setFormError(null);
    return true;
  };

  const save = async (): Promise<void> => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      await oauthService.upsertBinding(binding.project_hash, binding.connection_key, {
        connection_hash: binding.connection_hash,
        enabled,
        login_enabled: loginEnabled,
        link_enabled: linkEnabled,
        provisioning_mode: mode,
        default_user_group_hash: hasGroup ? groupHash : null,
        existing_user_policy: policy,
      });
      showToast('Binding saved', 'success');
      onChanged();
    } catch (err) {
      showToast(errorMessage(err, 'Failed to save binding'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const joinWarning = EXISTING_USER_POLICY_OPTIONS.find(
    (option) => option.value === 'join_default_group',
  )?.warning;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">Effective state:</span>
        <Badge variant={effective.variant}>{effective.label}</Badge>
        {effective.blockedBy && (
          <span className="text-xs text-muted-foreground">blocked by {effective.blockedBy}</span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="flex items-center justify-between gap-3 rounded-md border border-border p-3 text-sm">
          <div>
            <div className="font-medium">Enabled</div>
            <div className="text-xs text-muted-foreground">Master switch for this project.</div>
          </div>
          <Switch
            checked={enabled}
            disabled={disabled || saving}
            onCheckedChange={(checked) => setEnabled(Boolean(checked))}
            aria-label="Enabled for this project"
          />
        </div>
        <div className="flex items-center justify-between gap-3 rounded-md border border-border p-3 text-sm">
          <div>
            <div className="font-medium">Login</div>
            <div className="text-xs text-muted-foreground">Allow sign-in with this provider.</div>
          </div>
          <Switch
            checked={loginEnabled}
            disabled={disabled || saving}
            onCheckedChange={(checked) => setLoginEnabled(Boolean(checked))}
            aria-label="Login enabled"
          />
        </div>
        <div className="flex items-center justify-between gap-3 rounded-md border border-border p-3 text-sm">
          <div>
            <div className="font-medium">Link</div>
            <div className="text-xs text-muted-foreground">
              Allow signed-in users to link this provider.
            </div>
          </div>
          <Switch
            checked={linkEnabled}
            disabled={disabled || saving}
            onCheckedChange={(checked) => setLinkEnabled(Boolean(checked))}
            aria-label="Link enabled"
          />
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Provisioning mode</legend>
        {PROVISIONING_MODE_OPTIONS.map((option) => {
          const blocked = option.requiresDefaultGroup && !hasGroup;
          return (
            <label
              key={option.value}
              htmlFor={`${radioName}-${option.value}`}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 text-sm transition-colors',
                mode === option.value && 'border-primary bg-primary/5',
                (blocked || disabled) && 'cursor-not-allowed opacity-70',
              )}
            >
              <input
                id={`${radioName}-${option.value}`}
                type="radio"
                name={radioName}
                value={option.value}
                checked={mode === option.value}
                disabled={disabled || saving || blocked}
                onChange={() => handleModeChange(option.value)}
                className="mt-1 h-4 w-4 accent-primary"
              />
              <span className="min-w-0">
                <span className="block font-medium">{option.label}</span>
                <span className="block text-xs text-muted-foreground">{option.description}</span>
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

      <div className="space-y-1.5">
        <Label htmlFor={`${radioName}-group`}>Default user group</Label>
        <Select
          value={groupHash}
          onValueChange={(next) => {
            setGroupHash(next);
            if (formError) setFormError(null);
          }}
          disabled={disabled || saving || groupsLoading}
        >
          <SelectTrigger id={`${radioName}-group`} className="w-full sm:w-80">
            <SelectValue placeholder={groupsLoading ? 'Loading groups…' : 'No default group'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_GROUP}>No default group</SelectItem>
            {availableGroups.map((group) => (
              <SelectItem key={group.group_hash} value={group.group_hash}>
                {group.group_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Only groups that already reach this project can be used. Auto-created accounts join
          this group.
        </p>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Existing-user policy</legend>
        {EXISTING_USER_POLICY_OPTIONS.map((option) => (
          <label
            key={option.value}
            htmlFor={`${radioName}-policy-${option.value}`}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 text-sm transition-colors',
              policy === option.value && 'border-primary bg-primary/5',
              disabled && 'cursor-not-allowed opacity-70',
            )}
          >
            <input
              id={`${radioName}-policy-${option.value}`}
              type="radio"
              name={`${radioName}-policy`}
              value={option.value}
              checked={policy === option.value}
              disabled={disabled || saving}
              onChange={() => setPolicy(option.value)}
              className="mt-1 h-4 w-4 accent-primary"
            />
            <span className="min-w-0">
              <span className="block font-medium">{option.label}</span>
              <span className="block text-xs text-muted-foreground">{option.description}</span>
            </span>
          </label>
        ))}
        {policy === 'join_default_group' && joinWarning && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/5 p-3 text-sm text-warning"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{joinWarning}</span>
          </div>
        )}
      </fieldset>

      {formError && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          {formError}
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={() => void save()} loading={saving} disabled={disabled}>
          Save policy
        </Button>
      </div>
    </div>
  );
}

export default OAuthBindingEditor;
