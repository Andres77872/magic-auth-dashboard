import { createContext, useReducer, useEffect, useCallback, useRef } from 'react';
import type { ReactNode, JSX } from 'react';
import type { AuthState, AuthAction, User, UserType } from '@/types/auth.types';
import { AuthActionType } from '@/types/auth.types';
import { authService } from '@/services/auth.service';
import { permissionAssignmentsService } from '@/services/permission-assignments.service';
import { STORAGE_KEYS } from '@/utils/constants';
import { handleApiError } from '@/utils/error-handler';
import { hasPermission as checkPermission, canAccessRoute as checkRoute } from '@/utils/permissions';
import { cache } from '@/utils/cache';

// Try to restore auth state from localStorage immediately
const getInitialAuthState = (): AuthState => {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  const userDataStr = localStorage.getItem(STORAGE_KEYS.USER_DATA);
  const projectStr = localStorage.getItem(STORAGE_KEYS.CURRENT_PROJECT);

  // If we have stored data, start with it to eliminate blink
  if (token && userDataStr) {
    try {
      const user = JSON.parse(userDataStr);
      const currentProject = projectStr ? JSON.parse(projectStr) : null;
      
      return {
        isAuthenticated: true,
        user,
        token,
        currentProject,
        accessibleProjects: [],
        isLoading: true, // Still validate in background
        error: null,
        effectivePermissions: [],
        permissionsLoading: false,
      };
    } catch (e) {
      // If parsing fails, clear storage
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_PROJECT);
    }
  }

  // Default initial state
  return {
    isAuthenticated: false,
    user: null,
    token: null,
    currentProject: null,
    accessibleProjects: [],
    isLoading: true,
    error: null,
    effectivePermissions: [],
    permissionsLoading: false,
  };
};

