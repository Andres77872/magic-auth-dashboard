import React, { useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks';

export interface CopyButtonProps {
  /** Value to copy to clipboard */
  value: string;
  /** Tooltip text (default: "Click to copy") */
  tooltip?: string;
  /** Button size (default: 'sm') */
  size?: 'sm' | 'default';
  /** Button variant (default: 'ghost') */
  variant?: 'ghost' | 'outline';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Standalone copy-to-clipboard button component.
 * Shows Copy icon by default, switches to Check icon for 2000ms after successful copy.
 */
export function CopyButton({
  value,
  tooltip = 'Click to copy',
  size = 'sm',
  variant = 'ghost',
  className,
}: CopyButtonProps): React.JSX.Element {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      showToast('Copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Failed to copy', 'error');
    }
  }, [value, showToast]);

  // Map 'default' to 'md' for Button component compatibility
  const buttonSize = size === 'default' ? 'md' : size;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={buttonSize}
            onClick={handleCopy}
            className={cn('h-8 w-8 p-0', className)}
            aria-label={tooltip}
          >
            {copied ? (
              <Check className="h-4 w-4 text-success" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default CopyButton;