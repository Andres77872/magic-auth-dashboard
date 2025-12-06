// Size types
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type FormSize = 'sm' | 'md' | 'lg';

// Variant types
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
export type ToastVariant = 'success' | 'error' | 'warning' | 'info';
export type ProgressVariant = 'primary' | 'success' | 'warning' | 'error';

// Validation
export type ValidationState = 'success' | 'error' | 'warning' | null;

// Base props
export interface BaseProps {
  className?: string;
  id?: string;
}

// Form control base props
export interface FormControlProps extends BaseProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  validationState?: ValidationState;
}

// Select option type
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

// Toast action type
export interface ToastAction {
  label: string;
  onClick: () => void;
}

// Orientation type
export type Orientation = 'horizontal' | 'vertical';

// Position types
export type TooltipPosition = 'top' | 'right' | 'bottom' | 'left';
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

// Card padding type
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

// Skeleton variant type
export type SkeletonVariant = 'text' | 'title' | 'avatar' | 'avatar-lg' | 'button' | 'card' | 'rectangular' | 'line';

// Spinner variant type
export type SpinnerVariant = 'default' | 'primary' | 'dots' | 'pulse';

// Utility type for component with displayName
export type ComponentWithDisplayName<T> = T & { displayName: string };
