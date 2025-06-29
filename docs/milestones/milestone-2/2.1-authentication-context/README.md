# Milestone 2.1: Authentication Context

## Overview
**Duration**: Day 1-2  
**Goal**: Create global authentication state management using React Context API with session persistence and token validation

## 📋 Tasks Checklist

### Step 1: Authentication State Management
- [ ] Create authentication state interface
- [ ] Implement authentication reducer with actions
- [ ] Add state validation and type safety
- [ ] Handle authentication errors

### Step 2: Context Provider Implementation
- [ ] Create AuthContext with React.createContext
- [ ] Implement AuthProvider component
- [ ] Add state initialization and persistence
- [ ] Handle token validation on app load

### Step 3: Authentication Hooks
- [ ] Create useAuth hook for context access
- [ ] Implement usePermissions hook
- [ ] Add useUserType helper hook
- [ ] Create authentication utilities

### Step 4: Session Management
- [ ] Implement token persistence in localStorage
- [ ] Add automatic token validation
- [ ] Handle token refresh logic
- [ ] Add session timeout management

---

## 🔧 Detailed Implementation Steps

### Step 1: Create Authentication State Interface

Create `src/contexts/AuthContext.tsx`:

```typescript
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AuthState, AuthAction, AuthActionType, User, UserType } from '@/types/auth.types';
import { authService } from '@/services/auth.service';
import { STORAGE_KEYS } from '@/utils/constants';
import { handleApiError } from '@/utils/error-handler';

// Initial authentication state
const initialAuthState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  currentProject: null,
  accessibleProjects: [],
  isLoading: true, // Start with loading true for token validation
  error: null,
};

// Authentication reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case AuthActionType.LOGIN_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case AuthActionType.LOGIN_SUCCESS:
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.session_token,
        currentProject: action.payload.project || null,
        accessibleProjects: action.payload.accessible_projects || [],
        isLoading: false,
        error: null,
      };

    case AuthActionType.LOGIN_FAILURE:
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        currentProject: null,
        accessibleProjects: [],
        isLoading: false,
        error: action.payload.error,
      };

    case AuthActionType.LOGOUT:
      return {
        ...initialAuthState,
        isLoading: false,
      };

    case AuthActionType.VALIDATE_TOKEN:
      if (action.payload.valid) {
        return {
          ...state,
          isAuthenticated: true,
          user: action.payload.user,
          currentProject: action.payload.project || state.currentProject,
          isLoading: false,
          error: null,
        };
      } else {
        return {
          ...initialAuthState,
          isLoading: false,
        };
      }

    case AuthActionType.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
}

// Context interface
interface AuthContextType {
  state: AuthState;
  login: (username: string, password: string, projectHash?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  validateToken: () => Promise<void>;
  clearError: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | null;
  userType: UserType | null;
  hasPermission: (permission: string) => boolean;
  canAccessRoute: (routePath: string) => boolean;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);
```

### Step 2: Context Provider Implementation

Continue `src/contexts/AuthContext.tsx`:

