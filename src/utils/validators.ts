/**
 * Shared validation utilities for form inputs
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate required field
 * @param value - Value to validate
 * @param fieldName - Name of the field (for error message)
 * @returns Validation result
 */
export function validateRequired(
  value: string | undefined | null,
  fieldName: string = 'This field'
): ValidationResult {
  if (!value || !value.trim()) {
    return {
      isValid: false,
      error: `${fieldName} is required`,
    };
  }
  return { isValid: true };
}

/**
 * Validate minimum length
 * @param value - Value to validate
 * @param minLength - Minimum length required
 * @param fieldName - Name of the field (for error message)
 * @returns Validation result
 */
export function validateMinLength(
  value: string,
  minLength: number,
  fieldName: string = 'This field'
): ValidationResult {
  if (value.length < minLength) {
    return {
      isValid: false,
      error: `${fieldName} must be at least ${minLength} characters`,
    };
  }
  return { isValid: true };
}

/**
 * Validate maximum length
 * @param value - Value to validate
 * @param maxLength - Maximum length allowed
 * @param fieldName - Name of the field (for error message)
 * @returns Validation result
 */
export function validateMaxLength(
  value: string,
  maxLength: number,
  fieldName: string = 'This field'
): ValidationResult {
  if (value.length > maxLength) {
    return {
      isValid: false,
      error: `${fieldName} must be less than ${maxLength} characters`,
    };
  }
  return { isValid: true };
}

/**
 * Validate email format
 * @param email - Email to validate
 * @returns Validation result
 */
export function validateEmail(email: string): ValidationResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      error: 'Please enter a valid email address',
    };
  }
  return { isValid: true };
}

/**
 * Validate password strength
 * @param password - Password to validate
 * @param minLength - Minimum length (default: 8)
 * @returns Validation result
 */
export function validatePassword(
  password: string,
  minLength: number = 8
): ValidationResult {
  if (password.length < minLength) {
    return {
      isValid: false,
      error: `Password must be at least ${minLength} characters`,
    };
  }
  return { isValid: true };
}

/**
 * Validate password confirmation match
 * @param password - Original password
 * @param confirmPassword - Confirmation password
 * @returns Validation result
 */
export function validatePasswordMatch(
  password: string,
  confirmPassword: string
): ValidationResult {
  if (password !== confirmPassword) {
    return {
      isValid: false,
      error: 'Passwords do not match',
    };
  }
  return { isValid: true };
}

/**
 * Validate field length range
 * @param value - Value to validate
 * @param min - Minimum length
 * @param max - Maximum length
 * @param fieldName - Name of the field (for error message)
 * @returns Validation result
 */
export function validateLengthRange(
  value: string,
  min: number,
  max: number,
  fieldName: string = 'This field'
): ValidationResult {
  if (value.length < min) {
    return {
      isValid: false,
      error: `${fieldName} must be at least ${min} characters`,
    };
  }
  if (value.length > max) {
    return {
      isValid: false,
      error: `${fieldName} must be less than ${max} characters`,
    };
  }
  return { isValid: true };
}

/**
 * Compose multiple validators
 * @param validators - Array of validation functions
 * @returns Combined validation result (first error encountered)
 */
export function composeValidators(
  ...validators: (() => ValidationResult)[]
): ValidationResult {
  for (const validator of validators) {
    const result = validator();
    if (!result.isValid) {
      return result;
    }
  }
  return { isValid: true };
}

