import { type ComponentProps } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OAuthBindingEditor } from '../OAuthBindingEditor';
import type { OAuthBindingInfo } from '@/types/oauth.types';
import type { UserGroup } from '@/types/group.types';

const { showToast } = vi.hoisted(() => ({ showToast: vi.fn() }));

vi.mock('@/hooks/useToast', () => ({ useToast: () => ({ showToast }) }));

const GROUPS: UserGroup[] = [
  {
    group_hash: 'grp_1',
    group_name: 'Acme members',
    description: '',
    member_count: 3,
    created_at: '2026-01-01T00:00:00Z',
  },
];

function binding(overrides: Partial<OAuthBindingInfo> = {}): OAuthBindingInfo {
  return {
    connection_key: 'google',
    connection_hash: 'conn_1',
    provider_type: 'google',
    connection_display_name: 'Acme Google',
    connection_status: 'active',
    credential_status: 'active',
    project_hash: 'proj_1',
    project_name: 'Alpha',
    enabled: false,
    login_enabled: true,
    link_enabled: true,
    provisioning_mode: 'disabled',
    default_user_group_hash: null,
    default_user_group_name: null,
    existing_user_policy: 'deny',
    init_mode: 'api',
    has_legacy_redeem: false,
    delivery_mode: 'bff',
    state_ttl_seconds: null,
    urls: [],
    ready: false,
    readiness: [],
    ...overrides,
  };
}

type Props = ComponentProps<typeof OAuthBindingEditor>;

function renderEditor(
  props: Partial<Props> = {}
): Props & { rerender: (next: Partial<Props>) => void } {
  const merged: Props = {
    binding: binding(),
    availableGroups: GROUPS,
    onSave: vi.fn<Props['onSave']>().mockResolvedValue(undefined),
    ...props,
  };
  const view = render(<OAuthBindingEditor {...merged} />);
  return {
    ...merged,
    rerender: (next) =>
      view.rerender(<OAuthBindingEditor {...merged} {...next} />),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('OAuthBindingEditor provisioning mode', () => {
  it('blocks auto_create and both until a default group is chosen', () => {
    renderEditor();

    expect(screen.getByLabelText(/^Disabled/)).toBeEnabled();
    expect(screen.getByLabelText(/^Link only/)).toBeEnabled();
    expect(screen.getByLabelText(/^Auto-create/)).toBeDisabled();
    expect(screen.getByLabelText(/^Both/)).toBeDisabled();
  });

  it('enables the account-creating modes once the binding has a group', () => {
    renderEditor({
      binding: binding({
        default_user_group_hash: 'grp_1',
        default_user_group_name: 'Acme members',
      }),
    });

    expect(screen.getByLabelText(/^Auto-create/)).toBeEnabled();
    expect(screen.getByLabelText(/^Both/)).toBeEnabled();
    expect(
      screen.queryByText('Choose a default user group first.')
    ).not.toBeInTheDocument();
  });

  it('saves only the fields that changed', async () => {
    const { onSave } = renderEditor({
      binding: binding({
        default_user_group_hash: 'grp_1',
        provisioning_mode: 'link_only',
      }),
    });

    fireEvent.click(screen.getByLabelText(/^Auto-create/));
    fireEvent.click(screen.getByRole('switch', { name: /^Enabled/ }));
    fireEvent.click(screen.getByRole('button', { name: /save policy/i }));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        connection_hash: 'conn_1',
        enabled: true,
        provisioning_mode: 'auto_create',
      })
    );
    expect(showToast).toHaveBeenCalledWith('Sign-in policy saved', 'success');
  });

  it('keeps Save disabled until something changed', () => {
    renderEditor();
    expect(screen.getByRole('button', { name: /save policy/i })).toBeDisabled();
  });

  it('follows the stored binding after a refetch', () => {
    const view = renderEditor();
    expect(screen.getByRole('switch', { name: /^Enabled/ })).not.toBeChecked();

    view.rerender({ binding: binding({ enabled: true }) });
    expect(screen.getByRole('switch', { name: /^Enabled/ })).toBeChecked();
  });

  it('shows the backend message when saving fails', async () => {
    const onSave = vi
      .fn<Props['onSave']>()
      .mockRejectedValue(new Error('Default user group is not active'));
    renderEditor({ onSave });

    fireEvent.click(screen.getByRole('switch', { name: /^Sign-in/ }));
    fireEvent.click(screen.getByRole('button', { name: /save policy/i }));

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith(
        'Default user group is not active',
        'error'
      )
    );
  });
});

describe('OAuthBindingEditor existing-user policy', () => {
  it('needs a default group before "join default group" can be chosen', () => {
    renderEditor();
    expect(screen.getByLabelText(/^Join default group/)).toBeDisabled();
  });

  it('warns when "join default group" is selected', () => {
    renderEditor({ binding: binding({ default_user_group_hash: 'grp_1' }) });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/^Join default group/));
    expect(screen.getByRole('alert')).toHaveTextContent(
      /grants access to an account that was created elsewhere/i
    );
  });
});
