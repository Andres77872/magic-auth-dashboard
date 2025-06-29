import { useCallback, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface UseDashboardCacheReturn {
  getCachedData: <T>(key: string) => T | null;
  setCachedData: <T>(key: string, data: T, ttlMinutes?: number) => void;
  clearCache: (key?: string) => void;
  isCacheValid: (key: string) => boolean;
}

export function useDashboardCache(): UseDashboardCacheReturn {
  const cache = useRef<Map<string, CacheEntry<any>>>(new Map());

  const getCachedData = useCallback(<T>(key: string): T | null => {
    const entry = cache.current.get(key);
    
    if (!entry) {
      return null;
    }
    
    const now = Date.now();
    const isExpired = now - entry.timestamp > entry.ttl;
    
    if (isExpired) {
      cache.current.delete(key);
      return null;
    }
    
    return entry.data as T;
  }, []);

  const setCachedData = useCallback(<T>(
    key: string, 
    data: T, 
    ttlMinutes: number = 5
  ): void => {
    const ttlMs = ttlMinutes * 60 * 1000;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    };
    
    cache.current.set(key, entry);
  }, []);

  const clearCache = useCallback((key?: string): void => {
    if (key) {
      cache.current.delete(key);
    } else {
      cache.current.clear();
    }
  }, []);

  const isCacheValid = useCallback((key: string): boolean => {
    const entry = cache.current.get(key);
    
    if (!entry) {
      return false;
    }
    
    const now = Date.now();
    return now - entry.timestamp <= entry.ttl;
  }, []);

  return {
    getCachedData,
    setCachedData,
    clearCache,
    isCacheValid,
  };
}

export default useDashboardCache; 