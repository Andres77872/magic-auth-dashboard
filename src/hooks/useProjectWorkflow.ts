import { useMemo } from 'react';
import type { ProjectGroupInfo } from '@/types/project.types';
import type { UserGroup } from '@/types/group.types';

export interface WorkflowStep {
  id: string;
  label: string;
  description: string;
  isComplete: boolean;
  /** When a fetch error prevented evaluation, this is true and the step shows an unknown/error state */
  isUnknown?: boolean;
  cta?: {
    label: string;
    action: 'open-modal' | 'navigate';
    target?: string;
  };
}

export interface UseProjectWorkflowReturn {
  steps: WorkflowStep[];
  completedCount: number;
  totalCount: number;
  completionPercentage: number;
  isComplete: boolean;
}

interface UseProjectWorkflowParams {
  projectHash: string;
  projectGroups: ProjectGroupInfo[];
  userGroups: UserGroup[];
  /** Whether fetching user groups failed — marks step 2 as unknown */
  userGroupsFetchError?: boolean;
  /** Hash of the first user group, used for the "Add Users" CTA target */
  firstUserGroupHash?: string;
  onOpenAddToGroupModal?: () => void;
}

/**
 * Computes workflow progress for the USER → USER_GROUP → PROJECT_GROUP → PROJECT chain
 * for a specific project.
 */
export function useProjectWorkflow({
  projectHash,
  projectGroups,
  userGroups,
  userGroupsFetchError = false,
  firstUserGroupHash,
  onOpenAddToGroupModal,
}: UseProjectWorkflowParams): UseProjectWorkflowReturn {
  const steps = useMemo<WorkflowStep[]>(() => {
    const hasProjectGroups = projectGroups.length > 0;
    const hasUserGroups = userGroups.length > 0;
    const hasUsersAssigned = userGroups.some((g) => (g.member_count ?? 0) > 0);

    // Build the "Add Users" target from the first available user group
    const addUserGroupTarget = firstUserGroupHash
      ? `/dashboard/groups/${firstUserGroupHash}`
      : undefined;

    return [
      {
        id: 'project-group-membership',
        label: 'Project Group Membership',
        description: hasProjectGroups
          ? `This project is in ${projectGroups.length} project group(s).`
          : 'This project is not assigned to any project group yet.',
        isComplete: hasProjectGroups,
        cta: !hasProjectGroups
          ? {
              label: 'Add to Project Group',
              action: 'open-modal',
              target: 'add-to-project-group',
            }
          : undefined,
      },
      {
        id: 'user-group-access',
        label: 'User Group Access',
        description: userGroupsFetchError
          ? 'Unable to determine which user groups have access.'
          : hasUserGroups
            ? `${userGroups.length} user group(s) can access this project.`
            : 'No user groups have been granted access to the project groups above.',
        isComplete: hasUserGroups,
        isUnknown: userGroupsFetchError,
        cta:
          hasProjectGroups && !hasUserGroups && !userGroupsFetchError
            ? {
                label: 'Grant User Group Access',
                action: 'navigate',
                target: '/dashboard/groups',
              }
            : undefined,
      },
      {
        id: 'user-assignment',
        label: 'User Assignment',
        description: hasUsersAssigned
          ? 'Consumer users are assigned to user groups with access.'
          : 'No consumer users are assigned to the user groups that have access.',
        isComplete: hasUsersAssigned,
        cta:
          hasUserGroups && !hasUsersAssigned && addUserGroupTarget
            ? {
                label: 'Add Users',
                action: 'navigate',
                target: addUserGroupTarget,
              }
            : undefined,
      },
    ];
  }, [projectGroups, userGroups, userGroupsFetchError, firstUserGroupHash]);

  const completedCount = steps.filter((s) => s.isComplete).length;
  const totalCount = steps.length;
  const completionPercentage = Math.round((completedCount / totalCount) * 100);
  const isComplete = completedCount === totalCount;

  return {
    steps,
    completedCount,
    totalCount,
    completionPercentage,
    isComplete,
  };
}