```typescript
// AuthProvider component
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  // Login function
  const login = async (
    username: string, 
    password: string, 
    projectHash?: string
  ): Promise<boolean> => {
    try {
      dispatch({ type: AuthActionType.LOGIN_START });

      const response = await authService.login({
        username,
        password,
        project_hash: projectHash,
      });

      if (response.success) {
        // Store token and user data
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.session_token);
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.user));
        
        if (response.project) {
          localStorage.setItem(STORAGE_KEYS.CURRENT_PROJECT, JSON.stringify(response.project));
        }

        dispatch({
          type: AuthActionType.LOGIN_SUCCESS,
          payload: response,
        });

        return true;
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch({
        type: AuthActionType.LOGIN_FAILURE,
        payload: { error: errorMessage },
      });
      return false;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      // Clear all stored data
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_PROJECT);
      
      dispatch({ type: AuthActionType.LOGOUT });
    }
  };

  // Token validation function
  const validateToken = async (): Promise<void> => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    
    if (!token) {
      dispatch({
        type: AuthActionType.VALIDATE_TOKEN,
        payload: { valid: false },
      });
      return;
    }

    try {
      const response = await authService.validateSession();
      
      if (response.success && response.valid) {
        dispatch({
          type: AuthActionType.VALIDATE_TOKEN,
          payload: {
            valid: true,
            user: response.user,
            project: response.project,
          },
        });
      } else {
        // Token is invalid, clear storage
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_DATA);
        localStorage.removeItem(STORAGE_KEYS.CURRENT_PROJECT);
        
        dispatch({
          type: AuthActionType.VALIDATE_TOKEN,
          payload: { valid: false },
        });
      }
    } catch (error) {
      console.error('Token validation failed:', error);
      // Clear storage on validation error
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_PROJECT);
      
      dispatch({
        type: AuthActionType.VALIDATE_TOKEN,
        payload: { valid: false },
      });
    }
  };

  // Clear error function
  const clearError = (): void => {
    dispatch({ type: AuthActionType.CLEAR_ERROR });
  };

  // Permission checking function
  const hasPermission = (permission: string): boolean => {
    if (!state.user) return false;
    
    // Import permission checking utility from Phase 1
    const { hasPermission: checkPermission } = require('@/utils/permissions');
    return checkPermission(state.user.user_type, permission);
  };

  // Route access checking function
  const canAccessRoute = (routePath: string): boolean => {
    if (!state.user) return false;
    
    // Import route checking utility from Phase 1
    const { canAccessRoute: checkRoute } = require('@/utils/permissions');
    return checkRoute(state.user.user_type, routePath);
  };

  // Initialize authentication on mount
  useEffect(() => {
    validateToken();
  }, []);

  // Context value
  const contextValue: AuthContextType = {
    state,
    login,
    logout,
    validateToken,
    clearError,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    userType: state.user?.user_type || null,
    hasPermission,
    canAccessRoute,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Export context
export { AuthContext };
```

### Step 3: Authentication Hooks

Create `src/hooks/useAuth.ts`:

```typescript
import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

export default useAuth;
```

Create `src/hooks/usePermissions.ts`:

```typescript
import { useAuth } from './useAuth';
import { PERMISSIONS } from '@/utils/permissions';

export function usePermissions() {
  const { hasPermission, userType, isAuthenticated } = useAuth();

  return {
    // Permission checking
    hasPermission,
    
    // User type checks
    isRoot: userType === 'root',
    isAdmin: userType === 'admin' || userType === 'root',
    isConsumer: userType === 'consumer',
    
    // Specific permission checks
    canCreateUser: hasPermission(PERMISSIONS.CREATE_USER),
    canCreateAdmin: hasPermission(PERMISSIONS.CREATE_ADMIN),
    canCreateRoot: hasPermission(PERMISSIONS.CREATE_ROOT),
    canCreateProject: hasPermission(PERMISSIONS.CREATE_PROJECT),
    canViewSystemHealth: hasPermission(PERMISSIONS.VIEW_SYSTEM_HEALTH),
    canManageSystem: hasPermission(PERMISSIONS.MANAGE_SYSTEM_SETTINGS),
    
    // General auth state
    isAuthenticated,
    userType,
  };
}

export default usePermissions;
```

Create `src/hooks/useUserType.ts`:

```typescript
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
```

### Step 4: Context Index File

Create `src/contexts/index.ts`:

```typescript
export { AuthProvider, AuthContext } from './AuthContext';
export type { AuthState, AuthAction } from '@/types/auth.types';
```

Create `src/hooks/index.ts`:

```typescript
export { default as useAuth } from './useAuth';
export { default as usePermissions } from './usePermissions';
export { default as useUserType } from './useUserType';
```

### Step 5: Error Boundary for Authentication

Create `src/components/common/ErrorBoundary.tsx`:

```typescript
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Authentication error caught by boundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-boundary">
          <h2>Authentication Error</h2>
          <p>Something went wrong with the authentication system.</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

### Step 6: Update Main App Component

Update `src/App.tsx`:

```typescript
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts';
import { ErrorBoundary } from '@/components/common';
import './styles/globals.css';

