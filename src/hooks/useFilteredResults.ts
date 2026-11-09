import { useMemo } from "react";

import { type JackettSearchResult } from "@/types/search";

import { advancedFuzzySearch, compareSearchResults } from "../lib/searchUtils";

interface UseFilteredResultsProps {
  results: JackettSearchResult[];
  filter: string;
  searchQuery: string;
  selectedIndexerFilters: string[];
  sortField: keyof JackettSearchResult;
  sortDirection: "asc" | "desc";
}

export function useFilteredResults({
  results,
  filter,
  searchQuery,
  selectedIndexerFilters,
  sortField,
  sortDirection,
}: UseFilteredResultsProps) {
  return useMemo(() => {
    let processed = results;

    // 1. Indexer Filtering
    if (selectedIndexerFilters.length > 0) {
      processed = processed.filter((r) =>
        selectedIndexerFilters.includes(r.IndexerId)
      );
    }

    // 2. Fuzzy Filtering & Relevance Scoring
    processed = advancedFuzzySearch(processed, filter, searchQuery);

    // 3. Sorting using safe multi-type comparator
    const sortedResults = [...processed].sort((a, b) =>
      compareSearchResults(a, b, sortField, sortDirection)
    );

    return {
      sortedResults,
      totalResults: sortedResults.length,
    };
  }, [
    results,
    filter,
    searchQuery,
    selectedIndexerFilters,
    sortField,
    sortDirection,
  ]);
}
