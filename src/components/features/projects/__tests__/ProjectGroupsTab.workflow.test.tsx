import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useProjectWorkflow } from '@/hooks/useProjectWorkflow';
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

const makeProjectGroup = (overrides: Partial<ProjectGroupInfo> = {}): ProjectGroupInfo => ({
  group_hash: 'PG-1',
  group_name: 'test-pg',
  ...overrides,
});

describe('ProjectGroupsTab — Workflow Progress Integration', () => {
  it('provides actionable "Add Users" CTA when user groups exist but no users assigned', () => {
    const { result } = renderHook(() =>
      useProjectWorkflow({
        projectHash: 'proj-1',
        projectGroups: [makeProjectGroup()],
        userGroups: [makeUserGroup({ group_hash: 'UG-first', member_count: 0 })],
        firstUserGroupHash: 'UG-first',
      })
    );

    const step3 = result.current.steps[2];
    expect(step3.isComplete).toBe(false);
    expect(step3.cta).toBeDefined();
    expect(step3.cta!.label).toBe('Add Users');
    expect(step3.cta!.action).toBe('navigate');
    expect(step3.cta!.target).toBe('/dashboard/groups/UG-first');
  });

  it('shows unknown/error state for step 2 when userGroupsFetchError is true', () => {
    const { result } = renderHook(() =>
      useProjectWorkflow({
        projectHash: 'proj-1',
        projectGroups: [makeProjectGroup()],
        userGroups: [],
        userGroupsFetchError: true,
      })
    );

    const step2 = result.current.steps[1];
    expect(step2.isComplete).toBe(false);
    expect(step2.isUnknown).toBe(true);
    expect(step2.description).toBe('Unable to determine which user groups have access.');
    expect(step2.cta).toBeUndefined();
  });

  it('step 1 remains complete even when step 2 has error', () => {
    const { result } = renderHook(() =>
      useProjectWorkflow({
        projectHash: 'proj-1',
        projectGroups: [makeProjectGroup()],
        userGroups: [],
        userGroupsFetchError: true,
      })
    );

    expect(result.current.steps[0].isComplete).toBe(true);
    expect(result.current.steps[0].isUnknown).toBeFalsy();
  });

  it('completion percentage accounts for unknown steps as incomplete', () => {
    const { result } = renderHook(() =>
      useProjectWorkflow({
        projectHash: 'proj-1',
        projectGroups: [makeProjectGroup()],
        userGroups: [],
        userGroupsFetchError: true,
      })
    );

    // Step 1 complete, step 2 unknown (incomplete), step 3 incomplete
    expect(result.current.completedCount).toBe(1);
    expect(result.current.completionPercentage).toBe(33);
    expect(result.current.isComplete).toBe(false);
  });
});