const initialAuthState: AuthState = getInitialAuthState();

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
        effectivePermissions: [],
        permissionsLoading: false,
      };

    case AuthActionType.VALIDATE_TOKEN:
      if (action.payload.valid) {
        return {
          ...state,
          isAuthenticated: true,
          user: action.payload.user || null,
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

    case AuthActionType.LOAD_PERMISSIONS_START:
      return {
        ...state,
        permissionsLoading: true,
      };

    case AuthActionType.LOAD_PERMISSIONS_SUCCESS:
      return {
        ...state,
        effectivePermissions: action.payload.permissions,
        permissionsLoading: false,
      };

    case AuthActionType.LOAD_PERMISSIONS_FAILURE:
      return {
        ...state,
        permissionsLoading: false,
        error: action.payload.error,
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
  currentProject: AuthState['currentProject'];
  hasPermission: (permission: string) => boolean;
  canAccessRoute: (routePath: string) => boolean;
  loadUserPermissions: () => Promise<void>;
  effectivePermissions: string[];
  permissionsLoading: boolean;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);
  const tokenValidationRef = useRef(false);
  const permissionsLoadedRef = useRef(false);

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
      // Clear all stored data and cache
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_PROJECT);
      cache.clearAll();
      tokenValidationRef.current = false;
      permissionsLoadedRef.current = false;
      
      dispatch({ type: AuthActionType.LOGOUT });
    }
  };

  // Optimized token validation with caching
  const validateToken = async (): Promise<void> => {
    // Prevent duplicate validation calls
    if (tokenValidationRef.current) {
      return;
    }
    
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    
    if (!token) {
      dispatch({
        type: AuthActionType.VALIDATE_TOKEN,
        payload: { valid: false },
      });
      return;
    }

    tokenValidationRef.current = true;

    try {
      // Check cache first
      const cacheKey = `auth:validation:${token}`;
      const cachedValidation = cache.get<boolean>(cacheKey);
      
      if (cachedValidation === true) {
        // Use cached state, token already validated
        dispatch({
          type: AuthActionType.VALIDATE_TOKEN,
          payload: {
            valid: true,
            user: state.user || undefined,
            project: state.currentProject || undefined,
          },
        });
        return;
      }

      const response = await authService.validateSession();
      
      if (response.success && response.valid) {
        // Cache successful validation for 5 minutes
        cache.set(cacheKey, true, 5 * 60 * 1000);
        
        dispatch({
          type: AuthActionType.VALIDATE_TOKEN,
          payload: {
            valid: true,
            user: response.user,
            project: response.project,
          },
        });
      } else {
        // Token is invalid, clear everything
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_DATA);
        localStorage.removeItem(STORAGE_KEYS.CURRENT_PROJECT);
        cache.clearAll();
        
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
      cache.clearAll();
      
      dispatch({
        type: AuthActionType.VALIDATE_TOKEN,
        payload: { valid: false },
      });
    } finally {
      tokenValidationRef.current = false;
    }
  };

  // Clear error function
  const clearError = (): void => {
    dispatch({ type: AuthActionType.CLEAR_ERROR });
  };

  // Optimized RBAC permissions loading with caching
  const loadUserPermissions = useCallback(async (): Promise<void> => {
    if (!state.user || !state.currentProject) {
      return;
    }

    // ROOT users have all permissions
    if (state.user.user_type === 'root') {
      return;
    }

    // Prevent duplicate permission loading
    if (permissionsLoadedRef.current) {
      return;
    }

    const cacheKey = `permissions:${state.user.user_hash}:${state.currentProject.project_hash}`;
    
    // Check cache first
    const cachedPermissions = cache.get<string[]>(cacheKey);
    if (cachedPermissions) {
      dispatch({
        type: AuthActionType.LOAD_PERMISSIONS_SUCCESS,
        payload: { permissions: cachedPermissions },
      });
      return;
    }

    permissionsLoadedRef.current = true;
    dispatch({ type: AuthActionType.LOAD_PERMISSIONS_START });

    try {
      const response: any = await permissionAssignmentsService.getMyPermissions();
      const permissionNames = response.permissions || response.data || [];

      if (response.success !== false && Array.isArray(permissionNames)) {
        // Cache permissions for 5 minutes
        cache.set(cacheKey, permissionNames, 5 * 60 * 1000);
        
        dispatch({
          type: AuthActionType.LOAD_PERMISSIONS_SUCCESS,
          payload: { permissions: permissionNames },
        });
      } else {
        dispatch({
          type: AuthActionType.LOAD_PERMISSIONS_SUCCESS,
          payload: { permissions: [] },
        });
      }
    } catch (error) {
      console.warn('Failed to load user permissions:', error);
      dispatch({
        type: AuthActionType.LOAD_PERMISSIONS_SUCCESS,
        payload: { permissions: [] },
      });
    } finally {
      permissionsLoadedRef.current = false;
    }
  }, [state.user, state.currentProject]);

  // Enhanced permission checking function with RBAC integration
  const hasPermission = (permission: string): boolean => {
    if (!state.user) return false;
    
    // ROOT users have all permissions
    if (state.user.user_type === 'root') {
      return true;
    }
    
    // Check RBAC permissions first (from loaded effective permissions)
    if (state.effectivePermissions.includes(permission)) {
      return true;
    }
    
    // Fall back to user type-based permissions for system-level operations
    return checkPermission(state.user.user_type, permission);
  };

  // Route access checking function
  const canAccessRoute = (routePath: string): boolean => {
    if (!state.user) return false;
    
    return checkRoute(state.user.user_type, routePath);
  };

  // Initialize authentication on mount
  useEffect(() => {
    validateToken();
  }, []);

  // Load permissions when user and project are available
  useEffect(() => {
    if (state.isAuthenticated && state.user && state.currentProject) {
      loadUserPermissions();
    }
  }, [state.isAuthenticated, state.user, state.currentProject, loadUserPermissions]);

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
    currentProject: state.currentProject,
    hasPermission,
    canAccessRoute,
    loadUserPermissions,
    effectivePermissions: state.effectivePermissions,
    permissionsLoading: state.permissionsLoading,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Export context
export { AuthContext }; 