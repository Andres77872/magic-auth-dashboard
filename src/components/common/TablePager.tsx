import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/utils/formatters';

export interface TablePagerProps {
  /** Zero-based offset of the first row on this page. */
  offset: number;
  limit: number;
  /** Rows actually returned for this page. */
  pageCount: number;
  /**
   * Total rows when the backend reports a trustworthy total. Leave undefined
   * when it doesn't (several api.auth totals ignore `search`); the pager then
   * shows "Showing 26–50" with previous/next only.
   */
  total?: number;
  /** Whether another page exists. Defaults to deriving it from `total`, else `pageCount === limit`. */
  hasMore?: boolean;
  onOffsetChange: (offset: number) => void;
  pageSizeOptions?: number[];
  onLimitChange?: (limit: number) => void;
  itemLabel?: string;
  className?: string;
}

/** Footer for server-paginated tables: range summary, page size and prev/next. */
export function TablePager({
  offset,
  limit,
  pageCount,
  total,
  hasMore,
  onOffsetChange,
  pageSizeOptions = [10, 25, 50, 100],
  onLimitChange,
  itemLabel = 'rows',
  className,
}: TablePagerProps): React.JSX.Element | null {
  const start = pageCount === 0 ? 0 : offset + 1;
  const end = offset + pageCount;
  const canGoBack = offset > 0;
  const canGoForward =
    hasMore ?? (total !== undefined ? end < total : pageCount === limit);

  if (!canGoBack && !canGoForward && pageCount === 0) return null;

  const page = Math.floor(offset / limit) + 1;
  const totalPages =
    total !== undefined ? Math.max(1, Math.ceil(total / limit)) : undefined;

  return (
    <div
      className={cn(
        'flex flex-col gap-3 pt-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <p className="m-0" aria-live="polite">
        {pageCount === 0
          ? `No ${itemLabel}`
          : total !== undefined
            ? `Showing ${formatNumber(start)}–${formatNumber(end)} of ${formatNumber(total)} ${itemLabel}`
            : `Showing ${formatNumber(start)}–${formatNumber(end)} ${itemLabel}`}
      </p>
      <div className="flex items-center gap-3">
        {onLimitChange && (
          <label className="flex items-center gap-1.5">
            <span>Rows per page</span>
            <select
              value={limit}
              onChange={(event) => onLimitChange(Number(event.target.value))}
              className="h-7 rounded-md border border-input bg-card px-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        )}
        <nav className="flex items-center gap-1" aria-label="Pagination">
          <button
            type="button"
            onClick={() => onOffsetChange(Math.max(0, offset - limit))}
            disabled={!canGoBack}
            className="flex h-7 w-7 items-center justify-center rounded-md text-foreground transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <span className="min-w-[4.5rem] text-center tabular-nums">
            Page {page}
            {totalPages !== undefined && ` of ${totalPages}`}
          </span>
          <button
            type="button"
            onClick={() => onOffsetChange(offset + limit)}
            disabled={!canGoForward}
            className="flex h-7 w-7 items-center justify-center rounded-md text-foreground transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </nav>
      </div>
    </div>
  );
}

export default TablePager;
