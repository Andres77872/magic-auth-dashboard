import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AccessCatalog } from '@/hooks/useAccessCatalog';

const panel = (name: string) =>
  function Panel(props: {
    selectedHash?: string | null;
    selectedGroupHash?: string | null;
  }): React.JSX.Element {
    return (
      <div data-testid="panel">
        {name}
        {props.selectedHash ? `:${props.selectedHash}` : ''}
        {props.selectedGroupHash ? `:${props.selectedGroupHash}` : ''}
      </div>
    );
  };

vi.mock('@/components/features/permissions/roles/RolesPanel', () => ({
  RolesPanel: panel('roles'),
}));
vi.mock(
  '@/components/features/permissions/permission-groups/PermissionGroupsPanel',
  () => ({
    PermissionGroupsPanel: panel('permission-groups'),
  })
);
vi.mock(
  '@/components/features/permissions/permissions/PermissionsPanel',
  () => ({
    PermissionsPanel: panel('permissions'),
  })
);
vi.mock(
  '@/components/features/permissions/assignments/UserGroupAssignmentsPanel',
  () => ({
    UserGroupAssignmentsPanel: panel('assignments'),
  })
);

const loaded = <T,>(data: T): AccessCatalog['roles'] =>
  ({
    data,
    error: null,
    isLoading: false,
    isRefreshing: false,
    updatedAt: null,
    refetch: vi.fn(),
  }) as unknown as AccessCatalog['roles'];

vi.mock('@/hooks/useAccessCatalog', () => ({
  useAccessCatalog: (): AccessCatalog => ({
    roles: loaded([{ role_hash: 'r1' }, { role_hash: 'r2' }]),
    permissionGroups: loaded([
      { group_hash: 'g1' },
    ]) as unknown as AccessCatalog['permissionGroups'],
    permissions: loaded([
      {},
      {},
      {},
    ]) as unknown as AccessCatalog['permissions'],
    groupCategories: [],
    permissionCategories: [],
  }),
}));

let adminOrHigher = true;
vi.mock('@/hooks', () => ({
  useUserType: () => ({ isAdminOrHigher: adminOrHigher }),
}));

const { PermissionManagementPage } =
  await import('../PermissionManagementPage');

function Location(): React.JSX.Element {
  const location = useLocation();
  return <div data-testid="location">{location.search}</div>;
}

function renderAt(path: string): void {
  render(
    <MemoryRouter initialEntries={[path]}>
      <PermissionManagementPage />
      <Location />
    </MemoryRouter>
  );
}

describe('PermissionManagementPage', () => {
  beforeEach(() => {
    adminOrHigher = true;
  });

  it('opens on roles by default and shows catalogue counts on the tabs', () => {
    renderAt('/permissions');
    expect(screen.getByTestId('panel')).toHaveTextContent('roles');
    expect(screen.getByRole('tab', { name: /Roles/ })).toHaveTextContent('2');
    expect(
      screen.getByRole('tab', { name: /Permission groups/ })
    ).toHaveTextContent('1');
    expect(screen.getByRole('tab', { name: /^Permissions/ })).toHaveTextContent(
      '3'
    );
  });

  it.each([
    ['groups', 'permission-groups'],
    ['my-permissions', 'roles'],
    ['analytics', 'roles'],
    ['nonsense', 'roles'],
  ])('maps the old ?tab=%s to the %s panel', (legacy, expected) => {
    renderAt(`/permissions?tab=${legacy}`);
    expect(screen.getByTestId('panel')).toHaveTextContent(expected);
  });

  it('updates the URL when switching tabs and clears item selection', () => {
    renderAt('/permissions?tab=roles&role=r1');
    expect(screen.getByTestId('panel')).toHaveTextContent('roles:r1');
    fireEvent.click(screen.getByRole('tab', { name: /Permission groups/ }));
    expect(screen.getByTestId('panel')).toHaveTextContent('permission-groups');
    expect(screen.getByTestId('location')).toHaveTextContent(
      '?tab=permission-groups'
    );
  });

  it('passes deep-linked selections to the panels', () => {
    renderAt('/permissions?tab=assignments&user_group=ug-7');
    expect(screen.getByTestId('panel')).toHaveTextContent('assignments:ug-7');
  });

  it('offers the create action that matches the tab', () => {
    renderAt('/permissions?tab=permissions');
    expect(
      screen.getByRole('button', { name: /Create permission/ })
    ).toBeInTheDocument();
  });

  it('hides create actions from operators who cannot edit', () => {
    adminOrHigher = false;
    renderAt('/permissions');
    expect(
      screen.queryByRole('button', { name: /Create role/ })
    ).not.toBeInTheDocument();
  });
});
