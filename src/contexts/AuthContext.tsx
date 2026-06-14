import { createContext, useReducer, useEffect, useCallback, useRef, useState } from 'react';
import type { ReactNode, JSX } from 'react';
import type { AuthState, AuthAction, User, UserType, LoginResponse } from '@/types/auth.types';
import { AuthActionType } from '@/types/auth.types';
import { authService } from '@/services/auth.service';
import { permissionAssignmentsService } from '@/services/permission-assignments.service';
import { STORAGE_KEYS } from '@/utils/constants';
import { handleApiError } from '@/utils/error-handler';
import { hasPermission as checkPermission, canAccessRoute as checkRoute } from '@/utils/permissions';
import { cache } from '@/utils/cache';

const SESSION_EXPIRES_AT_KEY = 'session_expires_at';
const REFRESH_THRESHOLD_MS = 5 * 60 * 1000;
const REFRESH_RETRY_DELAY_MS = 30 * 1000;
const MAX_REFRESH_RETRIES = 3;
const REMEMBERED_REFRESH_MIN_SECONDS = 7 * 24 * 60 * 60;

const getPermissionNames = (
  response: Awaited<ReturnType<typeof permissionAssignmentsService.getMyPermissions>>
): string[] => {
  return Array.isArray(response.data) ? response.data : [];
};

const clearStoredAuthState = (): void => {
  localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER_DATA);
  localStorage.removeItem(STORAGE_KEYS.CURRENT_PROJECT);
  localStorage.removeItem(SESSION_EXPIRES_AT_KEY);
};

const isRememberedResponse = (payload: LoginResponse): boolean => {
  return (payload.refresh_expires_in ?? 0) > REMEMBERED_REFRESH_MIN_SECONDS;
};

const initialAuthState: AuthState = {
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
  refreshExpiresAt: null,
  rememberMe: false,
};

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
        token: null,
        currentProject: action.payload.project || null,
        accessibleProjects: action.payload.accessible_projects || [],
        isLoading: false,
        error: null,
        sessionExpiresAt: action.payload.expires_at || null,
        refreshExpiresAt: action.payload.refresh_expires_at || null,
        rememberMe: isRememberedResponse(action.payload),
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
        sessionExpiresAt: null,
        refreshExpiresAt: null,
        rememberMe: false,
      };

    case AuthActionType.LOGOUT:
      return {
        ...initialAuthState,
        isLoading: false,
        effectivePermissions: [],
        permissionsLoading: false,
        sessionExpiresAt: null,
        refreshExpiresAt: null,
        rememberMe: false,
      };

    case AuthActionType.VALIDATE_TOKEN:
      if (action.payload.valid) {
        return {
          ...state,
          isAuthenticated: true,
          user: action.payload.user || null,
          currentProject: action.payload.project || null,
          isLoading: false,
          error: null,
          sessionExpiresAt: action.payload.expires_at || state.sessionExpiresAt,
          refreshExpiresAt: action.payload.refresh_expires_at || state.refreshExpiresAt,
          rememberMe: action.payload.remember_me ?? state.rememberMe,
        };
      }

      return {
        ...initialAuthState,
        isLoading: false,
      };

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
        refreshExpiresAt: action.payload.refresh_expires_at || state.refreshExpiresAt,
        rememberMe: action.payload.remember_me ?? state.rememberMe,
      };

    default:
      return state;
  }
}

