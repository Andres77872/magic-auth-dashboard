/**
 * Shared formatting utilities for consistent data display across the application
 */

/**
 * Format date string to localized date format
 * @param dateString - ISO date string
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDate(
  dateString: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  return new Date(dateString).toLocaleDateString(
    'en-US',
    options || defaultOptions
  );
}

/**
 * Format date string to relative time (e.g., "2 hours ago")
 * @param dateString - ISO date string
 * @returns Relative time string
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} ${diffInYears === 1 ? 'year' : 'years'} ago`;
}

/**
 * Format date and time with full details
 * @param dateString - ISO date string
 * @returns Formatted date and time string
 */
export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format number with thousands separator
 * @param num - Number to format
 * @returns Formatted number string
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Pluralize a word based on count
 * @param count - The count
 * @param singular - Singular form of the word
 * @param plural - Plural form of the word (optional, defaults to singular + 's')
 * @returns Pluralized word
 */
export function pluralize(
  count: number,
  singular: string,
  plural?: string
): string {
  return count === 1 ? singular : plural || `${singular}s`;
}

/**
 * Truncate text to specified length with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

