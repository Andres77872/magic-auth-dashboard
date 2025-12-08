import { useState, useEffect, useCallback, useRef } from 'react';
import { auditService } from '@/services/audit.service';
import type { SecurityEvent, SecuritySummary } from '@/types/audit.types';

/**
 * Options for the useSecurityEvents hook
 */
export interface UseSecurityEventsOptions {
  limit?: number;
  days?: number;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
  failedLoginThreshold?: number; // threshold for warning indicator
}

/**
 * Return type for the useSecurityEvents hook
 */
export interface UseSecurityEventsReturn {
  events: SecurityEvent[];
  summary: SecuritySummary;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  hasWarning: boolean; // true if failed logins exceed threshold
  isAutoRefreshing: boolean;
  setAutoRefresh: (enabled: boolean) => void;
}

const DEFAULT_LIMIT = 100;
const DEFAULT_DAYS = 7;
const DEFAULT_REFRESH_INTERVAL = 30000; // 30 seconds
const DEFAULT_FAILED_LOGIN_THRESHOLD = 5;

const EMPTY_SUMMARY: SecuritySummary = {
  totalEvents: 0,
  failedLogins: 0,
  unauthorizedAttempts: 0,
  criticalEvents: 0,
  lastEventTimestamp: null,
};

/**
 * Hook for fetching and managing security events with summary statistics
 * 
 * Requirements: 3.1, 3.2, 3.3
 */
export function useSecurityEvents(options: UseSecurityEventsOptions = {}): UseSecurityEventsReturn {
  const {
    limit = DEFAULT_LIMIT,
    days = DEFAULT_DAYS,
    autoRefresh: initialAutoRefresh = false,
    refreshInterval = DEFAULT_REFRESH_INTERVAL,
    failedLoginThreshold = DEFAULT_FAILED_LOGIN_THRESHOLD,
  } = options;

  // State
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [summary, setSummary] = useState<SecuritySummary>(EMPTY_SUMMARY);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(initialAutoRefresh);


  // Refs for interval management
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  /**
   * Fetch security events from the API
   */
  const fetchSecurityEvents = useCallback(async () => {
    if (!isMountedRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await auditService.getSecurityEvents({
        limit,
        days,
      });

      if (!isMountedRef.current) return;

      setEvents(result.events);
      setSummary(result.summary);
    } catch (err) {
      if (!isMountedRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to fetch security events');
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [limit, days]);

  /**
   * Refetch security events
   */
  const refetch = useCallback(async () => {
    await fetchSecurityEvents();
  }, [fetchSecurityEvents]);

  /**
   * Toggle auto-refresh
   */
  const setAutoRefresh = useCallback((enabled: boolean) => {
    setIsAutoRefreshing(enabled);
  }, []);

  /**
   * Check if failed logins exceed threshold (Requirement 3.3)
   */
  const hasWarning = summary.failedLogins >= failedLoginThreshold;

  // Initial fetch
  useEffect(() => {
    fetchSecurityEvents();
  }, [fetchSecurityEvents]);

  // Auto-refresh effect
  useEffect(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    if (isAutoRefreshing) {
      refreshTimerRef.current = setInterval(() => {
        fetchSecurityEvents();
      }, refreshInterval);
    }

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [isAutoRefreshing, refreshInterval, fetchSecurityEvents]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    events,
    summary,
    isLoading,
    error,
    refetch,
    hasWarning,
    isAutoRefreshing,
    setAutoRefresh,
  };
}

export default useSecurityEvents;
