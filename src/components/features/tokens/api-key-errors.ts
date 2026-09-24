import { ApiError } from '@/utils/error-handler';

/** api.auth `ErrorCode.MFA_REQUIRED` — raised by `require_recent_reauthentication`. */
const RECENT_AUTH_REQUIRED = 'AUTH_1008';
/** api.auth `ErrorCode.API_KEY_REVOKED`. */
const API_KEY_REVOKED = 'AUTH_1012';

export const RECENT_SIGN_IN_MESSAGE =
  'Changing API keys needs a recent sign-in. Sign out, sign in again and retry within 5 minutes.';

/**
 * Key mutations need a sign-in from the last few minutes (`401 AUTH_1008`).
 * The shared client surfaces some 401s as plain errors carrying the backend
 * message, so the message is checked as well as the code.
 */
export function isRecentAuthRequired(error: unknown): boolean {
  if (error instanceof ApiError && error.code === RECENT_AUTH_REQUIRED)
    return true;
  return (
    error instanceof Error &&
    /recent re-?authentication required/i.test(error.message)
  );
}

/** Operator-facing message for a failed key mutation. */
export function describeApiKeyError(error: unknown, fallback: string): string {
  if (isRecentAuthRequired(error)) return RECENT_SIGN_IN_MESSAGE;
  if (error instanceof ApiError && error.code === API_KEY_REVOKED) {
    return 'This key is revoked, so it can no longer be changed.';
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
