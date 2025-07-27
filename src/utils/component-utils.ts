// Component utility types for consistent prop patterns

export type LayoutVariant = 
  | 'flex-between'
  | 'flex-center' 
  | 'flex-start'
  | 'flex-end'
  | 'flex-col-center'
  | 'grid-gap-4'
  | 'grid-gap-6';

export type SpacingSize = 
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '8' | '10' | '12';

export type TextSize = 
  | '2xs' | 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl';

export type ColorVariant = 
  | 'primary' | 'secondary' | 'tertiary' 
  | 'error' | 'success' | 'warning' | 'info';

// Helper function to build className strings
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

// Layout utility functions
export const getLayoutClass = (variant: LayoutVariant): string => variant;

export const getSpacingClass = (
  type: 'p' | 'm' | 'pt' | 'pr' | 'pb' | 'pl' | 'mt' | 'mr' | 'mb' | 'ml' | 'gap',
  size: SpacingSize
): string => `${type}-${size}`;

export const getTextClass = (size: TextSize): string => `text-${size}`;

export const getColorClass = (variant: ColorVariant): string => `text-${variant}`;

// Common component prop interfaces
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LayoutProps extends BaseComponentProps {
  layout?: LayoutVariant;
  gap?: SpacingSize;
  padding?: SpacingSize;
  margin?: SpacingSize;
}

export interface TypographyProps {
  size?: TextSize;
  color?: ColorVariant;
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
}

// Example usage in components:
// const Card: React.FC<LayoutProps> = ({ layout = 'flex-col-center', gap = '4', children, className }) => {
//   return (
//     <div className={cn('card', getLayoutClass(layout), getSpacingClass('gap', gap), className)}>
//       {children}
//     </div>
//   );
// };
