import React from 'react';
import { ChevronIcon } from '@/components/icons';
import { Button } from '../primitives';
import { cn } from '@/utils/component-utils';

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
  
  const startItem = ((currentPage - 1) * itemsPerPage) + 1;
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
    return <nav className={cn('pagination', `pagination--${size}`, className)} aria-label="Pagination" />;
  }

  const visiblePages = getVisiblePages();
  const iconSize = size === 'sm' ? 12 : size === 'lg' ? 18 : 14;

  return (
    <nav className={cn('pagination', `pagination--${size}`, className)} aria-label="Pagination">
      <div className="pagination__info">
        <span className="pagination__text" aria-live="polite">
          Showing {startItem} to {endItem} of {totalItems} {totalItems === 1 ? itemLabelSingular : itemLabelPlural}
        </span>
      </div>

      <div className="pagination__controls">
        <Button
          variant="outline"
          size={size}
          onClick={handlePrevious}
          disabled={currentPage === 1}
          aria-label="Previous page"
          className="pagination__btn pagination__btn--prev"
        >
          <ChevronIcon size={iconSize} direction="left" />
          Previous
        </Button>

        <div className="pagination__pages" role="group" aria-label="Page numbers">
          {visiblePages.map((page, index) => (
            <button
              key={index}
              type="button"
              className={cn(
                'pagination__page',
                page === currentPage && 'pagination__page--active',
                typeof page === 'string' && 'pagination__page--ellipsis'
              )}
              onClick={() => handlePageClick(page)}
              disabled={typeof page === 'string'}
              aria-label={typeof page === 'number' ? `Go to page ${page}` : undefined}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          ))}
        </div>

        <Button
          variant="outline"
          size={size}
          onClick={handleNext}
          disabled={currentPage === totalPages}
          aria-label="Next page"
          className="pagination__btn pagination__btn--next"
        >
          Next
          <ChevronIcon size={iconSize} direction="right" />
        </Button>
      </div>
    </nav>
  );
}

export default Pagination; 