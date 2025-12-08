import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  className?: string;
  itemLabelSingular?: string;
  itemLabelPlural?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-10 w-10 text-base',
};

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  className = '',
  itemLabelSingular = 'item',
  itemLabelPlural = 'items',
  size = 'md',
}: PaginationProps): React.JSX.Element {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getVisiblePages = () => {
    const delta = 2;
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const handlePageClick = (page: number | string) => {
    if (typeof page === 'number' && page !== currentPage) {
      onPageChange(page);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  if (totalPages <= 1) {
    return (
      <nav
        className={cn('flex items-center justify-between gap-4', className)}
        aria-label="Pagination"
      />
    );
  }

  const visiblePages = getVisiblePages();
  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 18 : 16;

  return (
    <nav
      className={cn('flex flex-col sm:flex-row items-center justify-between gap-4', className)}
      aria-label="Pagination"
    >
      <div className="text-sm text-muted-foreground">
        <span aria-live="polite">
          Showing {startItem} to {endItem} of {totalItems}{' '}
          {totalItems === 1 ? itemLabelSingular : itemLabelPlural}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size={size}
          onClick={handlePrevious}
          disabled={currentPage === 1}
          aria-label="Previous page"
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" style={{ width: iconSize, height: iconSize }} />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        <div className="flex items-center gap-1" role="group" aria-label="Page numbers">
          {visiblePages.map((page, index) =>
            typeof page === 'string' ? (
              <span
                key={`ellipsis-${index}`}
                className={cn(
                  'flex items-center justify-center text-muted-foreground',
                  sizeClasses[size]
                )}
                aria-hidden
              >
                <MoreHorizontal className="h-4 w-4" />
              </span>
            ) : (
              <button
                key={page}
                type="button"
                className={cn(
                  'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  sizeClasses[size],
                  page === currentPage
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                )}
                onClick={() => handlePageClick(page)}
                aria-label={`Go to page ${page}`}
                aria-current={page === currentPage ? 'page' : undefined}
              >
                {page}
              </button>
            )
          )}
        </div>

        <Button
          variant="outline"
          size={size}
          onClick={handleNext}
          disabled={currentPage === totalPages}
          aria-label="Next page"
          className="gap-1"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" style={{ width: iconSize, height: iconSize }} />
        </Button>
      </div>
    </nav>
  );
}

export default Pagination; 