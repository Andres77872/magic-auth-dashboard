import {
  createContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
  useState,
} from 'react';
import type { ReactNode, JSX } from 'react';
import type {
  AuthState,
  AuthAction,
  UserIdentity,
  UserType,
} from '@/types/auth.types';
import { AuthActionType } from '@/types/auth.types';
import { authService } from '@/services/auth.service';
import {
  sessionRefreshCoordinator,
  type SessionRefreshResult,
} from '@/services/session-refresh-coordinator';
import { handleApiError } from '@/utils/error-handler';
import { canAccessRoute as checkRoute } from '@/utils/permissions';

const REFRESH_THRESHOLD_MS = 5 * 60 * 1000;
const REFRESH_RETRY_DELAY_MS = 30 * 1000;
const MAX_REFRESH_RETRIES = 3;

const initialAuthState: AuthState = {
  isAuthenticated: false,
  user: null,
  isLoading: true,
  error: null,
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
        user: action.payload.user ?? null,
        isLoading: false,
        error: null,
        sessionExpiresAt: action.payload.expires_at || null,
        refreshExpiresAt: action.payload.refresh_expires_at || null,
        rememberMe: action.payload.remember_me === true,
      };

    case AuthActionType.LOGIN_FAILURE:
      return {
        ...state,
        isAuthenticated: false,
        user: null,
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
        sessionExpiresAt: null,
        refreshExpiresAt: null,
        rememberMe: false,
      };

    case AuthActionType.SESSION_VALIDATED:
      if (action.payload.valid) {
        return {
          ...state,
          isAuthenticated: true,
          user: action.payload.user || null,
          isLoading: false,
          error: null,
          sessionExpiresAt: action.payload.expires_at || state.sessionExpiresAt,
          refreshExpiresAt:
            action.payload.refresh_expires_at || state.refreshExpiresAt,
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

    case AuthActionType.SESSION_EXPIRY_UPDATE:
      return {
        ...state,
        sessionExpiresAt: action.payload.expires_at,
        refreshExpiresAt:
          action.payload.refresh_expires_at || state.refreshExpiresAt,
        rememberMe: action.payload.remember_me ?? state.rememberMe,
      };

    default:
      return state;
  }
}

