import { type ComponentProps } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OAuthBindingEditor } from '../OAuthBindingEditor';
import { oauthService } from '@/services/oauth.service';
import { useToast } from '@/hooks';
import type { OAuthBindingInfo } from '@/types/oauth.types';
import type { UserGroup } from '@/types/group.types';

vi.mock('@/services/oauth.service', () => ({
  oauthService: { upsertBinding: vi.fn() },
}));

vi.mock('@/hooks', () => ({
  useToast: vi.fn(),
}));

const showToast = vi.fn();
const mockedService = vi.mocked(oauthService);

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
    readiness: [
      { check: 'binding_disabled', ok: false, message: 'The provider is not enabled for this project.' },
      { check: 'no_redirect_uri', ok: false, message: 'No redirect URI is configured.' },
    ],
    ...overrides,
  };
}

function renderEditor(
  props: Partial<ComponentProps<typeof OAuthBindingEditor>> = {},
): ComponentProps<typeof OAuthBindingEditor> {
  const merged: ComponentProps<typeof OAuthBindingEditor> = {
    binding: binding(),
    availableGroups: GROUPS,
    onChanged: vi.fn(),
    ...props,
  };
  render(<OAuthBindingEditor {...merged} />);
  return merged;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useToast).mockReturnValue({ showToast });
  mockedService.upsertBinding.mockResolvedValue({ success: true, message: 'ok' } as never);
});

describe('OAuthBindingEditor provisioning mode', () => {
  it('blocks auto_create and both until a default group is chosen', () => {
    renderEditor();

    expect(screen.getByLabelText(/^Disabled/)).toBeEnabled();
    expect(screen.getByLabelText(/^Link only/)).toBeEnabled();
    expect(screen.getByLabelText(/^Auto-create/)).toBeDisabled();
    expect(screen.getByLabelText(/^Both/)).toBeDisabled();
    expect(screen.getAllByText('Choose a default user group first.')).toHaveLength(2);
  });

  it('enables the account-creating modes once a group is selected on the binding', () => {
    renderEditor({
      binding: binding({
        default_user_group_hash: 'grp_1',
        default_user_group_name: 'Acme members',
      }),
    });

    expect(screen.getByLabelText(/^Auto-create/)).toBeEnabled();
    expect(screen.getByLabelText(/^Both/)).toBeEnabled();
    expect(screen.queryByText('Choose a default user group first.')).not.toBeInTheDocument();
  });

  it('saves the chosen mode and group through the upsert endpoint', async () => {
    const { onChanged } = renderEditor({
      binding: binding({ default_user_group_hash: 'grp_1', provisioning_mode: 'link_only' }),
    });

    fireEvent.click(screen.getByLabelText(/^Auto-create/));
    fireEvent.click(screen.getByRole('button', { name: /save policy/i }));

    await waitFor(() =>
      expect(mockedService.upsertBinding.mock.calls[0]).toEqual([
        'proj_1',
        'google',
        {
          connection_hash: 'conn_1',
          enabled: false,
          login_enabled: true,
          link_enabled: true,
          provisioning_mode: 'auto_create',
          default_user_group_hash: 'grp_1',
          existing_user_policy: 'deny',
        },
      ]),
    );
    expect(onChanged).toHaveBeenCalledTimes(1);
    expect(showToast).toHaveBeenCalledWith('Binding saved', 'success');
  });
});

describe('OAuthBindingEditor existing-user policy', () => {
  it('warns when "join default group" is selected', () => {
    renderEditor();

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/^Join default group/));

    expect(screen.getByRole('alert')).toHaveTextContent(
      /grants access to an account that was created elsewhere/i,
    );
  });
});

describe('OAuthBindingEditor effective state', () => {
  it('shows the server readiness roll-up and names the blocking layer', () => {
    renderEditor();

    expect(screen.getByText('Not enabled')).toBeInTheDocument();
    expect(screen.getByText(/blocked by Enabled for this project/i)).toBeInTheDocument();
  });

  it('shows "Sign-in ready" when the server says every layer passes', () => {
    renderEditor({ binding: binding({ enabled: true, ready: true, readiness: [] }) });

    expect(screen.getByText('Sign-in ready')).toBeInTheDocument();
  });
});
