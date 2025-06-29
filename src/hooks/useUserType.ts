import { useAuth } from './useAuth';
import { UserType } from '@/types/auth.types';

export function useUserType() {
  const { user, userType, canAccessRoute } = useAuth();

  const isUserType = (type: UserType): boolean => {
    return userType === type;
  };

  const hasMinimumUserType = (minimumType: UserType): boolean => {
    if (!userType) return false;
    
    const hierarchy = {
      [UserType.CONSUMER]: 1,
      [UserType.ADMIN]: 2,
      [UserType.ROOT]: 3,
    };
    
    return hierarchy[userType] >= hierarchy[minimumType];
  };

  return {
    user,
    userType,
    
    // Type checking
    isRoot: isUserType(UserType.ROOT),
    isAdmin: isUserType(UserType.ADMIN),
    isConsumer: isUserType(UserType.CONSUMER),
    
    // Hierarchy checking
    hasMinimumUserType,
    isAdminOrHigher: hasMinimumUserType(UserType.ADMIN),
    
    // Route access
    canAccessRoute,
    
    // Display helpers
    getUserTypeLabel: (): string => {
      switch (userType) {
        case UserType.ROOT:
          return 'System Administrator';
        case UserType.ADMIN:
          return 'Project Administrator';
        case UserType.CONSUMER:
          return 'User';
        default:
          return 'Unknown';
      }
    },
    
    getUserTypeBadgeColor: (): string => {
      switch (userType) {
        case UserType.ROOT:
          return 'var(--color-error)';
        case UserType.ADMIN:
          return 'var(--color-warning)';
        case UserType.CONSUMER:
          return 'var(--color-info)';
        default:
          return 'var(--color-gray-500)';
      }
    },
  };
}

export default useUserType; 