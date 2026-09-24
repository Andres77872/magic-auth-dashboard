import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

export interface DetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Badges or metadata shown under the title. */
  meta?: React.ReactNode;
  /** Buttons pinned to the bottom of the sheet. */
  footer?: React.ReactNode;
  width?: 'md' | 'lg';
  children: React.ReactNode;
}

/**
 * Right-hand side panel for inspecting and editing one item without leaving
 * the list (Meridian detail drawer). Scrolls its body; header and footer stay put.
 */
export function DetailSheet({
  open,
  onOpenChange,
  title,
  description,
  meta,
  footer,
  width = 'md',
  children,
}: DetailSheetProps): React.JSX.Element {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          'flex w-full flex-col gap-0 p-0',
          width === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-lg'
        )}
      >
        <SheetHeader className="space-y-1.5 border-b border-border px-6 pb-4 pt-5 text-left">
          <SheetTitle className="pr-8 text-[17px] leading-snug">
            {title}
          </SheetTitle>
          {description ? (
            <SheetDescription className="text-[13px]">
              {description}
            </SheetDescription>
          ) : (
            <SheetDescription className="sr-only">Details</SheetDescription>
          )}
          {meta && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {meta}
            </div>
          )}
        </SheetHeader>
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {children}
        </div>
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-6 py-3">
            {footer}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default DetailSheet;
