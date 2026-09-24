import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROUTES } from '@/utils/routes';

interface FormErrors {
  identifier?: string;
  password?: string;
}

/**
 * Root/admin sign-in (`POST /auth/platform/login`). Accepts a username or an
 * email. Consumers are rejected by the API and see its message.
 */
export function SignInForm(): React.JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const { platformLogin, state, clearError } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const resetFeedback = (): void => {
    if (errors.identifier || errors.password) setErrors({});
    if (state.error) clearError();
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();
    const nextErrors: FormErrors = {};
    if (!identifier.trim())
      nextErrors.identifier = 'Enter your username or email.';
    if (!password) nextErrors.password = 'Enter your password.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const success = await platformLogin(
        identifier.trim(),
        password,
        rememberMe
      );
      if (success) {
        const from =
          (location.state as { from?: string } | null)?.from || ROUTES.HOME;
        void navigate(from, { replace: true });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="grid gap-4"
      noValidate
    >
      {state.error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-md border border-destructive/30 bg-destructive-subtle px-3 py-2.5 text-[13px] text-destructive-subtle-foreground"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{state.error}</span>
        </div>
      )}

      <div className="grid gap-1.5">
        <Label htmlFor="sign-in-identifier">Username or email</Label>
        <Input
          id="sign-in-identifier"
          name="username"
          autoComplete="username"
          autoFocus
          value={identifier}
          onChange={(event) => {
            setIdentifier(event.target.value);
            resetFeedback();
          }}
          aria-invalid={Boolean(errors.identifier)}
          aria-describedby={
            errors.identifier ? 'sign-in-identifier-error' : undefined
          }
          disabled={submitting}
        />
        {errors.identifier && (
          <p
            id="sign-in-identifier-error"
            className="m-0 text-xs text-destructive"
          >
            {errors.identifier}
          </p>
        )}
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="sign-in-password">Password</Label>
        <div className="relative">
          <Input
            id="sign-in-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              resetFeedback();
            }}
            className="pr-10"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={
              errors.password ? 'sign-in-password-error' : undefined
            }
            disabled={submitting}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
        {errors.password && (
          <p
            id="sign-in-password-error"
            className="m-0 text-xs text-destructive"
          >
            {errors.password}
          </p>
        )}
      </div>

      <label
        htmlFor="sign-in-remember"
        className="flex cursor-pointer items-center gap-2.5 text-[13px] text-muted-foreground"
      >
        <Checkbox
          id="sign-in-remember"
          checked={rememberMe}
          onCheckedChange={(checked) => setRememberMe(checked === true)}
          disabled={submitting}
        />
        Remember me for 30 days
      </label>

      <Button type="submit" size="lg" loading={submitting} fullWidth>
        Sign in
      </Button>
    </form>
  );
}

export default SignInForm;
