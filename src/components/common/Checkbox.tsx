import React from 'react';
import { CheckIcon } from '@/components/icons';
import '../../styles/components/checkbox.css';

export interface CheckboxProps {
  checked?: boolean;
  indeterminate?: boolean;
  onChange?: (checked: boolean) => void;
  label?: React.ReactNode;
  disabled?: boolean;
  error?: string;
  id?: string;
  name?: string;
  className?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked = false,
  indeterminate = false,
  onChange,
  label,
  disabled = false,
  error,
  id,
  name,
  className = ''
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange && !disabled) {
      onChange(e.target.checked);
    }
  };

  const checkboxClasses = [
    'checkbox-wrapper',
    disabled && 'checkbox-disabled',
    error && 'checkbox-error',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={checkboxClasses}>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          id={id}
          name={name}
          className="checkbox-input"
          ref={(input) => {
            if (input) {
              input.indeterminate = indeterminate;
            }
          }}
        />
        <span className={`checkbox-box ${indeterminate ? 'checkbox-indeterminate' : ''}`}>
          {(checked || indeterminate) && (
            <CheckIcon size="sm" className="checkbox-icon" />
          )}
        </span>
        {label && <span className="checkbox-label-text">{label}</span>}
      </label>
      {error && <span className="checkbox-error-message">{error}</span>}
    </div>
  );
};

export default Checkbox;

