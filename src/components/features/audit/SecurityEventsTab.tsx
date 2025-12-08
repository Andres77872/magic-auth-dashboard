import React, { useState, useCallback, memo, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { EmptyState } from '@/components/common/EmptyState';
import { SecuritySummaryCards } from './SecuritySummaryCards';
import { ActivityDetailPanel } from './ActivityDetailPanel';
import { useSecurityEvents } from '@/hooks/audit/useSecurityEvents';
import {
  RefreshCw,
  ShieldAlert,
  AlertTriangle,
  Info,
  User,
  Globe,
  Monitor,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { formatRelativeTime, formatDateTime } from '@/utils/component-utils';
import type { SecurityEvent, SecuritySeverity } from '@/types/audit.types';

type SeverityConfig = { icon: React.ElementType; variant: 'info' | 'warning' | 'error'; label: string };

export interface SecurityEventsTabProps {
  onEventSelect?: (event: SecurityEvent) => void;
  onUserClick?: (userId: string) => void;
  onProjectClick?: (projectId: string) => void;
  className?: string;
}

/**
 * Severity badge configuration
 */
const SEVERITY_CONFIG: Record<
  SecuritySeverity,
  { icon: React.ElementType; variant: 'info' | 'warning' | 'error'; label: string }
> = {
  info: { icon: Info, variant: 'info', label: 'Info' },
  warning: { icon: AlertTriangle, variant: 'warning', label: 'Warning' },
  critical: { icon: ShieldAlert, variant: 'error', label: 'Critical' },
};

interface SecurityEventCardProps {
  event: SecurityEvent;
  config: SeverityConfig;
  isSelected: boolean;
  onRowClick: (event: SecurityEvent) => void;
}

/**
 * SecurityEventCard - Mobile card layout for a security event
 */
const SecurityEventCard = memo(function SecurityEventCard({
  event,
  config,
  isSelected,
  onRowClick,
}: SecurityEventCardProps): React.JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false);
  const SeverityIcon = config.icon;

  const handleClick = useCallback(() => {
    onRowClick(event);
  }, [onRowClick, event]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onRowClick(event);
    }
  }, [onRowClick, event]);

  const handleToggleExpand = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(prev => !prev);
  }, []);

  return (
    <Card
      className={cn(
        'transition-colors cursor-pointer hover:bg-muted/50',
        isSelected && 'ring-2 ring-primary bg-muted/50',
        event.severity === 'critical' && 'border-destructive/50 bg-destructive/5'
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-selected={isSelected}
    >
      <CardContent className="p-4">
        {/* Header: Severity + Time */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <Badge variant={config.variant} size="sm" className="gap-1">
            <SeverityIcon className="h-3 w-3" aria-hidden="true" />
            {config.label}
          </Badge>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatRelativeTime(event.createdAt)}
          </span>
        </div>

        {/* Event Type */}
        <div className="mb-2">
          <span className="text-sm font-medium">
            {event.activityType.replace(/_/g, ' ')}
          </span>
          {event.errorCode && (
            <span className="block text-xs text-destructive mt-0.5">
              {event.errorCode}
            </span>
          )}
        </div>

        {/* User */}
        {event.user && (
          <div className="flex items-center gap-2 mb-2">
            <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
            <span className="text-sm truncate">
              {event.user.username}
            </span>
          </div>
        )}

        {/* Expandable Details */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between h-8 px-2 -mx-2 mt-1"
          onClick={handleToggleExpand}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Hide details' : 'Show details'}
        >
          <span className="text-xs text-muted-foreground">Details</span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t space-y-2 text-sm">
            {/* IP Address */}
            <div className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
              <span className="text-muted-foreground">IP:</span>
              <span className="font-mono text-xs">{event.clientIp}</span>
            </div>
            {/* User Agent */}
            <div className="flex items-start gap-2">
              <Monitor className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" aria-hidden="true" />
              <span className="text-muted-foreground">Agent:</span>
              <span className="text-xs text-muted-foreground break-all line-clamp-2">
                {event.userAgent}
              </span>
            </div>
            {/* Full Timestamp */}
            <div className="text-xs text-muted-foreground">
              {formatDateTime(event.createdAt)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
})

// Pre-computed skeleton arrays
const SKELETON_ITEMS = Array.from({ length: 5 }, (_, i) => i);

interface SecurityEventTableRowProps {
  event: SecurityEvent;
  config: SeverityConfig;
  isSelected: boolean;
  onRowClick: (event: SecurityEvent) => void;
}

/**
 * SecurityEventTableRow - Memoized table row for security events
 */
const SecurityEventTableRow = memo(function SecurityEventTableRow({
  event,
  config,
  isSelected,
  onRowClick,
}: SecurityEventTableRowProps): React.JSX.Element {
  const SeverityIcon = config.icon;

  const handleClick = useCallback(() => {
    onRowClick(event);
  }, [onRowClick, event]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onRowClick(event);
    }
  }, [onRowClick, event]);

  return (
    <TableRow
      onClick={handleClick}
      className={cn(
        'cursor-pointer',
        isSelected && 'bg-muted/50',
        event.severity === 'critical' && 'bg-destructive/5'
      )}
      data-severity={event.severity}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-selected={isSelected}
    >
      {/* Severity */}
      <TableCell>
        <Badge variant={config.variant} size="sm" className="gap-1">
          <SeverityIcon className="h-3 w-3" aria-hidden="true" />
          {config.label}
        </Badge>
      </TableCell>

      {/* Event Type */}
      <TableCell>
        <span className="text-sm font-medium">
          {event.activityType.replace(/_/g, ' ')}
        </span>
        {event.errorCode && (
          <span className="block text-xs text-destructive">
            {event.errorCode}
          </span>
        )}
      </TableCell>

      {/* User */}
      <TableCell>
        {event.user ? (
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            <span className="text-sm truncate max-w-[100px]">
              {event.user.username}
            </span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">Unknown</span>
        )}
      </TableCell>

      {/* Time */}
      <TableCell>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-sm text-muted-foreground">
              {formatRelativeTime(event.createdAt)}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {formatDateTime(event.createdAt)}
          </TooltipContent>
        </Tooltip>
      </TableCell>

      {/* IP Address */}
      <TableCell>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              <span className="text-xs font-mono truncate max-w-[90px]">
                {event.clientIp}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-mono">{event.clientIp}</p>
          </TooltipContent>
        </Tooltip>
      </TableCell>

      {/* User Agent */}
      <TableCell>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5">
              <Monitor className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
              <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                {event.userAgent}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-[300px]">
            <p className="text-xs break-all">{event.userAgent}</p>
          </TooltipContent>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
});

/**
 * SecurityEventsTab - Security events dashboard for root users
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */
export const SecurityEventsTab = memo(function SecurityEventsTab({
  onEventSelect,
  onUserClick,
  onProjectClick,
  className,
}: SecurityEventsTabProps): React.JSX.Element {
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);

  const { events, summary, isLoading, error, refetch } = useSecurityEvents({
    limit: 50,
    days: 7,
  });

  // Memoize event configs
  const eventConfigs = useMemo(() => {
    return events.map(event => ({
      event,
      config: SEVERITY_CONFIG[event.severity],
      isSelected: selectedEvent?.id === event.id,
    }));
  }, [events, selectedEvent?.id]);

  // Handle row click
  const handleRowClick = useCallback(
    (event: SecurityEvent) => {
      setSelectedEvent(event);
      setIsDetailPanelOpen(true);
      onEventSelect?.(event);
    },
    [onEventSelect]
  );

  // Handle detail panel close
  const handleDetailPanelClose = useCallback(() => {
    setIsDetailPanelOpen(false);
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Summary Cards */}
      <SecuritySummaryCards
        failedLogins={summary.failedLogins}
        unauthorizedAttempts={summary.unauthorizedAttempts}
        criticalEvents={summary.criticalEvents}
        lastSecurityEvent={summary.lastEventTimestamp}
        isLoading={isLoading}
      />

      {/* Actions Row */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Recent Security Events</h3>
          <p className="text-sm text-muted-foreground">
            Last 7 days • {summary.totalEvents} total events
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          className="gap-1"
          aria-label="Refresh security events"
        >
          <RefreshCw
            className={cn('h-4 w-4', isLoading && 'animate-spin')}
            aria-hidden="true"
          />
          Refresh
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <div
          className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg"
          role="alert"
        >
          <p className="text-sm text-destructive font-medium">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Security Events - Responsive Layout */}
      {/* Mobile: Card Layout (<768px) */}
      <div className="md:hidden space-y-3">
        {isLoading && events.length === 0 ? (
          // Mobile loading skeleton
          SKELETON_ITEMS.map((index) => (
            <Card key={`mobile-skeleton-${index}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <Skeleton className="h-5 w-16 rounded" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-full mt-2" />
              </CardContent>
            </Card>
          ))
        ) : events.length === 0 ? (
          <div className="rounded-md border p-8">
            <EmptyState
              icon={<ShieldAlert className="h-8 w-8" />}
              title="No security events"
              description="No security events recorded in the last 7 days."
            />
          </div>
        ) : (
          eventConfigs.map(({ event, config, isSelected }) => (
            <SecurityEventCard
              key={event.id}
              event={event}
              config={config}
              isSelected={isSelected}
              onRowClick={handleRowClick}
            />
          ))
        )}
      </div>

      {/* Desktop: Table Layout (≥768px) */}
      <TooltipProvider>
        <div className="hidden md:block rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Severity</TableHead>
                <TableHead className="w-[180px]">Event Type</TableHead>
                <TableHead className="w-[150px]">User</TableHead>
                <TableHead className="w-[120px]">Time</TableHead>
                <TableHead className="w-[130px]">IP Address</TableHead>
                <TableHead>User Agent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && events.length === 0 ? (
                // Loading skeleton
                SKELETON_ITEMS.map((index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell>
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                  </TableRow>
                ))
              ) : events.length === 0 ? (
                // Empty state
                <TableRow>
                  <TableCell colSpan={6} className="h-48">
                    <EmptyState
                      icon={<ShieldAlert className="h-8 w-8" />}
                      title="No security events"
                      description="No security events recorded in the last 7 days."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                // Events list
                eventConfigs.map(({ event, config, isSelected }) => (
                  <SecurityEventTableRow
                    key={event.id}
                    event={event}
                    config={config}
                    isSelected={isSelected}
                    onRowClick={handleRowClick}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </TooltipProvider>

      {/* Detail Panel */}
      <ActivityDetailPanel
        activity={selectedEvent}
        isOpen={isDetailPanelOpen}
        onClose={handleDetailPanelClose}
        onUserClick={onUserClick}
        onProjectClick={onProjectClick}
      />
    </div>
  );
});

export default SecurityEventsTab;
