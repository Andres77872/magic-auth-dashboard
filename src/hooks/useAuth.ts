import { useContext, type ContextType } from 'react';
import { AuthContext } from '@/contexts/AuthContext';

export function useAuth(): NonNullable<ContextType<typeof AuthContext>> {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

export default useAuth;
