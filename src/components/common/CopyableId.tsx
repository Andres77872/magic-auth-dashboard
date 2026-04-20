import React, { useState, useCallback } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks';
import { cn } from '@/lib/utils';

export interface CopyableIdProps {
  /** Full ID/hash to copy */
  id: string;
  /** Optional accessible label shown in tooltip */
  label?: string;
  /** Whether to truncate display (default: true) */
  truncate?: boolean;
  /** Characters to show at start when truncated (default: 8) */
  startChars?: number;
  /** Characters to show at end when truncated (default: 8) */
  endChars?: number;
  /** Additional CSS classes */
  className?: string;
  /** If true, show full id (no truncation) */
  showFull?: boolean;
}

/**
 * Truncates a hash to show first N and last N characters with ellipsis
 * @param hash - Hash string to truncate
 * @param startChars - Number of characters to show at start (default: 8)
 * @param endChars - Number of characters to show at end (default: 8)
 * @returns Truncated hash string
 */
const truncateHashDisplay = (
  hash: string,
  startChars: number = 8,
  endChars: number = 8
): string => {
  // Total display length would be startChars + "..." + endChars = startChars + endChars + 3
  const totalDisplayLength = startChars + endChars + 3;
  
  // If hash is shorter than display length, don't truncate
  if (hash.length <= totalDisplayLength) {
    return hash;
  }
  
  return `${hash.slice(0, startChars)}...${hash.slice(-endChars)}`;
};

export function CopyableId({
  id,
  label,
  truncate = true,
  startChars = 8,
  endChars = 8,
  className,
  showFull = false,
}: CopyableIdProps): React.JSX.Element {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  // Determine the display text
  const displayText = showFull || !truncate 
    ? id 
    : truncateHashDisplay(id, startChars, endChars);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      showToast('Copied to clipboard', 'success');
      
      // Reset copied state after 2000ms
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Failed to copy', 'error');
    }
  }, [id, showToast]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'group inline-flex items-center gap-1.5 rounded-md bg-muted/50 px-2 py-1 transition-colors hover:bg-muted',
              className
            )}
          >
            <code
              className="text-xs font-mono text-muted-foreground truncate max-w-[200px]"
              aria-label={label || `ID: ${id}`}
            >
              {displayText}
            </code>
            <Button
              variant="ghost"
              size="xs"
              className="h-5 w-5 p-0 opacity-60 hover:opacity-100 transition-opacity"
              onClick={handleCopy}
              aria-label="Copy to clipboard"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-success" aria-hidden="true" />
              ) : (
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-xs font-mono break-all">{id}</p>
          {label && (
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default CopyableId;