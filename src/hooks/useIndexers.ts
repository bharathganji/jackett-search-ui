import { useEffect, useState } from "react";

import type { Indexer, IndexersResponse } from "../types/indexer";

export function useIndexers() {
  const [indexers, setIndexers] = useState<Indexer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIndexers = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_JACKETT_API_URL}/indexers`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: IndexersResponse = await response.json();
      setIndexers(data.indexers || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch indexers";
      setError(errorMessage);
      console.error("Error fetching indexers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIndexers();
  }, []);

  return {
    indexers,
    loading,
    error,
    refetch: fetchIndexers,
  };
}
