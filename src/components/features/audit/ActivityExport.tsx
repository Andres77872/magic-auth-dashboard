import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { auditService } from '@/services/audit.service';
import { Download, FileJson, FileSpreadsheet, Loader2 } from 'lucide-react';
import type { ActivityFilters, ExportFormat } from '@/types/audit.types';

export interface ActivityExportProps {
  filters: ActivityFilters;
  totalCount: number;
  onExportStart?: () => void;
  onExportComplete?: (filename: string) => void;
  onExportError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
}

/**
 * ActivityExport - Export functionality component for activity logs
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */
export function ActivityExport({
  filters,
  totalCount,
  onExportStart,
  onExportComplete,
  onExportError,
  className,
  disabled = false,
}: ActivityExportProps): React.JSX.Element {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat | null>(null);

  // Generate filename with timestamp
  const generateFilename = useCallback((format: ExportFormat): string => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    return `audit-logs-${timestamp}.${format}`;
  }, []);

  // Handle export
  const handleExport = useCallback(
    async (format: ExportFormat) => {
      if (isExporting || disabled) return;

      setIsExporting(true);
      setExportFormat(format);
      onExportStart?.();

      try {
        const blob = await auditService.exportActivityLogs({
          format,
          filters,
        });

        // Create download link
        const url = URL.createObjectURL(blob);
        const filename = generateFilename(format);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        onExportComplete?.(filename);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Export failed';
        onExportError?.(errorMessage);
      } finally {
        setIsExporting(false);
        setExportFormat(null);
      }
    },
    [filters, isExporting, disabled, generateFilename, onExportStart, onExportComplete, onExportError]
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || isExporting || totalCount === 0}
          className={cn('gap-1', className)}
          aria-label="Export activity logs"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Download className="h-4 w-4" aria-hidden="true" />
          )}
          <span className="sr-only sm:not-sr-only sm:inline">Export</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => handleExport('csv')}
          disabled={isExporting}
          className="gap-2"
        >
          <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
          <span>Export as CSV</span>
          {exportFormat === 'csv' && isExporting && (
            <Loader2 className="h-3 w-3 animate-spin ml-auto" aria-hidden="true" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport('json')}
          disabled={isExporting}
          className="gap-2"
        >
          <FileJson className="h-4 w-4" aria-hidden="true" />
          <span>Export as JSON</span>
          {exportFormat === 'json' && isExporting && (
            <Loader2 className="h-3 w-3 animate-spin ml-auto" aria-hidden="true" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ActivityExport;
