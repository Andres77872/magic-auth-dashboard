import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/utils/routes';
import { VALIDATION } from '@/utils/constants';
import { LoadingSpinner } from '@/components/common';
import { UserIcon, EyeIcon, LogoutIcon, ErrorIcon } from '@/components/icons';

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
    if (Object.keys(errors).length > 0) {
      setErrors({});
    }
  }, [formData.username, formData.password, errors]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
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
      }
          } catch {
        setErrors({
          general: 'An unexpected error occurred. Please try again.',
        });
      } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="login-loading">
        <LoadingSpinner size="large" message="Checking authentication..." />
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="login-form" noValidate>
      <div className="form-header">
        <h1 className="form-title">Admin Login</h1>
        <p className="form-subtitle">
          Sign in to access the Magic Auth Dashboard
        </p>
      </div>

      {/* General error message */}
      {(errors.general || state.error) && (
        <div className="error-alert" role="alert">
          <div className="error-icon">
            <ErrorIcon size="medium" />
          </div>
          <span>{errors.general || state.error}</span>
        </div>
      )}

      {/* Username field */}
      <div className="form-field">
        <label htmlFor="username" className="form-label">
          Username
        </label>
        <div className="input-wrapper">
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            className={`form-input ${errors.username ? 'input-error' : ''}`}
            placeholder="Enter your username"
            autoComplete="username"
            disabled={isSubmitting}
            aria-describedby={errors.username ? 'username-error' : undefined}
            required
          />
          <div className="input-icon">
            <UserIcon size="medium" />
          </div>
        </div>
        {errors.username && (
          <div id="username-error" className="field-error" role="alert">
            {errors.username}
          </div>
        )}
      </div>

      {/* Password field */}
      <div className="form-field">
        <label htmlFor="password" className="form-label">
          Password
        </label>
        <div className="input-wrapper">
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className={`form-input ${errors.password ? 'input-error' : ''}`}
            placeholder="Enter your password"
            autoComplete="current-password"
            disabled={isSubmitting}
            aria-describedby={errors.password ? 'password-error' : undefined}
            required
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            disabled={isSubmitting}
          >
            <EyeIcon size="medium" isVisible={showPassword} />
          </button>
        </div>
        {errors.password && (
          <div id="password-error" className="field-error" role="alert">
            {errors.password}
          </div>
        )}
      </div>

      {/* Remember me checkbox */}
      <div className="form-field checkbox-field">
        <label htmlFor="rememberMe" className="checkbox-label">
          <input
            type="checkbox"
            id="rememberMe"
            name="rememberMe"
            checked={formData.rememberMe}
            onChange={handleInputChange}
            className="checkbox-input"
            disabled={isSubmitting}
          />
          <span className="checkbox-checkmark"></span>
          <span className="checkbox-text">Remember me for 30 days</span>
        </label>
      </div>

      {/* Submit button */}
      <button
        type="submit"
        className="submit-button"
        disabled={isSubmitting || !formData.username || !formData.password}
      >
        {isSubmitting ? (
          <>
            <LoadingSpinner size="small" />
            <span>Signing in...</span>
          </>
        ) : (
          <>
            <span>Sign In</span>
            <LogoutIcon size="medium" />
          </>
        )}
      </button>

      {/* Footer links */}
      <div className="form-footer">
        <p className="footer-text">
          Admin and ROOT users only. Need access?{' '}
          <a href="mailto:admin@magicauth.com" className="footer-link">
            Contact Administrator
          </a>
        </p>
      </div>
    </form>
  );
}

export default LoginForm; 