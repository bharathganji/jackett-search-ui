import { useEffect, useMemo, useRef, useState } from "react";

import { useVirtualizer } from "@tanstack/react-virtual";

import {
  MobileSortModal,
  type SortOption,
} from "@/components/ui/MobileSortModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import {
  type JackettSearchResult,
  advancedFuzzySearch,
} from "../lib/searchUtils";
import type { Indexer } from "../types/indexer";
import { PaginationControls } from "./results/PaginationControls";
import { ResultsMobileCard } from "./results/ResultsMobileCard";
import { ResultsTableHeader } from "./results/ResultsTableHeader";
import { ResultsTableRow } from "./results/ResultsTableRow";

interface ResultsTableProps {
  results: JackettSearchResult[];
  onCopy: (type: "magnet" | "source", content: string) => void;
  indexers: Indexer[];
}

export function ResultsTable({ results, onCopy }: ResultsTableProps) {
  const [filter, setFilter] = useState("");
  const [sortField, setSortField] =
    useState<keyof JackettSearchResult>("Seeders");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);

  const parentRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Filter, sort, and paginate results
  const { paginatedResults, totalPages, totalResults } = useMemo(() => {
    let filtered = results;

    if (filter) {
      // Use the advanced fuzzy search utility function
      filtered = advancedFuzzySearch(results, filter);
    }

    const sorted = filtered.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();

      if (sortDirection === "asc") {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });

    const totalPages = Math.ceil(sorted.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedResults = sorted.slice(
      startIndex,
      startIndex + itemsPerPage
    );

    return {
      paginatedResults,
      totalPages,
      totalResults: sorted.length,
    };
  }, [results, filter, sortField, sortDirection, currentPage, itemsPerPage]);

  // Track window size for responsive rendering
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 640 : false
  );

  // Dynamic row height measurement function
  const measureElement = (element: HTMLElement | null | undefined): number => {
    if (!element) {
      // Fallback to estimated height if element not found
      return isMobile ? 120 : 60;
    }

    // Get the actual scrollHeight of the element to account for wrapped content
    // Use getBoundingClientRect for more accurate measurement
    const rect = element.getBoundingClientRect();
    const height = Math.ceil(rect.height);

    // Ensure minimum height
    return Math.max(height, isMobile ? 80 : 60);
  };

  const rowVirtualizer = useVirtualizer({
    count: paginatedResults.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      // Get the ref for this row if it exists, otherwise use fallback
      const element = rowRefs.current.get(index) || null;
      return measureElement(element);
    },
    measureElement: (element) => {
      return measureElement(element as HTMLElement | null);
    },
    overscan: 5,
  });

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 640;
      setIsMobile(mobile);
      // Clear cached measurements and remeasure
      setTimeout(() => {
        rowVirtualizer.measure();
      }, 0);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [rowVirtualizer]);

  // Measure all visible rows after they render
  useEffect(() => {
    // Use multiple requestAnimationFrames to ensure DOM is fully rendered and laid out
    const measureTimer = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        rowVirtualizer.measure();
      });
    });
    return () => cancelAnimationFrame(measureTimer);
  }, [paginatedResults.length, paginatedResults, rowVirtualizer, isMobile]);

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const handleSort = (field: keyof JackettSearchResult) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Mobile sort options
  const mobileSortOptions: SortOption[] = [
    { key: "Title", label: "Title" },
    { key: "Seeders", label: "Seeds" },
    { key: "Size", label: "Size" },
  ];

  const handleMobileSort = (field: string, direction: "asc" | "desc") => {
    setSortField(field as keyof JackettSearchResult);
    setSortDirection(direction);
  };

  if (results.length === 0) {
    return null;
  }

  return (
    <Card className="w-full animate-fadeIn">
      <CardHeader className="pb-3">
        <CardTitle className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
              Search Results ({totalResults})
            </span>
            <div className="text-sm text-muted-foreground sm:hidden">
              Page {currentPage} of {totalPages}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-center overflow-hidden">
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto min-w-0">
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="px-3 py-2 border rounded-md text-sm bg-background flex-shrink-0 focus:ring-2 focus:ring-primary/20 transition-all"
              >
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
              <div className="relative w-full sm:w-64 min-w-0">
                <Input
                  placeholder="Fuzzy search (e.g. '720p season 1 complete')..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full focus:ring-2 focus:ring-primary/20 transition-all"
                />
                {filter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 flex-shrink-0 hover:bg-destructive/10 hover:text-destructive transition-colors"
                    onClick={() => setFilter("")}
                  >
                    ×
                  </Button>
                )}
              </div>
            </div>
            {filter && (
              <div className="text-xs text-muted-foreground self-start sm:self-center flex-shrink-0 animate-fadeIn">
                {totalResults} of {results.length} results match "{filter}"
              </div>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Header - Desktop */}
        <ResultsTableHeader
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
        />

        {/* Header - Mobile */}
        <div className="sm:hidden flex justify-between items-center p-2 border-b">
          <div className="text-sm font-medium text-muted-foreground">
            Results
          </div>
          <MobileSortModal
            currentSort={sortField}
            currentDirection={sortDirection}
            onSort={handleMobileSort}
            options={mobileSortOptions}
          />
        </div>

        {/* Virtualized List */}
        <div
          ref={parentRef}
          className="h-[600px] sm:h-96 overflow-auto mt-2 will-change-transform box-border overflow-x-hidden scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent"
        >
          <div
            key={`virtual-list-${paginatedResults.length}`}
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualItem) => {
              const result = paginatedResults[virtualItem.index];
              if (!result) return null;
              return (
                <div
                  key={`${virtualItem.key}-${virtualItem.index}`}
                  data-index={virtualItem.index}
                  ref={(el) => {
                    if (el) {
                      rowRefs.current.set(virtualItem.index, el);
                      rowVirtualizer.measureElement(el);
                    } else {
                      rowRefs.current.delete(virtualItem.index);
                    }
                  }}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                  className="box-border"
                >
                  {!isMobile ? (
                    <ResultsTableRow result={result} onCopy={onCopy} />
                  ) : (
                    <ResultsMobileCard result={result} onCopy={onCopy} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Pagination Controls */}
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          totalResults={totalResults}
          onPageChange={setCurrentPage}
        />
      </CardContent>
    </Card>
  );
}
