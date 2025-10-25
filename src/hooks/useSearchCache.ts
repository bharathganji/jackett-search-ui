import { useCallback, useRef } from "react";

import type { JackettSearchResult } from "../lib/searchUtils";

interface CacheEntry {
  results: JackettSearchResult[];
  timestamp: number;
  query: string;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 20; // Maximum number of cached queries

export function useSearchCache() {
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());

  const getCachedResults = useCallback(
    (query: string): JackettSearchResult[] | null => {
      const normalizedQuery = query.toLowerCase().trim();
      const cached = cacheRef.current.get(normalizedQuery);

      if (!cached) {
        return null;
      }

      // Check if cache is still valid
      const now = Date.now();
      if (now - cached.timestamp > CACHE_DURATION) {
        cacheRef.current.delete(normalizedQuery);
        return null;
      }

      return cached.results;
    },
    []
  );

  const setCachedResults = useCallback(
    (query: string, results: JackettSearchResult[]) => {
      const normalizedQuery = query.toLowerCase().trim();

      // If cache is full, remove oldest entry
      if (cacheRef.current.size >= MAX_CACHE_SIZE) {
        let oldestKey = "";
        let oldestTimestamp = Date.now();

        for (const [key, entry] of cacheRef.current.entries()) {
          if (entry.timestamp < oldestTimestamp) {
            oldestTimestamp = entry.timestamp;
            oldestKey = key;
          }
        }

        if (oldestKey) {
          cacheRef.current.delete(oldestKey);
        }
      }

      cacheRef.current.set(normalizedQuery, {
        results: [...results], // Create a copy to avoid mutations
        timestamp: Date.now(),
        query: normalizedQuery,
      });
    },
    []
  );

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  const getCacheStats = useCallback(() => {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const entry of cacheRef.current.values()) {
      if (now - entry.timestamp > CACHE_DURATION) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }

    return {
      totalEntries: cacheRef.current.size,
      validEntries,
      expiredEntries,
      maxSize: MAX_CACHE_SIZE,
    };
  }, []);

  const cleanExpiredEntries = useCallback(() => {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of cacheRef.current.entries()) {
      if (now - entry.timestamp > CACHE_DURATION) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => cacheRef.current.delete(key));
    return keysToDelete.length;
  }, []);

  return {
    getCachedResults,
    setCachedResults,
    clearCache,
    getCacheStats,
    cleanExpiredEntries,
  };
}
