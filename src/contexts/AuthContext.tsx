import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode, JSX } from 'react';
import type { AuthState, AuthAction, User, UserType } from '@/types/auth.types';
import { AuthActionType } from '@/types/auth.types';
import { authService } from '@/services/auth.service';
import { STORAGE_KEYS } from '@/utils/constants';
import { handleApiError } from '@/utils/error-handler';
import { hasPermission as checkPermission, canAccessRoute as checkRoute } from '@/utils/permissions';

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