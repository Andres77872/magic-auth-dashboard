import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useProjectWorkflow } from '../useProjectWorkflow';
import type { ProjectGroupInfo } from '@/types/project.types';
import type { UserGroup } from '@/types/group.types';

const makeUserGroup = (overrides: Partial<UserGroup> = {}): UserGroup => ({
  group_hash: 'UG-test',
  group_name: 'test-group',
  description: 'Test group',
  member_count: 0,
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

const makeProjectGroup = (
  overrides: Partial<ProjectGroupInfo> = {}
): ProjectGroupInfo => ({
  group_hash: 'PG-test',
  group_name: 'test-pg',
  description: null,
  ...overrides,
});

function statuses(result: ReturnType<typeof useProjectWorkflow>): string[] {
  return result.steps.map((step) => step.status);
}

describe('useProjectWorkflow', () => {
  it('reports every step as to do for a project outside any project group', () => {
    const { result } = renderHook(() =>
      useProjectWorkflow({ projectGroups: [], userGroups: [] })
    );

    expect(statuses(result.current)).toEqual([
      'incomplete',
      'incomplete',
      'incomplete',
    ]);
    expect(result.current.completedCount).toBe(0);
    expect(result.current.isComplete).toBe(false);
    expect(result.current.steps[0].cta).toEqual({
      label: 'Add to project group',
      action: 'add-to-project-group',
    });
    // No grant CTA before the project is in a project group.
    expect(result.current.steps[1].cta).toBeUndefined();
  });

  it('points to user groups once the project is in a project group', () => {
    const { result } = renderHook(() =>
      useProjectWorkflow({
        projectGroups: [makeProjectGroup()],
        userGroups: [],
      })
    );

    expect(statuses(result.current)).toEqual([
      'complete',
      'incomplete',
      'incomplete',
    ]);
    expect(result.current.steps[1].cta).toEqual({
      label: 'Open user groups',
      action: 'navigate',
      target: '/groups',
    });
  });

  it('links to the first user group when none of the granted groups has members', () => {
    const { result } = renderHook(() =>
      useProjectWorkflow({
        projectGroups: [makeProjectGroup()],
        userGroups: [makeUserGroup({ group_hash: 'UG a/b', member_count: 0 })],
      })
    );

    expect(statuses(result.current)).toEqual([
      'complete',
      'complete',
      'incomplete',
    ]);
    // Hashes are opaque path segments and must be encoded.
    expect(result.current.steps[2].cta).toEqual({
      label: 'Add users',
      action: 'navigate',
      target: '/groups/UG%20a%2Fb',
    });
  });

  it('is complete when a granted user group has members, with no calls to action', () => {
    const { result } = renderHook(() =>
      useProjectWorkflow({
        projectGroups: [makeProjectGroup()],
        userGroups: [
          makeUserGroup({ member_count: 0 }),
          makeUserGroup({ group_hash: 'UG-2', member_count: 3 }),
        ],
      })
    );

    expect(result.current.isComplete).toBe(true);
    expect(result.current.completedCount).toBe(3);
    result.current.steps.forEach((step) => expect(step.cta).toBeUndefined());
  });

  it('treats a null member count as no members', () => {
    const { result } = renderHook(() =>
      useProjectWorkflow({
        projectGroups: [makeProjectGroup()],
        userGroups: [makeUserGroup({ member_count: null })],
      })
    );

    expect(result.current.steps[2].status).toBe('incomplete');
  });

  it('marks the user-group steps unknown when they could not be loaded', () => {
    const { result } = renderHook(() =>
      useProjectWorkflow({
        projectGroups: [makeProjectGroup()],
        userGroups: [],
        userGroupsUnavailable: true,
      })
    );

    expect(statuses(result.current)).toEqual([
      'complete',
      'unknown',
      'unknown',
    ]);
    expect(result.current.steps[1].cta).toBeUndefined();
    expect(result.current.steps[2].cta).toBeUndefined();
    expect(result.current.isComplete).toBe(false);
  });
});
