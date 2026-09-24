import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProjectSignInTab } from '../ProjectSignInTab';
import type {
  UseOAuthConnectionsReturn,
  UseProjectOAuthBindingsReturn,
} from '@/hooks/useOAuthConnections';
import type {
  OAuthBindingInfo,
  OAuthConnectionListItem,
} from '@/types/oauth.types';

const mocks = vi.hoisted(() => ({
  showToast: vi.fn(),
  isRoot: false,
  bindings: null as UseProjectOAuthBindingsReturn | null,
  connections: null as UseOAuthConnectionsReturn | null,
}));

vi.mock('@/hooks/useOAuthConnections', () => ({
  useProjectOAuthBindings: () => mocks.bindings,
  useOAuthConnections: () => mocks.connections,
  useOAuthDefaultGroupOptions: () => ({
    groups: [],
    isLoading: false,
    error: null,
  }),
}));
vi.mock('@/hooks/useUserType', () => ({
  useUserType: () => ({ isRoot: mocks.isRoot }),
}));
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ showToast: mocks.showToast }),
}));
vi.mock('@/hooks', () => ({
  useToast: () => ({ showToast: mocks.showToast }),
}));

const BINDING: OAuthBindingInfo = {
  connection_key: 'google',
  connection_hash: 'CONN-1',
  provider_type: 'google',
  connection_display_name: 'Acme Google',
  connection_status: 'active',
  credential_status: 'active',
  project_hash: 'proj-1',
  project_name: 'Alpha',
  enabled: true,
  login_enabled: true,
  link_enabled: true,
  provisioning_mode: 'disabled',
  existing_user_policy: 'deny',
  init_mode: 'api',
  has_legacy_redeem: false,
  delivery_mode: 'bff',
  urls: [],
  ready: false,
  readiness: [
    { check: 'binding_disabled', ok: true, message: '' },
    {
      check: 'no_redirect_uri',
      ok: false,
      message: 'No redirect URI is configured.',
    },
  ],
};

function listItem(
  overrides: Partial<OAuthConnectionListItem>
): OAuthConnectionListItem {
  return {
    connection_hash: 'CONN-2',
    provider_type: 'google',
    display_name: 'Second Google',
    status: 'active',
    credential_status: 'active',
    binding_count: 0,
    ...overrides,
  };
}

function bindingsState(
  overrides: Partial<UseProjectOAuthBindingsReturn> = {}
): UseProjectOAuthBindingsReturn {
  return {
    bindings: [BINDING],
    oauthEnabled: true,
    isLoading: false,
    isRefreshing: false,
    error: null,
    refetch: vi.fn().mockResolvedValue(undefined),
    enableConnection: vi.fn().mockResolvedValue(undefined),
    saveBinding: vi.fn().mockResolvedValue(undefined),
    removeBinding: vi.fn().mockResolvedValue(undefined),
    addUrl: vi.fn().mockResolvedValue(undefined),
    removeUrl: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function connectionsState(
  connections: OAuthConnectionListItem[]
): UseOAuthConnectionsReturn {
  return {
    connections,
    pagination: {
      limit: 200,
      offset: 0,
      total: connections.length,
      has_more: false,
    },
    isLoading: false,
    isRefreshing: false,
    error: null,
    refetch: vi.fn().mockResolvedValue(undefined),
    createConnection: vi.fn(),
  };
}

function renderTab(): void {
  render(
    <MemoryRouter>
      <ProjectSignInTab projectHash="proj-1" projectName="Alpha" />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isRoot = false;
  mocks.bindings = bindingsState();
  mocks.connections = connectionsState([]);
});

describe('ProjectSignInTab', () => {
  it('shows one panel per binding with its state and failing checks, without another tab bar', () => {
    renderTab();

    const heading = screen.getByRole('heading', { name: /Acme Google/ });
    expect(within(heading).getByText('Not ready')).toBeInTheDocument();
    expect(
      screen.getByText('No redirect URI is configured.')
    ).toBeInTheDocument();
    // Only the per-binding segmented control; the project page owns the page tabs.
    expect(screen.getAllByRole('tablist')).toHaveLength(1);
    expect(
      screen.getByRole('tablist', { name: 'Acme Google settings' })
    ).toBeInTheDocument();
  });

  it('switches a binding between readiness, URLs and policy', () => {
    renderTab();

    fireEvent.click(screen.getByRole('tab', { name: /URLs/ }));
    expect(
      screen.getByRole('button', { name: /add url/i })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Policy' }));
    expect(
      screen.getByRole('button', { name: /save policy/i })
    ).toBeInTheDocument();
  });

  it('warns when OAuth is off for the deployment', () => {
    mocks.bindings = bindingsState({ oauthEnabled: false });
    renderTab();
    expect(screen.getByRole('alert')).toHaveTextContent(
      /switched off for this deployment/i
    );
  });

  it('shows an empty state with one action when nothing is bound', () => {
    mocks.bindings = bindingsState({ bindings: [] });
    renderTab();

    expect(screen.getByText('No sign-in providers yet')).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: /add provider/i })
    ).toHaveLength(1);
  });

  it('confirms before removing a provider, then calls the hook', async () => {
    const state = bindingsState();
    mocks.bindings = state;
    renderTab();

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Remove Acme Google from this project',
      })
    );
    expect(
      await screen.findByText(/its allowed URLs are deleted/i)
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Remove provider' }));

    await waitFor(() =>
      expect(state.removeBinding).toHaveBeenCalledWith('google')
    );
    expect(mocks.showToast).toHaveBeenCalledWith(
      'Acme Google removed from this project',
      'success'
    );
  });

  it('offers admins only shared or own connections and suggests a free key', async () => {
    const state = bindingsState();
    mocks.bindings = state;
    mocks.connections = connectionsState([
      listItem({ connection_hash: 'CONN-1', display_name: 'Acme Google' }),
      listItem({ connection_hash: 'CONN-2', display_name: 'Second Google' }),
      listItem({
        connection_hash: 'CONN-3',
        display_name: 'Other project Google',
        owner_project_hash: 'proj-9',
      }),
      listItem({
        connection_hash: 'CONN-4',
        display_name: 'Old Google',
        status: 'archived',
      }),
    ]);
    renderTab();

    fireEvent.click(screen.getByRole('button', { name: /add provider/i }));
    const dialog = await screen.findByRole('dialog');

    expect(within(dialog).getByText('Second Google')).toBeInTheDocument();
    expect(within(dialog).queryByText('Acme Google')).not.toBeInTheDocument();
    expect(
      within(dialog).queryByText('Other project Google')
    ).not.toBeInTheDocument();
    expect(within(dialog).queryByText('Old Google')).not.toBeInTheDocument();

    fireEvent.click(within(dialog).getByLabelText(/Second Google/));
    expect(within(dialog).getByLabelText('Connection key')).toHaveValue(
      'google-2'
    );

    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Add provider' })
    );
    await waitFor(() =>
      expect(state.enableConnection).toHaveBeenCalledWith('CONN-2', 'google-2')
    );
  });
});