function App(): JSX.Element {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <div className="app">
            {/* Routes will be added in next milestone */}
            <div className="app-content">
              <h1>Magic Auth Dashboard</h1>
              <p>Authentication system ready</p>
            </div>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
```

---

## 🧪 Testing & Verification

### Step 1: Context Testing
Create a temporary test component:

```typescript
// src/test-auth-context.tsx (temporary)
import React from 'react';
import { useAuth, usePermissions, useUserType } from '@/hooks';

export function AuthTestComponent(): JSX.Element {
  const auth = useAuth();
  const permissions = usePermissions();
  const userType = useUserType();

  const handleLogin = async () => {
    const success = await auth.login('test_admin', 'test_password');
    console.log('Login success:', success);
  };

  const handleLogout = async () => {
    await auth.logout();
    console.log('Logged out');
  };

  return (
    <div className="auth-test">
      <h2>Authentication Test</h2>
      
      <div className="auth-status">
        <p>Authenticated: {auth.isAuthenticated ? 'Yes' : 'No'}</p>
        <p>Loading: {auth.isLoading ? 'Yes' : 'No'}</p>
        <p>User Type: {userType.getUserTypeLabel()}</p>
        <p>Error: {auth.state.error || 'None'}</p>
      </div>

      <div className="auth-actions">
        <button onClick={handleLogin} disabled={auth.isLoading}>
          Test Login
        </button>
        <button onClick={handleLogout} disabled={auth.isLoading}>
          Test Logout
        </button>
      </div>

      <div className="permissions-test">
        <h3>Permissions</h3>
        <p>Can Create User: {permissions.canCreateUser ? 'Yes' : 'No'}</p>
        <p>Can Create Admin: {permissions.canCreateAdmin ? 'Yes' : 'No'}</p>
        <p>Is Admin or Higher: {userType.isAdminOrHigher ? 'Yes' : 'No'}</p>
      </div>
    </div>
  );
}
```

### Step 2: Session Persistence Testing
Test localStorage persistence:

```typescript
// Test in browser console
// 1. Login with valid credentials
// 2. Refresh page
// 3. Check if authentication state persists
// 4. Check localStorage for token and user data
console.log('Token:', localStorage.getItem('magic_auth_token'));
console.log('User:', localStorage.getItem('magic_auth_user'));
```

### Step 3: Error Handling Testing
Test various error scenarios:

```typescript
// Test invalid credentials
await auth.login('invalid', 'credentials');

// Test network error (disconnect internet)
await auth.validateToken();

// Test token expiration
// Manually expire token and test validation
```

---

## 📁 Files Created/Modified

### New Files
- `src/contexts/AuthContext.tsx` - Main authentication context
- `src/contexts/index.ts` - Context exports
- `src/hooks/useAuth.ts` - Authentication hook
- `src/hooks/usePermissions.ts` - Permission checking hook
- `src/hooks/useUserType.ts` - User type utilities
- `src/hooks/index.ts` - Hook exports
- `src/components/common/ErrorBoundary.tsx` - Error boundary component
- `src/components/common/index.ts` - Common component exports

### Modified Files
- `src/App.tsx` - Added AuthProvider wrapper

---

## ✅ Completion Criteria

- [ ] AuthContext created with proper TypeScript types
- [ ] Authentication reducer handles all state transitions
- [ ] Session persistence works across browser refreshes
- [ ] Token validation happens on app initialization
- [ ] Hooks provide easy access to auth state and utilities
- [ ] Permission checking functions work correctly
- [ ] Error handling captures and displays auth errors
- [ ] No TypeScript compilation errors
- [ ] Context provides type-safe access to auth state

---

## 🔍 Manual Testing Checklist

- [ ] App loads without errors
- [ ] AuthContext provides all expected functions
- [ ] useAuth hook works in components
- [ ] Permission checks return correct values
- [ ] Token persists after page refresh
- [ ] Invalid tokens are handled gracefully
- [ ] Error states are managed properly
- [ ] TypeScript types are enforced

---

## 🎉 MILESTONE COMPLETION

**Status**: Ready for implementation  
**Next Step**: [Milestone 2.2: Route Protection System](../2.2-route-protection/README.md)

### Key Deliverables
- ✅ Global authentication state management
- ✅ React Context with TypeScript support
- ✅ Authentication hooks for components
- ✅ Session persistence and token validation
- ✅ Permission checking utilities
- ✅ Error boundary for auth failures

### Integration Points
- Uses API services from Phase 1 ✅
- Leverages auth types from Phase 1 ✅
- Implements permission utilities from Phase 1 ✅
- Ready for route guards in next milestone ✅

The authentication context is now ready to power the entire dashboard with secure state management and session handling. 