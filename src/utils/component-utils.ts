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

// ============================================================
// DATE FORMATTING UTILITIES
// ============================================================

/**
 * Formats a date string to a localized short format
 * @param dateString - ISO date string
 * @param options - Intl.DateTimeFormatOptions to customize format
 * @returns Formatted date string
 */
export const formatDate = (
  dateString: string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
): string => {
  return new Date(dateString).toLocaleDateString('en-US', options);
};

/**
 * Formats a date string to include date and time
 * @param dateString - ISO date string
 * @returns Formatted date and time string
 */
export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Formats a date string to relative time (e.g., "2 days ago")
 * @param dateString - ISO date string
 * @returns Relative time string
 */
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};

// ============================================================
// BADGE VARIANT UTILITIES
// ============================================================

export type BadgeVariant = 
  | 'primary' 
  | 'secondary' 
  | 'success' 
  | 'error' 
  | 'warning' 
  | 'info';

export type UserType = 'root' | 'admin' | 'consumer';
export type StatusType = 'active' | 'inactive';

/**
 * Gets the appropriate badge variant for a user type
 * @param userType - The user type
 * @returns Badge variant
 */
export const getUserTypeBadgeVariant = (userType: UserType): BadgeVariant => {
  switch (userType) {
    case 'root':
      return 'error';
    case 'admin':
      return 'warning';
    case 'consumer':
      return 'info';
    default:
      return 'secondary';
  }
};

/**
 * Gets the appropriate badge variant for a status
 * @param isActive - Whether the entity is active
 * @returns Badge variant
 */
export const getStatusBadgeVariant = (isActive: boolean): BadgeVariant => {
  return isActive ? 'success' : 'secondary';
};

// ============================================================
// STRING UTILITIES
// ============================================================

/**
 * Truncates a string to a specified length with ellipsis
 * @param str - String to truncate
 * @param maxLength - Maximum length
 * @returns Truncated string
 */
export const truncateString = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return `${str.substring(0, maxLength)}...`;
};

/**
 * Truncates a hash to show first N characters with ellipsis
 * @param hash - Hash string
 * @param length - Number of characters to show (default: 12)
 * @returns Truncated hash
 */
export const truncateHash = (hash: string, length: number = 12): string => {
  return `${hash.substring(0, length)}...`;
};

/**
 * Generates initials from a name or username
 * @param name - Full name or username
 * @returns Initials (max 2 characters)
 */
export const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// ============================================================
// PLURALIZATION UTILITIES
// ============================================================

/**
 * Returns singular or plural form based on count
 * @param count - Number to check
 * @param singular - Singular form
 * @param plural - Plural form (optional, defaults to singular + 's')
 * @returns Appropriate form
 */
export const pluralize = (
  count: number,
  singular: string,
  plural?: string
): string => {
  return count === 1 ? singular : (plural || `${singular}s`);
};

/**
 * Formats a count with its label
 * @param count - Number to format
 * @param singular - Singular form of label
 * @param plural - Plural form (optional)
 * @returns Formatted string (e.g., "5 items")
 */
export const formatCount = (
  count: number,
  singular: string,
  plural?: string
): string => {
  return `${count} ${pluralize(count, singular, plural)}`;
};
