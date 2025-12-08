/**
 * Primitives - Backward Compatibility Layer
 * @deprecated Import from '@/components/ui' instead for new code
 */

// Types
export * from './types';

// UI Re-exports (deprecated - use @/components/ui directly)
export { Button, buttonVariants } from '@/components/ui/button';
export type { ButtonProps } from '@/components/ui/button';

export { Input } from '@/components/ui/input';
export type { InputProps } from '@/components/ui/input';

export { Textarea } from '@/components/ui/textarea';
export type { TextareaProps } from '@/components/ui/textarea';

export { Checkbox } from '@/components/ui/checkbox';
export type { CheckboxProps } from '@/components/ui/checkbox';

export { Switch as Toggle } from '@/components/ui/switch';
export type { SwitchProps as ToggleProps } from '@/components/ui/switch';

export { Slider } from '@/components/ui/slider';
export type { SliderProps } from '@/components/ui/slider';

export { Badge, badgeVariants } from '@/components/ui/badge';
export type { BadgeProps } from '@/components/ui/badge';

export { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
export type { CardProps, CardHeaderProps, CardTitleProps, CardContentProps, CardFooterProps } from '@/components/ui/card';

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
export type { TooltipProps } from '@/components/ui/tooltip';

export { Spinner as LoadingSpinner } from '@/components/ui/spinner';
export type { SpinnerProps as LoadingSpinnerProps } from '@/components/ui/spinner';

export { Progress as ProgressBar } from '@/components/ui/progress';
export type { ProgressProps as ProgressBarProps } from '@/components/ui/progress';

export { Skeleton } from '@/components/ui/skeleton';
export type { SkeletonProps } from '@/components/ui/skeleton';

// Custom implementations (kept for advanced features)
export { Select } from './Select/Select';
export type { SelectProps } from './Select/Select';

export { Radio } from './Radio/Radio';
export type { RadioProps } from './Radio/Radio';

export { RadioGroup } from './Radio/RadioGroup';
export type { RadioGroupProps } from './Radio/RadioGroup';

export { Modal } from './Modal/Modal';
export type { ModalProps } from './Modal/Modal';

export { Toast } from './Toast/Toast';
export type { ToastProps } from './Toast/Toast';
