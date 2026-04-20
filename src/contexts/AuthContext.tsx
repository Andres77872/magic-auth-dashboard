import { createContext, useReducer, useEffect, useCallback, useRef, useState } from 'react';
import type { ReactNode, JSX } from 'react';
import type { AuthState, AuthAction, User, UserType, LoginResponse, PlatformLoginResponse } from '@/types/auth.types';
import { AuthActionType } from '@/types/auth.types';
import { authService } from '@/services/auth.service';
import { permissionAssignmentsService } from '@/services/permission-assignments.service';
import { STORAGE_KEYS } from '@/utils/constants';
import { handleApiError } from '@/utils/error-handler';
import { hasPermission as checkPermission, canAccessRoute as checkRoute } from '@/utils/permissions';
import { cache } from '@/utils/cache';

// Session expiry storage key
const SESSION_EXPIRES_AT_KEY = 'session_expires_at';

// Refresh threshold: 5 minutes before expiry
const REFRESH_THRESHOLD_MS = 5 * 60 * 1000;
// Retry delay on refresh failure
const REFRESH_RETRY_DELAY_MS = 30 * 1000;
// Max refresh retries before warning
const MAX_REFRESH_RETRIES = 3;

// Try to restore auth state from localStorage immediately
const getInitialAuthState = (): AuthState => {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  const userDataStr = localStorage.getItem(STORAGE_KEYS.USER_DATA);
  const projectStr = localStorage.getItem(STORAGE_KEYS.CURRENT_PROJECT);
  const expiresAtStr = localStorage.getItem(SESSION_EXPIRES_AT_KEY);

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
        sessionExpiresAt: expiresAtStr || null,
      };
    } catch {
      // If parsing fails, clear storage
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_PROJECT);
      localStorage.removeItem(SESSION_EXPIRES_AT_KEY);
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
    sessionExpiresAt: null,
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
        sessionExpiresAt: action.payload.expires_at || null,
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
        sessionExpiresAt: null,
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

    case AuthActionType.SESSION_EXPIRY_UPDATE:
      return {
        ...state,
        sessionExpiresAt: action.payload.expires_at,
      };

    default:
      return state;
  }
}

// Context interface
interface AuthContextType {
  state: AuthState;
  login: (username: string, password: string, projectHash?: string) => Promise<boolean>;
  platformLogin: (username: string, password: string) => Promise<boolean>;
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
  sessionExpiresAt: string | null;
  refreshSession: () => Promise<boolean>;
  refreshRetryCount: number;
  showSessionExpiryWarning: boolean;
  dismissSessionExpiryWarning: () => void;
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
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshRetryCountRef = useRef(0);
  const isRefreshingRef = useRef(false);
  const [showSessionExpiryWarning, setShowSessionExpiryWarning] = useState(false);

  // Dismiss session expiry warning
  const dismissSessionExpiryWarning = useCallback(() => {
    setShowSessionExpiryWarning(false);
  }, []);

  // ==========================================
  // SESSION AUTO-REFRESH TIMER MANAGEMENT
  // ==========================================

