/**
 * Export menu for the audit views: downloads what the current filters match
 * as CSV or JSON through `POST /admin/audit/export`.
 *
 * The backend refuses exports that match more than 10,000 records, so the
 * menu is disabled above that and asks for narrower filters instead.
 */

import React, { useState } from 'react';
import { Download, FileJson, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { auditService } from '@/services/audit.service';
import { useToast } from '@/hooks/useToast';
import { formatNumber } from '@/utils/formatters';
import {
  AUDIT_EXPORT_MAX_ROWS,
  type AuditExportFilters,
  type AuditExportSource,
  type ExportFormat,
} from '@/types/audit.types';

export interface ActivityExportProps {
  source: AuditExportSource;
  filters: AuditExportFilters;
  /** Records matching the filters (the list total). */
  matchCount: number;
  /** Filters the list applies but the export endpoint doesn't (e.g. free-text search). */
  unsupportedFilterNote?: string;
  disabled?: boolean;
}

const SOURCE_LABEL: Record<AuditExportSource, string> = {
  activity: 'activity-log',
  api_audit: 'api-requests',
};

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function ActivityExport({
  source,
  filters,
  matchCount,
  unsupportedFilterNote,
  disabled = false,
}: ActivityExportProps): React.JSX.Element {
  const { showToast } = useToast();
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const tooMany = matchCount > AUDIT_EXPORT_MAX_ROWS;

  const runExport = async (format: ExportFormat): Promise<void> => {
    setExporting(format);
    try {
      const blob = await auditService.exportAuditLogs({
        source,
        format,
        // Ask for every matching row; the default page is only 1,000.
        limit: Math.min(Math.max(matchCount, 1), AUDIT_EXPORT_MAX_ROWS),
        filters,
      });
      const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `${SOURCE_LABEL[source]}-${stamp}.${format}`;
      downloadBlob(blob, filename);
      showToast(`Downloaded ${filename}`, 'success');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'The export failed.',
        'error'
      );
    } finally {
      setExporting(null);
    }
  };

  const button = (
    <Button
      variant="secondary"
      size="md"
      disabled={disabled || exporting !== null || matchCount === 0 || tooMany}
      loading={exporting !== null}
      title={
        tooMany
          ? `More than ${formatNumber(AUDIT_EXPORT_MAX_ROWS)} entries match. Narrow the date range or filters to export.`
          : matchCount === 0
            ? 'Nothing matches the current filters.'
            : undefined
      }
    >
      {exporting === null && <Download aria-hidden="true" />}
      Export
    </Button>
  );

  if (disabled || matchCount === 0 || tooMany) return button;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{button}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          {formatNumber(matchCount)} {matchCount === 1 ? 'entry' : 'entries'}{' '}
          match the current filters
          {unsupportedFilterNote ? `. ${unsupportedFilterNote}` : ''}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => void runExport('csv')}
          className="gap-2"
        >
          <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
          Download CSV
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => void runExport('json')}
          className="gap-2"
        >
          <FileJson className="h-4 w-4" aria-hidden="true" />
          Download JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ActivityExport;