interface AuthContextType {
  state: AuthState;
  login: (username: string, password: string, projectHash?: string, rememberMe?: boolean) => Promise<boolean>;
  platformLogin: (username: string, password: string, rememberMe?: boolean) => Promise<boolean>;
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
  refreshExpiresAt: string | null;
  rememberMe: boolean;
  refreshSession: () => Promise<boolean>;
  refreshRetryCount: number;
  showSessionExpiryWarning: boolean;
  dismissSessionExpiryWarning: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);
  const tokenValidationRef = useRef(false);
  const permissionsLoadedRef = useRef(false);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshRetryCountRef = useRef(0);
  const refreshPromiseRef = useRef<Promise<boolean> | null>(null);
  const [refreshRetryCount, setRefreshRetryCount] = useState(0);
  const [showSessionExpiryWarning, setShowSessionExpiryWarning] = useState(false);

  const dismissSessionExpiryWarning = useCallback(() => {
    setShowSessionExpiryWarning(false);
  }, []);

  const updateRefreshRetryCount = useCallback((count: number): void => {
    refreshRetryCountRef.current = count;
    setRefreshRetryCount(count);
  }, []);

  const stopRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    updateRefreshRetryCount(0);
  }, [updateRefreshRetryCount]);

  const clearClientAuthState = useCallback(() => {
    clearStoredAuthState();
    cache.clearAll();
    tokenValidationRef.current = false;
    permissionsLoadedRef.current = false;
    updateRefreshRetryCount(0);
  }, [updateRefreshRetryCount]);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    if (!refreshPromiseRef.current) {
      refreshPromiseRef.current = (async (): Promise<boolean> => {
        try {
          const response = await authService.refreshToken();

          if (response.success && response.expires_at) {
            clearStoredAuthState();
            dispatch({
              type: AuthActionType.LOGIN_SUCCESS,
              payload: response,
            });
            setShowSessionExpiryWarning(false);
            updateRefreshRetryCount(0);
            return true;
          }

          return false;
        } catch (error) {
          console.warn('Session refresh failed:', error);
          return false;
        } finally {
          refreshPromiseRef.current = null;
        }
      })();
    }

    return refreshPromiseRef.current;
  }, [updateRefreshRetryCount]);

  const startRefreshTimer = useCallback((expiresAt: string) => {
    stopRefreshTimer();

    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();
    const refreshDelay = diffMs - REFRESH_THRESHOLD_MS;

    if (refreshDelay <= 0) {
      void refreshSession().then((success) => {
        if (!success) {
          setShowSessionExpiryWarning(true);
        }
      });
      return;
    }

    refreshTimerRef.current = setTimeout((): void => {
      void (async (): Promise<void> => {
        const success = await refreshSession();

        if (!success) {
          updateRefreshRetryCount(refreshRetryCountRef.current + 1);

          if (refreshRetryCountRef.current <= MAX_REFRESH_RETRIES) {
            refreshTimerRef.current = setTimeout((): void => {
              void (async (): Promise<void> => {
                const retrySuccess = await refreshSession();
                if (!retrySuccess) {
                  updateRefreshRetryCount(refreshRetryCountRef.current + 1);
                  if (refreshRetryCountRef.current > MAX_REFRESH_RETRIES) {
                    setShowSessionExpiryWarning(true);
                  }
                }
              })();
            }, REFRESH_RETRY_DELAY_MS);
          } else {
            setShowSessionExpiryWarning(true);
          }
        }
      })();
    }, refreshDelay);
  }, [stopRefreshTimer, refreshSession, updateRefreshRetryCount]);

  useEffect(() => {
    const handleVisibilityChange = (): void => {
      if (document.visibilityState === 'visible' && state.sessionExpiresAt) {
        const expiryDate = new Date(state.sessionExpiresAt);
        const now = new Date();
        const diffMs = expiryDate.getTime() - now.getTime();

        if (diffMs < 10 * 60 * 1000 && diffMs > 0) {
          void refreshSession();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return (): void => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [state.sessionExpiresAt, refreshSession]);

  useEffect(() => {
    const timerId = window.setTimeout((): void => {
      if (state.isAuthenticated && state.sessionExpiresAt) {
        startRefreshTimer(state.sessionExpiresAt);
      } else {
        stopRefreshTimer();
      }
    }, 0);

    return (): void => {
      window.clearTimeout(timerId);
      stopRefreshTimer();
    };
  }, [state.isAuthenticated, state.sessionExpiresAt, startRefreshTimer, stopRefreshTimer]);
  const login = async (
    username: string,
    password: string,
    projectHash?: string,
    rememberMe = false
  ): Promise<boolean> => {
    try {
      dispatch({ type: AuthActionType.LOGIN_START });

      const response = await authService.login({
        username,
        password,
        project_hash: projectHash ?? '',
        remember_me: rememberMe,
      });

      if (response.success) {
        clearStoredAuthState();
        dispatch({
          type: AuthActionType.LOGIN_SUCCESS,
          payload: response,
        });
        return true;
      }

      throw new Error(response.message || 'Login failed');
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch({
        type: AuthActionType.LOGIN_FAILURE,
        payload: { error: errorMessage },
      });
      return false;
    }
  };

  const platformLogin = async (
    username: string,
    password: string,
    rememberMe = false
  ): Promise<boolean> => {
    try {
      dispatch({ type: AuthActionType.LOGIN_START });

      const response = await authService.platformLogin({
        username,
        password,
        remember_me: rememberMe,
      });

      if (response.success) {
        clearStoredAuthState();
        dispatch({
          type: AuthActionType.LOGIN_SUCCESS,
          payload: {
            ...response,
            project: undefined,
          },
        });
        return true;
      }

      throw new Error(response.message || 'Platform login failed');
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch({
        type: AuthActionType.LOGIN_FAILURE,
        payload: { error: errorMessage },
      });
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    stopRefreshTimer();

    try {
      await authService.logout();
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      clearClientAuthState();
      dispatch({ type: AuthActionType.LOGOUT });
    }
  };

  const validateToken = useCallback(async (): Promise<void> => {
    if (tokenValidationRef.current) {
      return;
    }

    tokenValidationRef.current = true;

    try {
      const response = await authService.validateSession();

      if (response.success && response.valid) {
        clearStoredAuthState();
        dispatch({
          type: AuthActionType.VALIDATE_TOKEN,
          payload: {
            valid: true,
            user: response.user,
            project: response.project,
            expires_at: response.session?.expires_at,
            refresh_expires_at: response.session?.refresh_expires_at,
            remember_me: response.session?.remember_me,
          },
        });
        return;
      }

      throw new Error(response.message || 'Invalid session');
    } catch (error) {
      console.warn('Token validation failed:', error);
      clearClientAuthState();
      dispatch({
        type: AuthActionType.VALIDATE_TOKEN,
        payload: { valid: false },
      });
    } finally {
      tokenValidationRef.current = false;
    }
  }, [clearClientAuthState]);

  const clearError = (): void => {
    dispatch({ type: AuthActionType.CLEAR_ERROR });
  };

  const loadUserPermissions = useCallback(async (): Promise<void> => {
    if (!state.user || !state.currentProject) {
      return;
    }

    if (state.user.user_type === 'root') {
      return;
    }

    if (permissionsLoadedRef.current) {
      return;
    }

    const cacheKey = `permissions:${state.user.user_hash}:${state.currentProject.project_hash}`;
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
      const response = await permissionAssignmentsService.getMyPermissions();
      const permissionNames = getPermissionNames(response);

      if (response.success !== false && Array.isArray(permissionNames)) {
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

  const hasPermission = (permission: string): boolean => {
    if (!state.user) return false;

    if (state.user.user_type === 'root') {
      return true;
    }

    if (state.effectivePermissions.includes(permission)) {
      return true;
    }

    return checkPermission(state.user.user_type, permission);
  };

  const canAccessRoute = (routePath: string): boolean => {
    if (!state.user) return false;
    return checkRoute(state.user.user_type, routePath);
  };

  useEffect(() => {
    void validateToken();
  }, [validateToken]);

  useEffect(() => {
    const handleUnauthorized = (): void => {
      stopRefreshTimer();
      clearClientAuthState();
      dispatch({ type: AuthActionType.LOGOUT });
    };

    window.addEventListener('magic-auth-unauthorized', handleUnauthorized);
    return (): void => window.removeEventListener('magic-auth-unauthorized', handleUnauthorized);
  }, [clearClientAuthState, stopRefreshTimer]);

  useEffect(() => {
    if (state.isAuthenticated && state.user && state.currentProject) {
      void loadUserPermissions();
    }
  }, [state.isAuthenticated, state.user, state.currentProject, loadUserPermissions]);

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
    refreshExpiresAt: state.refreshExpiresAt,
    rememberMe: state.rememberMe,
    refreshSession,
    refreshRetryCount,
    showSessionExpiryWarning,
    dismissSessionExpiryWarning,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
