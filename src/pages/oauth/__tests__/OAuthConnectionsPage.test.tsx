import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OAuthConnectionsPage } from '../OAuthConnectionsPage';
import type {
  UseOAuthConnectionsOptions,
  UseOAuthConnectionsReturn,
  UseOAuthProvidersReturn,
} from '@/hooks/useOAuthConnections';
import type { OAuthConnectionListItem } from '@/types/oauth.types';

const mocks = vi.hoisted(() => ({
  isRoot: false,
  listOptions: [] as UseOAuthConnectionsOptions[],
  list: null as UseOAuthConnectionsReturn | null,
  catalog: null as UseOAuthProvidersReturn | null,
}));

vi.mock('@/hooks/useOAuthConnections', () => ({
  useOAuthConnections: (options: UseOAuthConnectionsOptions) => {
    mocks.listOptions.push(options);
    return mocks.list;
  },
  useOAuthProviders: () => mocks.catalog,
}));
vi.mock('@/hooks/useUserType', () => ({
  useUserType: () => ({ isRoot: mocks.isRoot }),
}));
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));
vi.mock('@/hooks', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('@/components/features/shared-pickers', () => ({
  ProjectBatchPickerDialog: () => null,
  EntityCombobox: () => null,
  useProjectOptions: () => ({
    options: [],
    isLoading: false,
    error: null,
    truncated: false,
  }),
}));

const ROW: OAuthConnectionListItem = {
  connection_hash: 'CONN 1',
  provider_type: 'google',
  display_name: 'Acme Google',
  status: 'draft',
  credential_status: 'absent',
  identity_namespace: 'google',
  binding_count: 2,
};

function listState(
  overrides: Partial<UseOAuthConnectionsReturn> = {}
): UseOAuthConnectionsReturn {
  return {
    connections: [ROW],
    pagination: { limit: 25, offset: 0, total: 1, has_more: false },
    isLoading: false,
    isRefreshing: false,
    error: null,
    refetch: vi.fn().mockResolvedValue(undefined),
    createConnection: vi.fn(),
    ...overrides,
  };
}

function catalogState(
  overrides: Partial<UseOAuthProvidersReturn> = {}
): UseOAuthProvidersReturn {
  return {
    providers: [],
    oauthEnabled: true,
    isLoading: false,
    isRefreshing: false,
    error: null,
    refetch: vi.fn().mockResolvedValue(undefined),
    pendingProvider: null,
    updateProvider: vi.fn(),
    ...overrides,
  };
}

function renderPage(url = '/oauth'): void {
  render(
    <MemoryRouter initialEntries={[url]}>
      <OAuthConnectionsPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isRoot = false;
  mocks.listOptions = [];
  mocks.list = listState();
  mocks.catalog = catalogState();
});

describe('OAuthConnectionsPage', () => {
  it('lists connections with sentence-case statuses and links to the detail page', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'OAuth' })).toBeInTheDocument();
    expect(screen.getByText(/^1 connection · /)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Acme Google' })).toHaveAttribute(
      'href',
      '/oauth/CONN%201'
    );
    const table = within(screen.getByRole('table'));
    expect(table.getByText('Draft')).toBeInTheDocument();
    expect(table.getByText('Not stored')).toBeInTheDocument();
  });

  it('offers "Create connection" to root only', () => {
    renderPage();
    expect(
      screen.queryByRole('button', { name: /create connection/i })
    ).not.toBeInTheDocument();
  });

  it('shows root the primary action', () => {
    mocks.isRoot = true;
    renderPage();
    expect(
      screen.getAllByRole('button', { name: /create connection/i }).length
    ).toBeGreaterThan(0);
  });

  it('passes URL filters to the server-side query', () => {
    renderPage('/oauth?status=active&provider=github&q=acme&page=2&limit=50');

    expect(mocks.listOptions.at(-1)).toEqual({
      limit: 50,
      offset: 50,
      providerType: 'github',
      status: 'active',
      search: 'acme',
    });
  });

  it('ignores an unknown status filter', () => {
    renderPage('/oauth?status=bogus');
    expect(mocks.listOptions.at(-1)?.status).toBeUndefined();
  });

  it('filters by status through the segmented control', async () => {
    renderPage();

    fireEvent.click(screen.getByRole('tab', { name: 'Disabled' }));

    await waitFor(() =>
      expect(mocks.listOptions.at(-1)?.status).toBe('disabled')
    );
  });

  it('shows an error with retry when the list cannot be loaded', () => {
    const list = listState({
      connections: [],
      error: 'Admin permission required',
    });
    mocks.list = list;
    renderPage();

    expect(screen.getByText('Admin permission required')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(list.refetch).toHaveBeenCalledTimes(1);
  });

  it('warns when OAuth is switched off for the deployment', () => {
    mocks.catalog = catalogState({ oauthEnabled: false });
    renderPage();
    expect(screen.getByRole('alert')).toHaveTextContent(/switched off/i);
  });
});
