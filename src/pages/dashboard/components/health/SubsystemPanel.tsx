/**
 * SubsystemPanel — a curated group within the System Health Monitor.
 *
 * Renders a header (icon + title + rolled-up status + relative last-check), a
 * slot for "hero" metric tiles (children), and a collapsed "Show all details"
 * region that dumps the full raw subsystem object via GenericFieldList so
 * nothing is lost.
 */

import React from 'react';
import { ChevronRight } from 'lucide-react';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import { formatRelativeTime } from '@/utils/formatters';
import { HealthStatusBadge } from './HealthStatusBadge';
import { GenericFieldList } from './GenericFieldList';

function formatLastCheck(lastCheck?: string): string | null {
  if (!lastCheck || Number.isNaN(Date.parse(lastCheck))) return null;
  return formatRelativeTime(lastCheck);
}

interface SubsystemPanelProps {
  title: string;
  icon?: React.ReactNode;
  status?: string;
  lastCheck?: string;
  /** Full raw subsystem object, dumped under "Show all details". */
  raw?: Record<string, unknown>;
  /** Hero tiles / curated content. */
  children?: React.ReactNode;
}

export function SubsystemPanel({
  title,
  icon,
  status,
  lastCheck,
  raw,
  children,
}: SubsystemPanelProps): React.JSX.Element {
  const checked = formatLastCheck(lastCheck);

  return (
    <div className="space-y-3 border-t border-border pt-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {icon}
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
          {status && <HealthStatusBadge status={status} />}
        </div>
        {checked && (
          <span className="text-xs text-muted-foreground">Checked {checked}</span>
        )}
      </div>

      {children}

      {raw && Object.keys(raw).length > 0 && (
        <Collapsible>
          <CollapsibleTrigger className="text-xs font-medium text-muted-foreground hover:text-foreground">
            <ChevronRight className="h-3.5 w-3.5 transition-transform group-data-[state=open]:rotate-90" />
            <span className="group-data-[state=open]:hidden">Show all details</span>
            <span className="hidden group-data-[state=open]:inline">Hide details</span>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 rounded-lg border border-border bg-muted/20 p-3">
              <GenericFieldList data={raw} />
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

export default SubsystemPanel;
