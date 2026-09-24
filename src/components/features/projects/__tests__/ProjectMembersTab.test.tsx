import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProjectMembersTab } from '../ProjectMembersTab';
import type { UseProjectMembersReturn } from '@/hooks/useProjectDetails';
import type { ProjectMember } from '@/types/project.types';

const mocks = vi.hoisted(() => ({ useProjectMembers: vi.fn() }));
vi.mock('@/hooks/useProjectDetails', () => ({
  useProjectMembers: mocks.useProjectMembers,
}));

function member(overrides: Partial<ProjectMember>): ProjectMember {
  return {
    user_hash: 'usr-1',
    username: 'ana',
    email: 'ana@example.com',
    user_type: 'consumer',
    is_active: true,
    groups: [],
    access_level: 'group_access',
    joined_at: '2026-02-01T00:00:00Z',
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function state(
  members: ProjectMember[],
  total = members.length
): UseProjectMembersReturn {
  return {
    members,
    pagination: {
      limit: 25,
      offset: 0,
      total,
      has_more: total > members.length,
    },
    isLoading: false,
    isRefreshing: false,
    error: null,
    refetch: vi.fn().mockResolvedValue(undefined),
  };
}

function renderTab(): void {
  render(
    <MemoryRouter>
      <ProjectMembersTab projectHash="proj-1" />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.useProjectMembers.mockReturnValue(
    state(
      [
        member({
          user_hash: 'usr-root',
          username: 'root',
          user_type: 'root',
          access_level: 'root_access',
        }),
        member({ groups: ['user_crm', 'beta-testers', 'support', 'emea'] }),
      ],
      40
    )
  );
});

describe('ProjectMembersTab', () => {
  it('explains where members come from and shows the real total', () => {
    renderTab();

    expect(
      screen.getByText(
        /granted one of this project's project groups, plus every root user/
      )
    ).toBeInTheDocument();
    expect(screen.getByText(/· 40 members/)).toBeInTheDocument();
    expect(screen.getByText('Showing 1–2 of 40 members')).toBeInTheDocument();
  });

  it('shows group chips for consumers and "every project" for root users', () => {
    renderTab();

    expect(screen.getByText('user_crm')).toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();
    expect(screen.getByText('Every project')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'ana' })).toHaveAttribute(
      'href',
      '/users/usr-1'
    );
  });

  it('filters by user type on the server and returns to the first page', () => {
    renderTab();
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(mocks.useProjectMembers).toHaveBeenLastCalledWith('proj-1', {
      offset: 25,
      limit: 25,
      userType: undefined,
    });

    fireEvent.click(screen.getByRole('tab', { name: 'Admin' }));

    expect(mocks.useProjectMembers).toHaveBeenLastCalledWith('proj-1', {
      offset: 0,
      limit: 25,
      userType: 'admin',
    });
  });

  it('shows a retryable error', () => {
    const failed = {
      ...state([]),
      error: 'Access denied: project not in your administrative scope',
    };
    mocks.useProjectMembers.mockReturnValue(failed);
    renderTab();

    expect(
      screen.getByText(
        'Access denied: project not in your administrative scope'
      )
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(failed.refetch).toHaveBeenCalled();
  });
});