interface AuthContextType {
  state: AuthState;
  platformLogin: (
    username: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<boolean>;
  logout: () => Promise<void>;
  validateSession: () => Promise<void>;
  clearError: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  user: UserIdentity | null;
  userType: UserType | null;
  canAccessRoute: (routePath: string) => boolean;
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
  const sessionValidationRef = useRef(false);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshRetryCountRef = useRef(0);
  const lastHydratedRefreshGenerationRef = useRef<string | null>(null);
  const lastRefreshTerminalRef = useRef(false);
  const [refreshRetryCount, setRefreshRetryCount] = useState(0);
  const [showSessionExpiryWarning, setShowSessionExpiryWarning] =
    useState(false);

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
    sessionValidationRef.current = false;
    updateRefreshRetryCount(0);
  }, [updateRefreshRetryCount]);

  const hydrateRefreshedSession = useCallback(
    (result: SessionRefreshResult): void => {
      if (lastHydratedRefreshGenerationRef.current === result.generation) {
        return;
      }

      lastHydratedRefreshGenerationRef.current = result.generation;
      lastRefreshTerminalRef.current = result.terminal;

      if (result.terminal) {
        stopRefreshTimer();
        clearClientAuthState();
        setShowSessionExpiryWarning(false);
        dispatch({ type: AuthActionType.LOGOUT });
        return;
      }

      if (!result.success) {
        return;
      }

      if (result.metadata.expiresAt) {
        dispatch({
          type: AuthActionType.SESSION_EXPIRY_UPDATE,
          payload: {
            expires_at: result.metadata.expiresAt,
            refresh_expires_at: result.metadata.refreshExpiresAt,
            remember_me: result.metadata.rememberMe,
          },
        });
      }

      setShowSessionExpiryWarning(false);
      updateRefreshRetryCount(0);
    },
    [clearClientAuthState, stopRefreshTimer, updateRefreshRetryCount]
  );

  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const result = await authService.refreshToken();
      hydrateRefreshedSession(result);
      return result.success;
    } catch (error) {
      console.warn('Session refresh failed:', error);
      return false;
    }
  }, [hydrateRefreshedSession]);

  useEffect(() => {
    return sessionRefreshCoordinator.subscribe(hydrateRefreshedSession);
  }, [hydrateRefreshedSession]);

  // Attempt a refresh and, on failure, keep retrying on a fixed delay until
  // MAX_REFRESH_RETRIES is exhausted, then surface the session-expiry warning.
  // Retries reuse refreshTimerRef so stopRefreshTimer() cancels a pending retry.
  const attemptRefreshWithRetries = useCallback(
    function refreshWithRetries(): void {
      void (async (): Promise<void> => {
        const success = await refreshSession();

        if (success) {
          updateRefreshRetryCount(0);
          return;
        }

        if (lastRefreshTerminalRef.current) {
          return;
        }

        const nextCount = refreshRetryCountRef.current + 1;
        updateRefreshRetryCount(nextCount);

        if (nextCount > MAX_REFRESH_RETRIES) {
          setShowSessionExpiryWarning(true);
          return;
        }

        refreshTimerRef.current = setTimeout(() => {
          refreshWithRetries();
        }, REFRESH_RETRY_DELAY_MS);
      })();
    },
    [refreshSession, updateRefreshRetryCount]
  );

  const startRefreshTimer = useCallback(
    (expiresAt: string) => {
      stopRefreshTimer();

      const diffMs = new Date(expiresAt).getTime() - Date.now();
      const refreshDelay = diffMs - REFRESH_THRESHOLD_MS;

      if (refreshDelay <= 0) {
        attemptRefreshWithRetries();
        return;
      }

      refreshTimerRef.current = setTimeout(() => {
        attemptRefreshWithRetries();
      }, refreshDelay);
    },
    [stopRefreshTimer, attemptRefreshWithRetries]
  );

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
    return (): void =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
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
  }, [
    state.isAuthenticated,
    state.sessionExpiresAt,
    startRefreshTimer,
    stopRefreshTimer,
  ]);
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

      if (response.success && response.user) {
        dispatch({
          type: AuthActionType.LOGIN_SUCCESS,
          payload: response,
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

  const validateSession = useCallback(async (): Promise<void> => {
    if (sessionValidationRef.current) {
      return;
    }

    sessionValidationRef.current = true;

    try {
      const response = await authService.validateSession();

      if (response.success && response.valid && response.user) {
        dispatch({
          type: AuthActionType.SESSION_VALIDATED,
          payload: {
            valid: true,
            user: response.user,
            expires_at: response.session?.expires_at,
            refresh_expires_at: response.session?.refresh_expires_at,
            remember_me: response.session?.remember_me,
          },
        });
        return;
      }

      throw new Error(response.message || 'Invalid session');
    } catch (error) {
      console.warn('Session validation failed:', error);
      clearClientAuthState();
      dispatch({
        type: AuthActionType.SESSION_VALIDATED,
        payload: { valid: false },
      });
    } finally {
      sessionValidationRef.current = false;
    }
  }, [clearClientAuthState]);

  const clearError = (): void => {
    dispatch({ type: AuthActionType.CLEAR_ERROR });
  };

  const canAccessRoute = (routePath: string): boolean => {
    if (!state.user?.user_type) return false;
    return checkRoute(state.user.user_type, routePath);
  };

  useEffect(() => {
    for (const key of [
      'magic_auth_token',
      'magic_auth_user',
      'magic_auth_current_project',
    ]) {
      localStorage.removeItem(key);
    }
    const timerId = window.setTimeout(() => {
      void validateSession();
    }, 0);

    return (): void => window.clearTimeout(timerId);
  }, [validateSession]);

  useEffect(() => {
    const handleUnauthorized = (): void => {
      stopRefreshTimer();
      clearClientAuthState();
      dispatch({ type: AuthActionType.LOGOUT });
    };

    window.addEventListener('magic-auth-unauthorized', handleUnauthorized);
    return (): void =>
      window.removeEventListener('magic-auth-unauthorized', handleUnauthorized);
  }, [clearClientAuthState, stopRefreshTimer]);

  const contextValue: AuthContextType = {
    state,
    platformLogin,
    logout,
    validateSession,
    clearError,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    userType: state.user?.user_type || null,
    canAccessRoute,
    sessionExpiresAt: state.sessionExpiresAt,
    refreshExpiresAt: state.refreshExpiresAt,
    rememberMe: state.rememberMe,
    refreshSession,
    refreshRetryCount,
    showSessionExpiryWarning,
    dismissSessionExpiryWarning,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export { AuthContext };
