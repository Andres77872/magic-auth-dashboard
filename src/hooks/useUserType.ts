import { useAuth } from './useAuth';
import { UserType, type User } from '@/types/auth.types';
import { getUserTypeLabel } from '@/utils/component-utils';

const RANK: Record<UserType, number> = {
  [UserType.CONSUMER]: 1,
  [UserType.ADMIN]: 2,
  [UserType.ROOT]: 3,
};

interface UseUserTypeReturn {
  user: User | null;
  userType: UserType | null;
  isRoot: boolean;
  isAdmin: boolean;
  isConsumer: boolean;
  isAdminOrHigher: boolean;
  hasMinimumUserType: (minimumType: UserType) => boolean;
  canAccessRoute: (route: string) => boolean;
  /** "Root", "Admin" or "Consumer" for the signed-in operator. */
  getUserTypeLabel: () => string;
}

/**
 * The signed-in operator's user type. Use for UX decisions only — the API
 * enforces every permission independently.
 */
export function useUserType(): UseUserTypeReturn {
  const { user, userType, canAccessRoute } = useAuth();

  const hasMinimumUserType = (minimumType: UserType): boolean =>
    userType !== null && RANK[userType] >= RANK[minimumType];

  return {
    user,
    userType,
    isRoot: userType === UserType.ROOT,
    isAdmin: userType === UserType.ADMIN,
    isConsumer: userType === UserType.CONSUMER,
    isAdminOrHigher: hasMinimumUserType(UserType.ADMIN),
    hasMinimumUserType,
    canAccessRoute,
    getUserTypeLabel: () => (userType ? getUserTypeLabel(userType) : 'Unknown'),
  };
}

export default useUserType;
