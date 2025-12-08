import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/utils/routes';
import { VALIDATION } from '@/utils/constants';
import { Modal, LoadingSpinner, Input, Button } from '@/components/common';
import { Checkbox } from '@/components/ui/checkbox';
import { User, Eye, EyeOff, Lock, XCircle, ShieldCheck } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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

export function LoginModal({ isOpen, onClose }: LoginModalProps): React.JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, state } = useAuth();

  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: '',
    rememberMe: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (Object.keys(errors).length > 0 || state.error) {
      setErrors({});
    }
  }, [formData.username, formData.password]);

  useEffect(() => {
    if (!isOpen) {
      setFormData({ username: '', password: '', rememberMe: false });
      setErrors({});
      setShowPassword(false);
    }
  }, [isOpen]);

  const handleInputChange = (field: keyof LoginFormData, value: string | boolean): void => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < VALIDATION.USERNAME_MIN_LENGTH) {
      newErrors.username = `Username must be at least ${VALIDATION.USERNAME_MIN_LENGTH} characters`;
    } else if (formData.username.length > VALIDATION.USERNAME_MAX_LENGTH) {
      newErrors.username = `Username must be less than ${VALIDATION.USERNAME_MAX_LENGTH} characters`;
    } else if (!/^[a-zA-Z0-9_.-]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, dots, hyphens, and underscores';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
      newErrors.password = `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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
        onClose();
        const from = (location.state as { from?: string })?.from || ROUTES.DASHBOARD;
        void navigate(from, { replace: true });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.';
      setErrors({
        general: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="md" closeOnBackdrop={false}>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" message="Checking authentication..." />
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" closeOnBackdrop={!isSubmitting}>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Welcome Back</h2>
          <p className="text-sm text-muted-foreground">Sign in to access the Magic Auth Dashboard</p>
          <div
            className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success/10 px-3 py-1 text-xs text-success"
            aria-label="Secure connection"
          >
            <ShieldCheck size={12} />
            <span>Secure Connection</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4" noValidate>
          {/* General error message */}
          {(errors.general || state.error) && (
            <div
              className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4"
              role="alert"
              aria-live="polite"
            >
              <div className="flex h-5 w-5 shrink-0 items-center justify-center text-destructive">
                <XCircle size={20} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-destructive">{errors.general || state.error}</p>
                <p className="text-xs text-muted-foreground">Please check your credentials and try again.</p>
              </div>
            </div>
          )}

          {/* Username field */}
          <div>
            <Input
              id="username"
              type="text"
              label="Username"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              error={errors.username}
              placeholder="Enter your username"
              leftIcon={<User size={18} />}
              autoComplete="username"
              autoFocus
              disabled={isSubmitting}
              fullWidth
              required
            />
          </div>

          {/* Password field */}
          <div>
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              label="Password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              error={errors.password}
              placeholder="Enter your password"
              leftIcon={<Lock size={18} />}
              rightIcon={
                <button
                  type="button"
                  className="flex h-full items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  disabled={isSubmitting}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
              autoComplete="current-password"
              disabled={isSubmitting}
              fullWidth
              required
            />
          </div>

          {/* Remember me checkbox */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="rememberMe"
              checked={formData.rememberMe}
              onCheckedChange={(checked) => handleInputChange('rememberMe', checked === true)}
              disabled={isSubmitting}
            />
            <label
              htmlFor="rememberMe"
              className="cursor-pointer text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Remember me for 30 days
            </label>
          </div>

          {/* Submit button */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isSubmitting}
              disabled={isSubmitting || !formData.username || !formData.password}
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </Button>
          </div>

          {/* Footer */}
          <div className="pt-2 text-center">
            <p className="text-xs text-muted-foreground">
              Admin and ROOT users only. Need access?{' '}
              <a
                href="mailto:andres@arz.ai"
                className="font-medium text-primary underline-offset-4 transition-colors hover:underline"
              >
                Contact Administrator
              </a>
            </p>
          </div>
        </form>
      </div>
    </Modal>
  );
}

export default LoginModal;

