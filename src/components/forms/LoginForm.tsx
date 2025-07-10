import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/utils/routes';
import { VALIDATION } from '@/utils/constants';
import { LoadingSpinner, Input, Button } from '@/components/common';
import { UserIcon, EyeIcon, LockIcon, ErrorIcon } from '@/components/icons';

interface LoginFormData {
  username: string;
  password: string;
  rememberMe: boolean;
}

interface FormErrors {
  username?: string;
  password?: string;
  general?: string;
}

export function LoginForm(): React.JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, state } = useAuth();

  // Form state
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: '',
    rememberMe: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Clear errors when form data changes
  useEffect(() => {
    if (Object.keys(errors).length > 0 || state.error) {
      setErrors({});
    }
  }, [formData.username, formData.password, state.error]);

  // Handle form input changes
  const handleInputChange = (field: keyof LoginFormData, value: string | boolean): void => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Validate form data
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < VALIDATION.USERNAME_MIN_LENGTH) {
      newErrors.username = `Username must be at least ${VALIDATION.USERNAME_MIN_LENGTH} characters`;
    } else if (formData.username.length > VALIDATION.USERNAME_MAX_LENGTH) {
      newErrors.username = `Username must be less than ${VALIDATION.USERNAME_MAX_LENGTH} characters`;
    } else if (!/^[a-zA-Z0-9_.-]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, dots, hyphens, and underscores';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
      newErrors.password = `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const success = await login(formData.username, formData.password);

      if (success) {
        // Get redirect destination from location state or default
        const from = (location.state as { from?: string })?.from || ROUTES.DASHBOARD;
        void navigate(from, { replace: true });
      } else {
        // Login returned false - this means authentication failed
        // The error will be shown via state.error from the auth context
        // No need to set a general error here as the auth context handles it
      }
    } catch (error) {
      // This catches unexpected errors (network issues, etc.)
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.';
      setErrors({
        general: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="auth-login-loading">
        <LoadingSpinner size="lg" message="Checking authentication..." />
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="auth-login-form" noValidate>
      {/* General error message */}
      {(errors.general || state.error) && (
        <div className="auth-login-error" role="alert" aria-live="polite">
          <div className="auth-login-error-icon">
            <ErrorIcon size="medium" />
          </div>
          <div className="auth-login-error-content">
            <span className="auth-login-error-text">
              {errors.general || state.error}
            </span>
            <p className="auth-login-error-help">
              Please check your credentials and try again.
            </p>
          </div>
        </div>
      )}

      {/* Username field */}
      <div className="auth-login-field">
        <Input
          id="username"
          type="text"
          label="Username"
          value={formData.username}
          onChange={(e) => handleInputChange('username', e.target.value)}
          error={errors.username}
          placeholder="Enter your username"
          leftIcon={<UserIcon size="medium" />}
          autoComplete="username"
          disabled={isSubmitting}
          fullWidth
          required
        />
      </div>

      {/* Password field */}
      <div className="auth-login-field">
        <Input
          id="password"
          type={showPassword ? 'text' : 'password'}
          label="Password"
          value={formData.password}
          onChange={(e) => handleInputChange('password', e.target.value)}
          error={errors.password}
          placeholder="Enter your password"
          leftIcon={<LockIcon size="medium" />}
          rightIcon={
            <button
              type="button"
              className="auth-login-password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              disabled={isSubmitting}
              tabIndex={-1}
            >
              <EyeIcon size="medium" isVisible={showPassword} />
            </button>
          }
          autoComplete="current-password"
          disabled={isSubmitting}
          fullWidth
          required
        />
      </div>

      {/* Remember me checkbox */}
      <div className="auth-login-field auth-login-checkbox-field">
        <label className="auth-login-checkbox-label">
          <input
            type="checkbox"
            checked={formData.rememberMe}
            onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
            className="auth-login-checkbox-input"
            disabled={isSubmitting}
          />
          <span className="auth-login-checkbox-checkmark"></span>
          <span className="auth-login-checkbox-text">Remember me for 30 days</span>
        </label>
      </div>

      {/* Submit button */}
      <div className="auth-login-submit">
        <Button
          type="submit"
          variant="primary"
          size="large"
          fullWidth
          isLoading={isSubmitting}
          disabled={isSubmitting || !formData.username || !formData.password}
        >
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </Button>
      </div>

      {/* Footer links */}
      <div className="auth-login-footer">
        <p className="auth-login-footer-text">
          Admin and ROOT users only. Need access?{' '}
          <a href="mailto:andres@arz.ai" className="auth-login-footer-link">
            Contact Administrator
          </a>
        </p>
      </div>
    </form>
  );
}

export default LoginForm; 