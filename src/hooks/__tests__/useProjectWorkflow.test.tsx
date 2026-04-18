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

const makeProjectGroup = (overrides: Partial<ProjectGroupInfo> = {}): ProjectGroupInfo => ({
  group_hash: 'PG-test',
  group_name: 'test-pg',
  ...overrides,
});

describe('useProjectWorkflow', () => {
  it('returns all steps incomplete when no project groups and no user groups', () => {
    const { result } = renderHook(() =>
      useProjectWorkflow({
        projectHash: 'proj-1',
        projectGroups: [],
        userGroups: [],
      })
    );

    expect(result.current.steps).toHaveLength(3);
    expect(result.current.steps[0].isComplete).toBe(false);
    expect(result.current.steps[1].isComplete).toBe(false);
    expect(result.current.steps[2].isComplete).toBe(false);
    expect(result.current.completedCount).toBe(0);
    expect(result.current.completionPercentage).toBe(0);
    expect(result.current.isComplete).toBe(false);
  });

  it('marks step 1 complete when project groups exist', () => {
    const { result } = renderHook(() =>
      useProjectWorkflow({
        projectHash: 'proj-1',
        projectGroups: [makeProjectGroup()],
        userGroups: [],
      })
    );

    expect(result.current.steps[0].isComplete).toBe(true);
    expect(result.current.steps[1].isComplete).toBe(false);
    expect(result.current.steps[2].isComplete).toBe(false);
    expect(result.current.completedCount).toBe(1);
    expect(result.current.completionPercentage).toBe(33);
  });

  it('marks steps 1-2 complete when project groups and user groups exist', () => {
    const { result } = renderHook(() =>
      useProjectWorkflow({
        projectHash: 'proj-1',
        projectGroups: [makeProjectGroup()],
        userGroups: [makeUserGroup()],
      })
    );

    expect(result.current.steps[0].isComplete).toBe(true);
    expect(result.current.steps[1].isComplete).toBe(true);
    expect(result.current.steps[2].isComplete).toBe(false);
    expect(result.current.completedCount).toBe(2);
    expect(result.current.completionPercentage).toBe(67);
  });

  it('marks all steps complete when users are assigned', () => {
    const { result } = renderHook(() =>
      useProjectWorkflow({
        projectHash: 'proj-1',
        projectGroups: [makeProjectGroup()],
        userGroups: [makeUserGroup({ member_count: 5 })],
      })
    );

    expect(result.current.steps[0].isComplete).toBe(true);
    expect(result.current.steps[1].isComplete).toBe(true);
    expect(result.current.steps[2].isComplete).toBe(true);
    expect(result.current.completedCount).toBe(3);
    expect(result.current.completionPercentage).toBe(100);
    expect(result.current.isComplete).toBe(true);
  });

  it('provides CTA for "Add to Project Group" when step 1 incomplete', () => {
    const { result } = renderHook(() =>
      useProjectWorkflow({
        projectHash: 'proj-1',
        projectGroups: [],
        userGroups: [],
      })
    );

    const cta = result.current.steps[0].cta;
    expect(cta).toBeDefined();
    expect(cta!.label).toBe('Add to Project Group');
    expect(cta!.action).toBe('open-modal');
    expect(cta!.target).toBe('add-to-project-group');
  });

  it('provides CTA for "Grant User Group Access" when step 2 incomplete', () => {
    const { result } = renderHook(() =>
      useProjectWorkflow({
        projectHash: 'proj-1',
        projectGroups: [makeProjectGroup()],
        userGroups: [],
      })
    );

    const cta = result.current.steps[1].cta;
    expect(cta).toBeDefined();
    expect(cta!.label).toBe('Grant User Group Access');
    expect(cta!.action).toBe('navigate');
    expect(cta!.target).toBe('/dashboard/groups');
  });

  it('provides CTA for "Add Users" when step 3 incomplete with firstUserGroupHash', () => {
    const { result } = renderHook(() =>
      useProjectWorkflow({
        projectHash: 'proj-1',
        projectGroups: [makeProjectGroup()],
        userGroups: [makeUserGroup({ group_hash: 'UG-abc' })],
        firstUserGroupHash: 'UG-abc',
      })
    );

    const cta = result.current.steps[2].cta;
    expect(cta).toBeDefined();
    expect(cta!.label).toBe('Add Users');
    expect(cta!.action).toBe('navigate');
    expect(cta!.target).toBe('/dashboard/groups/UG-abc');
  });

  it('does not provide "Add Users" CTA when no user group hash is available', () => {
    const { result } = renderHook(() =>
      useProjectWorkflow({
        projectHash: 'proj-1',
        projectGroups: [makeProjectGroup()],
        userGroups: [makeUserGroup()],
        // firstUserGroupHash not provided
      })
    );

    expect(result.current.steps[2].cta).toBeUndefined();
  });

  it('does not provide CTAs for completed steps', () => {
    const { result } = renderHook(() =>
      useProjectWorkflow({
        projectHash: 'proj-1',
        projectGroups: [makeProjectGroup()],
        userGroups: [makeUserGroup({ member_count: 5 })],
      })
    );

    result.current.steps.forEach((step) => {
      expect(step.cta).toBeUndefined();
    });
  });

  it('marks step 2 as unknown when userGroupsFetchError is true', () => {
    const { result } = renderHook(() =>
      useProjectWorkflow({
        projectHash: 'proj-1',
        projectGroups: [makeProjectGroup()],
        userGroups: [],
        userGroupsFetchError: true,
      })
    );

    expect(result.current.steps[1].isComplete).toBe(false);
    expect(result.current.steps[1].isUnknown).toBe(true);
    expect(result.current.steps[1].description).toBe(
      'Unable to determine which user groups have access.'
    );
    // No CTA when in error state
    expect(result.current.steps[1].cta).toBeUndefined();
  });

  it('still shows step 1 complete even when userGroupsFetchError is true', () => {
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
});
