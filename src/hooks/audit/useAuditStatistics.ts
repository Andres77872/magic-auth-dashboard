import { useState, useEffect, useCallback, useRef } from 'react';
import { auditService } from '@/services/audit.service';
import type { AuditStatistics } from '@/types/audit.types';

/**
 * Options for the useAuditStatistics hook
 */
export interface UseAuditStatisticsOptions {
  days?: number;
}

/**
 * Return type for the useAuditStatistics hook
 */
export interface UseAuditStatisticsReturn {
  statistics: AuditStatistics | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setDays: (days: number) => void;
  days: number;
}

const DEFAULT_DAYS = 7;

/**
 * Hook for fetching audit statistics with configurable time range
 * 
 * Requirements: 5.1, 5.5
 */
export function useAuditStatistics(options: UseAuditStatisticsOptions = {}): UseAuditStatisticsReturn {
  const { days: initialDays = DEFAULT_DAYS } = options;

  // State
  const [statistics, setStatistics] = useState<AuditStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [days, setDaysState] = useState(initialDays);
  const isMountedRef = useRef(true);

  /**
   * Fetch audit statistics from the API
   */
  const fetchStatistics = useCallback(async () => {
    if (!isMountedRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await auditService.getAuditStatistics(days);

      if (!isMountedRef.current) return;

      setStatistics(result);
    } catch (err) {
      if (!isMountedRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to fetch audit statistics');
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [days]);

  /**
   * Refetch statistics
   */
  const refetch = useCallback(async () => {
    await fetchStatistics();
  }, [fetchStatistics]);

  /**
   * Update the time range (Requirement 5.5)
   */
  const setDays = useCallback((newDays: number) => {
    setDaysState(newDays);
  }, []);

  // Initial fetch and refetch when days change
  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    statistics,
    isLoading,
    error,
    refetch,
    setDays,
    days,
  };
}

export default useAuditStatistics;
