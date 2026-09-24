import { useMemo } from 'react';
import type { ProjectGroupInfo } from '@/types/project.types';
import type { UserGroup } from '@/types/group.types';
import { ROUTES } from '@/utils/routes';

export type WorkflowStepStatus = 'complete' | 'incomplete' | 'unknown';

export interface WorkflowStep {
  id: 'project-group' | 'user-group-access' | 'members';
  label: string;
  description: string;
  status: WorkflowStepStatus;
  /** Next action for an incomplete step. */
  cta?:
    | { label: string; action: 'add-to-project-group' }
    | { label: string; action: 'navigate'; target: string };
}

export interface UseProjectWorkflowReturn {
  steps: WorkflowStep[];
  completedCount: number;
  isComplete: boolean;
}

interface UseProjectWorkflowParams {
  projectGroups: ProjectGroupInfo[];
  userGroups: UserGroup[];
  /** User groups could not be loaded, so steps 2 and 3 can't be evaluated. */
  userGroupsUnavailable?: boolean;
}

/**
 * Progress along USER → USER_GROUP → PROJECT_GROUP → PROJECT for one project:
 * is it in a project group, is a user group granted one of those project
 * groups, and does any of those user groups have members.
 */
export function useProjectWorkflow({
  projectGroups,
  userGroups,
  userGroupsUnavailable = false,
}: UseProjectWorkflowParams): UseProjectWorkflowReturn {
  const steps = useMemo<WorkflowStep[]>(() => {
    const hasProjectGroups = projectGroups.length > 0;
    const hasUserGroups = userGroups.length > 0;
    const groupWithMembers = userGroups.find(
      (group) => (group.member_count ?? 0) > 0
    );
    const firstUserGroup = userGroups[0];

    const projectGroupStep: WorkflowStep = {
      id: 'project-group',
      label: 'In a project group',
      description: hasProjectGroups
        ? `The project belongs to ${projectGroups.length} project group${projectGroups.length === 1 ? '' : 's'}.`
        : 'Add the project to a project group so user groups can be granted access.',
      status: hasProjectGroups ? 'complete' : 'incomplete',
      cta: hasProjectGroups
        ? undefined
        : { label: 'Add to project group', action: 'add-to-project-group' },
    };

    if (userGroupsUnavailable) {
      return [
        projectGroupStep,
        {
          id: 'user-group-access',
          label: 'Granted to a user group',
          description: 'User groups with access could not be loaded.',
          status: 'unknown',
        },
        {
          id: 'members',
          label: 'Users in those groups',
          description: 'User groups with access could not be loaded.',
          status: 'unknown',
        },
      ];
    }

    return [
      projectGroupStep,
      {
        id: 'user-group-access',
        label: 'Granted to a user group',
        description: hasUserGroups
          ? `${userGroups.length} user group${userGroups.length === 1 ? '' : 's'} can reach the project.`
          : 'Grant a user group one of the project groups above.',
        status: hasUserGroups ? 'complete' : 'incomplete',
        cta:
          hasProjectGroups && !hasUserGroups
            ? {
                label: 'Open user groups',
                action: 'navigate',
                target: ROUTES.GROUPS,
              }
            : undefined,
      },
      {
        id: 'members',
        label: 'Users in those groups',
        description: groupWithMembers
          ? 'At least one user group with access has members.'
          : 'None of the user groups with access has members yet.',
        status: groupWithMembers ? 'complete' : 'incomplete',
        cta:
          !groupWithMembers && firstUserGroup
            ? {
                label: 'Add users',
                action: 'navigate',
                target: `${ROUTES.GROUPS}/${encodeURIComponent(firstUserGroup.group_hash)}`,
              }
            : undefined,
      },
    ];
  }, [projectGroups, userGroups, userGroupsUnavailable]);

  const completedCount = steps.filter(
    (step) => step.status === 'complete'
  ).length;
  return { steps, completedCount, isComplete: completedCount === steps.length };
}

export default useProjectWorkflow;
