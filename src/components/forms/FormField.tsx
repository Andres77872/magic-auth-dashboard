import React from 'react';
import type { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  htmlFor: string;
  children: ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
}

export function FormField({
  label,
  htmlFor,
  children,
  error,
  required = false,
  className = '',
}: FormFieldProps): React.JSX.Element {
  return (
    <div className={`form-field ${className}`}>
      <label htmlFor={htmlFor} className="form-label">
        {label}
        {required && <span className="required-asterisk"> *</span>}
      </label>
      {children}
      {error && (
        <div id={`${htmlFor}-error`} className="field-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

export default FormField; 