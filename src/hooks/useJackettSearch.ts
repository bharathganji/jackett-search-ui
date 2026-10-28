import { useCallback, useEffect, useRef, useState } from "react";

import { toast } from "sonner";

import type { JackettSearchResult } from "@/types/search";

import type { IndexerSelectionState } from "../types/indexer";
import { useEventSource } from "./useEventSource";
import { useIndexers } from "./useIndexers";
import { useLocalStorage } from "./usePersistentState";
import { useRecentSearches } from "./useRecentSearches";
import { useResultBatching } from "./useResultBatching";
import { useSearch } from "./useSearch";
import { useSearchCache } from "./useSearchCache";

export const useJackettSearch = () => {
  const [results, setResults] = useState<JackettSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const { getCachedResults, setCachedResults } = useSearchCache();
  const { addToRecentSearches } = useRecentSearches();

  const {
    indexers,
    loading: indexersLoading,
    error: indexersError,
    refetch: refetchIndexers,
  } = useIndexers();

  const [indexerSelection, setIndexerSelection] =
    useLocalStorage<IndexerSelectionState>("jackett-indexer-selection", {
      selectedIndexers: [],
      searchMode: "all",
    });

  const [selectedIndexerFilters, setSelectedIndexerFilters] = useState<
    string[]
  >([]);

  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleIndexerFilterToggle = useCallback((indexerId: string) => {
    setSelectedIndexerFilters((prev) =>
      prev.includes(indexerId)
        ? prev.filter((id) => id !== indexerId)
        : [...prev, indexerId]
    );
  }, []);

  const handleClearIndexerFilters = useCallback(() => {
    setSelectedIndexerFilters([]);
  }, []);

  const { cleanupEventSource } = useEventSource();

  const { addResultToBatch, processBatch, cleanupBatches } = useResultBatching({
    setResults,
  });

  const { fetchDataJackett, cancelSearch } = useSearch({
    indexerSelection,
    setResults,
    setLoading,
    setError,
    setInfo,
    getCachedResults,
    setCachedResults,
    processBatch,
    addResultToBatch,
    cleanupBatches,
  });

  const fetchDataJackettWrapper = useCallback(
    (queryOverride?: string) => {
      const query = queryOverride !== undefined ? queryOverride : searchQuery;
      if (query.trim()) {
        addToRecentSearches(query.trim());
      }
      fetchDataJackett(query);
    },
    [searchQuery, addToRecentSearches, fetchDataJackett]
  );

  const handleCopy = useCallback(
    (type: "magnet" | "source", content: string) => {
      navigator.clipboard.writeText(content).then(
        () => {
          toast.success(`Copied ${type} link to clipboard`);
        },
        () => {
          toast.error(`Failed to copy ${type} link to clipboard`);
        }
      );
    },
    []
  );

  useEffect(() => {
    return () => {
      cleanupBatches();
      cleanupEventSource();
      processBatch();
    };
  }, [processBatch, cleanupBatches, cleanupEventSource]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.isComposing) {
        return;
      }
      if (e.key === "/") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return {
    results,
    loading,
    error,
    info,
    searchQuery,
    setSearchQuery,
    indexerSelection,
    setIndexerSelection,
    indexers,
    indexersLoading,
    indexersError,
    refetchIndexers,
    selectedIndexerFilters,
    handleIndexerFilterToggle,
    handleClearIndexerFilters,
    fetchDataJackettWrapper,
    cancelSearch,
    handleCopy,
    inputRef,
  };
};
