import { useEffect, useMemo, useRef, useState } from "react";

import { useVirtualizer } from "@tanstack/react-virtual";
import { ChevronLeft, ChevronRight, ExternalLink, Magnet } from "lucide-react";

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

  // Helper function to convert size to GB
  const convertSizeToGB = (size: number): string => {
    if (!size) return "N/A";
    const sizeInBytes = parseFloat(size.toString());
    const sizeInGB = sizeInBytes / (1024 * 1024 * 1024);
    return `${sizeInGB.toFixed(2)} GB`;
  };

  const renderMagetButton = (Link: string) => {
    if (Link?.startsWith("magnet:")) {
      return <Magnet className="h-4 w-4" />;
    } else {
      return <ExternalLink className="h-4 w-4" />;
    }
  };

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

  // Dynamic row height measurement function
  const measureElement = (element: HTMLElement | null | undefined): number => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

    if (!element) {
      // Fallback to estimated height if element not found
      // Mobile: ~220px for 3-line title + stats + indexer + buttons
      // Desktop: ~60px for single row (fixed, all content is truncated)
      return isMobile ? 220 : 60;
    }

    // Desktop: Always use fixed height since all content is truncated
    if (!isMobile) {
      return 60;
    }

    // Mobile: Get the actual scrollHeight of the element to account for wrapped content
    // Use getBoundingClientRect for more accurate measurement
    const rect = element.getBoundingClientRect();
    const height = Math.ceil(rect.height);

    // Ensure minimum height and add small buffer for safety
    return Math.max(height, 180);
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

  // Measure all visible rows after they render
  useEffect(() => {
    // Use multiple requestAnimationFrames to ensure DOM is fully rendered and laid out
    const measureTimer = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        rowVirtualizer.measure();
      });
    });
    return () => cancelAnimationFrame(measureTimer);
  }, [paginatedResults.length, paginatedResults, rowVirtualizer]);

  // Recalculate when window resizes
  useEffect(() => {
    const handleResize = () => {
      // Clear cached measurements and remeasure
      setTimeout(() => {
        rowVirtualizer.measure();
      }, 0);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [rowVirtualizer]);

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
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <span className="text-lg font-semibold">
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
                className="px-3 py-2 border rounded-md text-sm bg-background flex-shrink-0"
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
                  className="w-full"
                />
                {filter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 flex-shrink-0"
                    onClick={() => setFilter("")}
                  >
                    ×
                  </Button>
                )}
              </div>
            </div>
            {filter && (
              <div className="text-xs text-muted-foreground self-start sm:self-center flex-shrink-0">
                {totalResults} of {results.length} results match "{filter}"
              </div>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Header - Desktop */}
        <div className="hidden sm:grid grid-cols-12 gap-2 p-2 border-b font-medium text-sm overflow-hidden">
          <div
            className="col-span-5 cursor-pointer hover:text-primary truncate"
            onClick={() => handleSort("Title")}
          >
            Title{" "}
            {sortField === "Title" && (sortDirection === "asc" ? "↑" : "↓")}
          </div>
          <div
            className="col-span-1 cursor-pointer hover:text-primary text-center flex-shrink-0"
            onClick={() => handleSort("Seeders")}
          >
            Seeds{" "}
            {sortField === "Seeders" && (sortDirection === "asc" ? "↑" : "↓")}
          </div>
          <div
            className="col-span-1 cursor-pointer hover:text-primary text-center flex-shrink-0"
            onClick={() => handleSort("Size")}
          >
            Size {sortField === "Size" && (sortDirection === "asc" ? "↑" : "↓")}
          </div>
          <div className="col-span-1 text-center flex-shrink-0">Actions</div>
          <div className="col-span-1 text-center flex-shrink-0">Link</div>
          <div
            className="col-span-3 cursor-pointer hover:text-primary truncate"
            onClick={() => handleSort("IndexerId")}
          >
            Indexer{" "}
            {sortField === "IndexerId" && (sortDirection === "asc" ? "↑" : "↓")}
          </div>
        </div>

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
          className="h-[600px] sm:h-96 overflow-auto mt-2 will-change-transform box-border overflow-x-hidden"
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
                    } else {
                      rowRefs.current.delete(virtualItem.index);
                    }
                  }}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualItem.size}px`,
                    minHeight: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                  className="box-border"
                >
                  {/* Desktop Layout */}
                  <div className="hidden sm:grid grid-cols-12 gap-2 p-2 border-b hover:bg-muted/50 items-center text-sm h-[60px] overflow-hidden">
                    <div
                      className="col-span-5 truncate min-w-0"
                      title={result.Title}
                    >
                      {result.Title}
                    </div>
                    <div className="col-span-1 text-center font-medium flex-shrink-0">
                      {result.Seeders}
                    </div>
                    <div className="col-span-1 text-center flex-shrink-0">
                      {convertSizeToGB(Number(result.Size))}
                    </div>
                    <div className="col-span-1 flex justify-center flex-shrink-0">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          if (result.Link?.startsWith("magnet:")) {
                            onCopy("magnet", result.Link);
                          } else {
                            onCopy("magnet", result.Link);
                            window.open(result.Link, "_blank");
                          }
                        }}
                      >
                        {renderMagetButton(result.Link)}
                      </Button>
                    </div>
                    <div className="col-span-1 flex justify-center flex-shrink-0">
                      <Button
                        variant="default"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          onCopy("source", result.Details);
                          window.open(result.Details, "_blank");
                        }}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="col-span-3 flex items-center gap-2 min-w-0">
                      <span className="truncate" title={result.IndexerId}>
                        {result.IndexerId}
                      </span>
                    </div>
                  </div>

                  {/* Mobile Layout - Card Format */}
                  <div className="sm:hidden p-3 border-b hover:bg-muted/50 flex flex-col gap-3 h-full">
                    <div
                      className="font-medium line-clamp-3 break-words"
                      title={result.Title}
                    >
                      {result.Title}
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground gap-2 flex-wrap">
                      <span className="flex-shrink-0">
                        <span className="font-medium">{result.Seeders}</span>{" "}
                        seeds
                      </span>
                      <span className="flex-shrink-0">
                        {convertSizeToGB(Number(result.Size))}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate min-w-0">
                      Indexer: {result.IndexerId}
                    </div>
                    <div className="flex justify-between gap-2 flex-wrap pt-1">
                      <Button
                        variant="default"
                        size="sm"
                        className="h-9 px-3 flex-1 min-w-0"
                        onClick={() => {
                          onCopy("source", result.Details);
                          window.open(result.Details, "_blank");
                        }}
                      >
                        <ExternalLink className="h-4 w-4 flex-shrink-0" />
                        <span className="ml-2 truncate">Source</span>
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-9 px-3 flex-1 min-w-0"
                        onClick={() => {
                          if (result.Link?.startsWith("magnet:")) {
                            onCopy("magnet", result.Link);
                          } else {
                            onCopy("magnet", result.Link);
                            window.open(result.Link, "_blank");
                          }
                        }}
                      >
                        {renderMagetButton(result.Link)}
                        <span className="ml-2 truncate">Magnet</span>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between mt-4 pt-4 border-t gap-4">
            <div className="text-sm text-muted-foreground order-2 sm:order-1">
              Page {currentPage} of {totalPages} ({totalResults} total results)
            </div>
            <div className="flex items-center gap-2 order-1 sm:order-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Previous</span>
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                  const pageNum =
                    Math.max(1, Math.min(totalPages - 2, currentPage - 1)) + i;
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="flex items-center gap-1"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
