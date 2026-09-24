import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { useTabParam } from '../useTabParam';

const TABS = ['members', 'projects', 'permissions'] as const;
function Harness(): React.JSX.Element {
  const [tab, setTab] = useTabParam(TABS, 'members');
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <div data-testid="tab">{tab}</div>
      <div data-testid="search">{location.search}</div>
      <button type="button" onClick={() => setTab('projects')}>
        projects
      </button>
      <button type="button" onClick={() => setTab('permissions')}>
        permissions
      </button>
      <button type="button" onClick={() => void navigate(-1)}>
        back
      </button>
    </>
  );
}

function renderAt(path: string): void {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Harness />
    </MemoryRouter>
  );
}

describe('useTabParam', () => {
  it('falls back to the default without a tab', () => {
    renderAt('/groups/g1');
    expect(screen.getByTestId('tab')).toHaveTextContent('members');
  });

  it('falls back to the default for unknown values', () => {
    renderAt('/groups/g1?tab=nope');
    expect(screen.getByTestId('tab')).toHaveTextContent('members');
  });

  it('reads a valid tab from the URL', () => {
    renderAt('/groups/g1?tab=permissions');
    expect(screen.getByTestId('tab')).toHaveTextContent('permissions');
  });

  it('keeps other query parameters when switching', () => {
    renderAt('/groups/g1?q=ana&page=2');
    fireEvent.click(screen.getByRole('button', { name: 'projects' }));
    expect(screen.getByTestId('tab')).toHaveTextContent('projects');
    expect(screen.getByTestId('search')).toHaveTextContent(
      '?q=ana&page=2&tab=projects'
    );
  });

  it('pushes a history entry so Back returns to the previous tab', () => {
    renderAt('/groups/g1?tab=projects');
    fireEvent.click(screen.getByRole('button', { name: 'permissions' }));
    fireEvent.click(screen.getByRole('button', { name: 'back' }));
    expect(screen.getByTestId('tab')).toHaveTextContent('projects');
  });
});
