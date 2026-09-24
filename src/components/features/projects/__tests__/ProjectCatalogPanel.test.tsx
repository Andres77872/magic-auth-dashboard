import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { ProjectCatalogPanel } from '../ProjectCatalogPanel';
import type {
  CatalogedRole,
  GlobalPermissionGroup,
  GlobalRole,
} from '@/types/global-roles.types';
import type { CatalogedPermissionGroup } from '@/types/permission-assignments.types';

const mocks = vi.hoisted(() => ({
  useProjectCatalog: vi.fn(),
  useCatalogOptions: vi.fn(),
  addRole: vi.fn(),
  removeRole: vi.fn(),
  addPermissionGroup: vi.fn(),
  removePermissionGroup: vi.fn(),
  showToast: vi.fn(),
}));

vi.mock('@/hooks/useProjectDetails', () => ({
  useProjectCatalog: mocks.useProjectCatalog,
  useCatalogOptions: mocks.useCatalogOptions,
}));
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ showToast: mocks.showToast }),
}));

const editorRole: CatalogedRole = {
  id: 'r1',
  role_hash: 'role-editor',
  role_name: 'editor',
  role_display_name: 'Editor',
  role_description: 'Edits content',
  role_priority: 20,
  is_system_role: false,
  catalog_purpose: 'Content team',
  notes: null,
  added_at: '2026-04-01T00:00:00Z',
};

const billingGroup: CatalogedPermissionGroup = {
  id: 'g1',
  group_hash: 'pg-billing',
  group_name: 'billing_read',
  group_display_name: 'Billing read',
  group_description: null,
  group_category: 'billing',
  catalog_purpose: null,
  notes: 'Finance only',
  added_at: null,
};

const viewerRole: GlobalRole = {
  id: 'r2',
  role_hash: 'role-viewer',
  role_name: 'viewer',
  role_display_name: 'Viewer',
  role_description: 'Read only',
  role_priority: 10,
  is_system_role: true,
};

const allGroups: GlobalPermissionGroup[] = [
  {
    id: 'g1',
    group_hash: 'pg-billing',
    group_name: 'billing_read',
    group_display_name: 'Billing read',
    group_category: 'billing',
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  mocks.useProjectCatalog.mockReturnValue({
    catalog: { roles: [editorRole], permissionGroups: [billingGroup] },
    pending: null,
    addRole: mocks.addRole,
    removeRole: mocks.removeRole,
    addPermissionGroup: mocks.addPermissionGroup,
    removePermissionGroup: mocks.removePermissionGroup,
    isLoading: false,
    isRefreshing: false,
    error: null,
    refetch: vi.fn(),
  });
  mocks.useCatalogOptions.mockReturnValue({
    options: {
      roles: [{ ...editorRole }, viewerRole],
      permissionGroups: allGroups,
    },
    isLoading: false,
    isRefreshing: false,
    error: null,
    refetch: vi.fn(),
  });
});

describe('ProjectCatalogPanel', () => {
  it('shows both catalogs in stacked panels and says the catalog grants nothing', () => {
    render(<ProjectCatalogPanel projectHash="proj-1" projectName="CRM" />);

    expect(screen.getByText(/it grants nothing/)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Suggested roles' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Suggested permission groups' })
    ).toBeInTheDocument();
    expect(screen.getByText('Editor')).toBeInTheDocument();
    expect(screen.getByText('Purpose: Content team')).toBeInTheDocument();
    expect(screen.getByText('Billing read')).toBeInTheDocument();
    expect(screen.getByText('Finance only')).toBeInTheDocument();
    // No nested tab bars.
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
  });

  it('adds a role that is not in the catalog yet, with its purpose', async () => {
    mocks.addRole.mockResolvedValue(undefined);
    render(<ProjectCatalogPanel projectHash="proj-1" projectName="CRM" />);

    fireEvent.click(screen.getByRole('button', { name: 'Add role' }));
    const dialog = await screen.findByRole('dialog');
    const select = within(dialog).getByLabelText('Role');
    // Already-suggested roles are not offered.
    expect(
      within(select).queryByRole('option', { name: 'Editor' })
    ).not.toBeInTheDocument();

    fireEvent.change(select, { target: { value: 'role-viewer' } });
    fireEvent.change(within(dialog).getByLabelText('Purpose'), {
      target: { value: ' Auditors ' },
    });
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Add to catalog' })
    );

    await waitFor(() =>
      expect(mocks.addRole).toHaveBeenCalledWith('role-viewer', {
        catalog_purpose: 'Auditors',
        notes: undefined,
      })
    );
    expect(mocks.showToast).toHaveBeenCalledWith(
      'Added to the catalog.',
      'success'
    );
  });

  it('removes a permission group after confirmation', async () => {
    mocks.removePermissionGroup.mockResolvedValue(undefined);
    render(<ProjectCatalogPanel projectHash="proj-1" projectName="CRM" />);

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Remove Billing read from the catalog',
      })
    );
    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByText(/No one's access changes/)
    ).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Remove' }));

    await waitFor(() =>
      expect(mocks.removePermissionGroup).toHaveBeenCalledWith('pg-billing')
    );
    expect(mocks.removeRole).not.toHaveBeenCalled();
  });

  it('reports a failed load with a retry', () => {
    const refetch = vi.fn();
    mocks.useProjectCatalog.mockReturnValue({
      ...mocks.useProjectCatalog(),
      catalog: null,
      error: 'Project not found',
      refetch,
    });
    render(<ProjectCatalogPanel projectHash="proj-1" projectName="CRM" />);

    const retries = screen.getAllByRole('button', { name: 'Try again' });
    fireEvent.click(retries[0]);
    expect(refetch).toHaveBeenCalled();
  });
});
