// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

// User Type Constants
export const USER_TYPES = {
  ROOT: 'root',
  ADMIN: 'admin', 
  CONSUMER: 'consumer',
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'magic_auth_token',
  USER_DATA: 'magic_auth_user',
  CURRENT_PROJECT: 'magic_auth_current_project',
  THEME_PREFERENCE: 'magic_auth_theme',
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Validation Constants
export const VALIDATION = {
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  EMAIL_MAX_LENGTH: 254,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied. Insufficient permissions.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  INTERNAL_ERROR: 'An internal error occurred. Please try again later.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
} as const; 