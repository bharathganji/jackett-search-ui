import { useMemo } from "react";

import { type JackettSearchResult } from "@/types/search";

import { advancedFuzzySearch } from "../lib/searchUtils";

interface UseFilteredResultsProps {
  results: JackettSearchResult[];
  filter: string;
  searchQuery: string;
  selectedIndexerFilters: string[];
  sortField: keyof JackettSearchResult;
  sortDirection: "asc" | "desc";
  itemsPerPage: number;
  currentPage: number;
}

export function useFilteredResults({
  results,
  filter,
  searchQuery,
  selectedIndexerFilters,
  sortField,
  sortDirection,
  itemsPerPage,
  currentPage,
}: UseFilteredResultsProps) {
  return useMemo(() => {
    let processed = results;

    // 1. Indexer Filtering
    if (selectedIndexerFilters.length > 0) {
      const selectedIndexerSet = new Set(selectedIndexerFilters);
      processed = processed.filter((r) => selectedIndexerSet.has(r.IndexerId));
    }

    // 2. Fuzzy Filtering & Relevance Scoring
    // We always want relevance scored against the primary searchQuery if inner filter is empty
    processed = advancedFuzzySearch(processed, filter, searchQuery);

    // 3. Sorting
    const sorted = [...processed].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      // Special handling for Seeders, Leechers, Size, Relevance to ensure numeric sort
      if (
        sortField === "Seeders" ||
        sortField === "Leechers" ||
        sortField === "Size" ||
        sortField === "Relevance"
      ) {
        const aNum =
          typeof aVal === "string" ? parseFloat(aVal) : Number(aVal) || 0;
        const bNum =
          typeof bVal === "string" ? parseFloat(bVal) : Number(bVal) || 0;
        return sortDirection === "asc" ? aNum - bNum : bNum - aNum;
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal || "").toLowerCase();
      const bStr = String(bVal || "").toLowerCase();

      return sortDirection === "asc"
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });

    // 4. Pagination
    const totalResults = sorted.length;
    const totalPages = Math.ceil(totalResults / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedResults = sorted.slice(
      startIndex,
      startIndex + itemsPerPage
    );

    return {
      paginatedResults,
      totalPages,
      totalResults,
    };
  }, [
    results,
    filter,
    searchQuery,
    selectedIndexerFilters,
    sortField,
    sortDirection,
    itemsPerPage,
    currentPage,
  ]);
}