  // Stop refresh timer
  const stopRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    refreshRetryCountRef.current = 0;
  }, []);

  // Refresh session function
  const refreshSession = useCallback(async (): Promise<boolean> => {
    if (isRefreshingRef.current) {
      return false;
    }

    isRefreshingRef.current = true;

    try {
      const response = await authService.refreshToken();
      
      if (response.success && 'session_token' in response && 'expires_at' in response) {
        // Handle both LoginResponse and PlatformLoginResponse
        const loginData = response;
        
        // Update token in storage
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, loginData.session_token);
        
        // Update expiry
        localStorage.setItem(SESSION_EXPIRES_AT_KEY, loginData.expires_at);
        
        // Dispatch expiry update
        dispatch({
          type: AuthActionType.SESSION_EXPIRY_UPDATE,
          payload: { expires_at: loginData.expires_at },
        });

        // Reset retry count
        refreshRetryCountRef.current = 0;
        
        // Restart timer with new expiry
        return true;
      }
      
      return false;
    } catch (error) {
      console.warn('Session refresh failed:', error);
      return false;
    } finally {
      isRefreshingRef.current = false;
    }
  }, []);

  // Start refresh timer - triggers 5 minutes before expiry
  const startRefreshTimer = useCallback((expiresAt: string) => {
    // Stop any existing timer
    stopRefreshTimer();

    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();

    // Calculate when to refresh (5 minutes before expiry)
    const refreshDelay = diffMs - REFRESH_THRESHOLD_MS;

    if (refreshDelay <= 0) {
      // Already within refresh threshold - refresh immediately
      void refreshSession().then((success) => {
        if (success) {
          // Read fresh expiry from localStorage (dispatch may have updated it)
          const newExpiresAt = localStorage.getItem(SESSION_EXPIRES_AT_KEY);
          if (newExpiresAt) {
            startRefreshTimer(newExpiresAt);
          }
        } else {
          setShowSessionExpiryWarning(true);
        }
      });
      return;
    }

    // Set timer
    refreshTimerRef.current = setTimeout(async () => {
      const success = await refreshSession();
      
      if (success) {
        // Get new expiry from state (updated by dispatch)
        const newExpiresAt = localStorage.getItem(SESSION_EXPIRES_AT_KEY);
        if (newExpiresAt) {
          startRefreshTimer(newExpiresAt);
        }
      } else {
        // Refresh failed - retry with delay
        refreshRetryCountRef.current++;
        
        if (refreshRetryCountRef.current <= MAX_REFRESH_RETRIES) {
          // Retry after 30 seconds
          refreshTimerRef.current = setTimeout(async () => {
            const retrySuccess = await refreshSession();
            if (retrySuccess) {
              const newExpiresAt = localStorage.getItem(SESSION_EXPIRES_AT_KEY);
              if (newExpiresAt) {
                startRefreshTimer(newExpiresAt);
              }
            } else {
              refreshRetryCountRef.current++;
              if (refreshRetryCountRef.current > MAX_REFRESH_RETRIES) {
                setShowSessionExpiryWarning(true);
              }
            }
          }, REFRESH_RETRY_DELAY_MS);
        } else {
          // Max retries exceeded - show warning modal
          setShowSessionExpiryWarning(true);
        }
      }
    }, refreshDelay);
  }, [stopRefreshTimer, refreshSession]);

  // Visibility change listener - refresh on window focus if near expiry
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && state.sessionExpiresAt) {
        const expiryDate = new Date(state.sessionExpiresAt);
        const now = new Date();
        const diffMs = expiryDate.getTime() - now.getTime();

        // If within 10 minutes of expiry, try refresh
        if (diffMs < 10 * 60 * 1000 && diffMs > 0) {
          const success = await refreshSession();
          if (success) {
            const newExpiresAt = localStorage.getItem(SESSION_EXPIRES_AT_KEY);
            if (newExpiresAt) {
              startRefreshTimer(newExpiresAt);
            }
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [state.sessionExpiresAt, refreshSession, startRefreshTimer]);

  // Start/stop timer based on session expiry state
  useEffect(() => {
    if (state.isAuthenticated && state.sessionExpiresAt) {
      startRefreshTimer(state.sessionExpiresAt);
    } else {
      stopRefreshTimer();
    }

    return () => stopRefreshTimer();
  }, [state.isAuthenticated, state.sessionExpiresAt, startRefreshTimer, stopRefreshTimer]);

  // ==========================================
  // LOGIN/LOGOUT HANDLERS
  // ==========================================

  // Login function (project-scoped)
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
        project_hash: projectHash ?? '',
      });

      if (response.success) {
        // Store token and user data
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.session_token);
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.user));
        
        if (response.project) {
          localStorage.setItem(STORAGE_KEYS.CURRENT_PROJECT, JSON.stringify(response.project));
        }

        // Store session expiry
        if (response.expires_at) {
          localStorage.setItem(SESSION_EXPIRES_AT_KEY, response.expires_at);
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

  /**
   * Platform login (for admin dashboard — root/admin only).
   * POST /auth/platform/login — no project binding.
   */
  const platformLogin = async (
    username: string, 
    password: string
  ): Promise<boolean> => {
    try {
      dispatch({ type: AuthActionType.LOGIN_START });

      const response = await authService.platformLogin({
        username,
        password,
      });

      if (response.success) {
        // Store token and user data
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.session_token);
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.user));
        
        // Platform sessions have no bound project — clear any stale project data
        localStorage.removeItem(STORAGE_KEYS.CURRENT_PROJECT);

        // Store session expiry
        if (response.expires_at) {
          localStorage.setItem(SESSION_EXPIRES_AT_KEY, response.expires_at);
        }

        // Dispatch with null project (platform session)
        dispatch({
          type: AuthActionType.LOGIN_SUCCESS,
          payload: {
            ...response,
            project: undefined,
          } as LoginResponse,
        });

        return true;
      } else {
        throw new Error(response.message || 'Platform login failed');
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
    // Stop refresh timer
    stopRefreshTimer();
    
    try {
      await authService.logout();
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      // Clear all stored data and cache
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_PROJECT);
      localStorage.removeItem(SESSION_EXPIRES_AT_KEY);
      cache.clearAll();
      tokenValidationRef.current = false;
      permissionsLoadedRef.current = false;
      refreshRetryCountRef.current = 0;
      
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
    platformLogin,
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
    sessionExpiresAt: state.sessionExpiresAt,
    refreshSession,
    refreshRetryCount: refreshRetryCountRef.current,
    showSessionExpiryWarning,
    dismissSessionExpiryWarning,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Export context
export { AuthContext }; 