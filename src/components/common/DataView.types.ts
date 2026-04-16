import type { ReactNode } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface DataViewColumn<T> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  render?: (value: T[keyof T], row: T) => ReactNode;
  width?: string;
  minWidth?: string;
  align?: 'left' | 'center' | 'right';
  hideOnMobile?: boolean;
}

export interface DataViewCardProps<T> {
  item: T;
  actions?: ReactNode;
}

export type GridColumnsConfig = 1 | 2 | 3 | 4;

export interface BulkAction<T> {
  /** Unique key for the action */
  key: string;
  /** Button label */
  label: string;
  /** Button icon */
  icon?: ReactNode;
  /** Button variant */
  variant?: 'default' | 'destructive';
  /** Execute the action on selected items */
  onExecute: (items: T[]) => Promise<void> | void;
  /** Disable based on selected items */
  isDisabled?: (items: T[]) => boolean;
}

export interface DataViewProps<T> {
  // Data
  data: T[];
  columns: DataViewColumn<T>[];
  keyExtractor?: (item: T) => string | number;

  // View Mode
  viewMode?: 'table' | 'grid';
  onViewModeChange?: (mode: 'table' | 'grid') => void;
  showViewToggle?: boolean;
  defaultViewMode?: 'table' | 'grid';

  // Grid View
  renderCard?: (item: T) => ReactNode;
  gridColumns?: {
    mobile?: GridColumnsConfig;
    tablet?: GridColumnsConfig;
    desktop?: GridColumnsConfig;
  };

  // Responsive behavior
  /** When true and renderCard is provided, shows cards on mobile and table on md+ screens */
  responsiveCardView?: boolean;
  /** Breakpoint for switching between card and table view (default: 'md') */
  responsiveBreakpoint?: 'sm' | 'md' | 'lg';

  // Search & Filter
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
  enableLocalSearch?: boolean;
  searchKeys?: Array<keyof T>;

  // Toolbar
  showToolbar?: boolean;
  toolbarActions?: ReactNode;
  toolbarFilters?: ReactNode;

  // Table Behavior
  onSort?: (key: keyof T, direction: 'asc' | 'desc') => void;
  stickyHeader?: boolean;

  // Row Behavior
  /** Callback when entire row is clicked */
  onRowClick?: (item: T) => void;
  /** Dynamic class name per row based on item data */
  rowClassName?: (item: T) => string;

  // Selection
  /** Enable checkbox selection in first column */
  selectable?: boolean;
  /** Controlled selected items */
  selectedItems?: T[];
  /** Callback when selection changes */
  onSelectionChange?: (items: T[]) => void;
  /** Key to use for identifying items (e.g., 'user_hash', 'group_hash') */
  selectionKey?: keyof T;
  /** Function to determine if an item can be selected */
  isItemSelectable?: (item: T) => boolean;
  /** Bulk action buttons shown when items are selected */
  bulkActions?: BulkAction<T>[];

  // Loading & Empty States
  isLoading?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  emptyIcon?: ReactNode;
  emptyAction?: ReactNode;
  skeletonRows?: number;

  // Styling
  className?: string;
  maxHeight?: string;
  caption?: string;
}

export type SortState<T> = {
  key: keyof T | null;
  direction: 'asc' | 'desc';
};

// ============================================================================
// STATIC CONSTANTS (for Tailwind JIT)
// ============================================================================

export const GRID_COLS_MOBILE: Record<GridColumnsConfig, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-2',
  4: 'grid-cols-2',
};

export const GRID_COLS_TABLET: Record<GridColumnsConfig, string> = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2',
  4: 'sm:grid-cols-3',
};

export const GRID_COLS_DESKTOP: Record<GridColumnsConfig, string> = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
};

export const ALIGN_CLASSES = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
} as const;

export const RESPONSIVE_HIDE_CLASSES = {
  sm: { hideBelow: 'hidden sm:block', hideAbove: 'block sm:hidden' },
  md: { hideBelow: 'hidden md:block', hideAbove: 'block md:hidden' },
  lg: { hideBelow: 'hidden lg:block', hideAbove: 'block lg:hidden' },
} as const;
