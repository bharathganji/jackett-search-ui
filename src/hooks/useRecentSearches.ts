import { useCallback } from "react";

import { usePersistentState } from "./usePersistentState";

export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = usePersistentState<string[]>(
    "jackett-recent-searches",
    [],
    localStorage
  );

  const addToRecentSearches = useCallback(
    (query: string) => {
      setRecentSearches((prev) => {
        // Remove the query if it already exists to avoid duplicates
        const filtered = prev.filter(
          (s) => s.toLowerCase() !== query.toLowerCase()
        );
        // Add the new query to the beginning and keep only the last 5
        return [query, ...filtered].slice(0, 5);
      });
    },
    [setRecentSearches]
  );

  const removeFromRecentSearches = useCallback(
    (query: string) => {
      setRecentSearches((prev) =>
        prev.filter((s) => s.toLowerCase() !== query.toLowerCase())
      );
    },
    [setRecentSearches]
  );

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
  }, [setRecentSearches]);

  return {
    recentSearches,
    addToRecentSearches,
    removeFromRecentSearches,
    clearRecentSearches,
  };
}
