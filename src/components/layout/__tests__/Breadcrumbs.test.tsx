import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import {
  BreadcrumbLabelProvider,
  useSetBreadcrumbLabel,
} from '@/contexts/BreadcrumbLabelContext';
import { Breadcrumbs } from '../Breadcrumbs';

function Label({ value }: { value: string }): null {
  useSetBreadcrumbLabel(value);
  return null;
}

function renderAt(path: string, label?: string): string[] {
  cleanup();
  render(
    <MemoryRouter initialEntries={[path]}>
      <BreadcrumbLabelProvider>
        {label && <Label value={label} />}
        <Breadcrumbs />
      </BreadcrumbLabelProvider>
    </MemoryRouter>
  );
  const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
  return within(nav)
    .getAllByRole('listitem')
    .map((item) => item.textContent ?? '');
}

describe('Breadcrumbs', () => {
  it('shows Overview on the home page', () => {
    expect(renderAt('/')).toEqual(['Overview']);
  });

  it('uses product names for sections', () => {
    expect(renderAt('/tokens')).toEqual(['API keys']);
    expect(renderAt('/email-templates')).toEqual(['Email templates']);
    expect(renderAt('/oauth')).toEqual(['OAuth']);
  });

  it('shows the entity name a detail page publishes', () => {
    expect(renderAt('/users/usr-0123456789abcdef', 'dana.whitfield')).toEqual([
      'Users',
      'dana.whitfield',
    ]);
  });

  it('truncates opaque ids until the name arrives', () => {
    const crumbs = renderAt('/projects/proj-0123456789abcdef0123');
    expect(crumbs[0]).toBe('Projects');
    expect(crumbs[1]).toContain('...');
  });

  it('treats project groups as their own area', () => {
    expect(renderAt('/groups?tab=project-groups')).toEqual(['Project groups']);
    expect(renderAt('/groups/project-groups/pg-1', 'All products')).toEqual([
      'Project groups',
      'All products',
    ]);
    expect(renderAt('/groups/project-groups/create')).toEqual([
      'Project groups',
      'New project group',
    ]);
  });

  it('appends the active tab and links back to the section', () => {
    const crumbs = renderAt('/permissions?tab=permission-groups');
    expect(crumbs).toEqual(['Roles & permissions', 'Permission groups']);
    expect(
      screen.getByRole('link', { name: 'Roles & permissions' })
    ).toHaveAttribute('href', '/permissions');
  });

  it('marks only the last crumb as the current page', () => {
    renderAt('/users/usr-1', 'ana');
    expect(screen.getByText('ana')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Users' })).not.toHaveAttribute(
      'aria-current'
    );
  });
});
