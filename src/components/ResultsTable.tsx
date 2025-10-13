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

import { advancedFuzzySearch } from "../lib/searchUtils";
import type { Indexer } from "../types/indexer";

interface JackettSearchResult {
  Title: string;
  Link: string;
  InfoHash: string;
  Seeders: number;
  Leechers: number;
  Size: string;
  IndexerId: string;
  Year: number;
  Details: string;
}

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

  // Determine row height based on screen size
  const rowHeight =
    typeof window !== "undefined" && window.innerWidth < 640 ? 180 : 60; // Increased mobile height to account for buttons

  const rowVirtualizer = useVirtualizer({
    count: paginatedResults.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 5,
  });

  // Ensure virtualizer updates when results change or window is resized
  useEffect(() => {
    rowVirtualizer?.measure?.();
  }, [paginatedResults.length, rowVirtualizer]);

  // Recalculate when window resizes
  useEffect(() => {
    const handleResize = () => {
      // Update row height based on new window size
      const newHeight = window.innerWidth < 640 ? 180 : 60;
      if (newHeight !== rowHeight) {
        setTimeout(() => {
          rowVirtualizer?.measure?.();
        }, 0);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [rowHeight, rowVirtualizer]);

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  // Recalculate virtualizer on window resize
  useEffect(() => {
    const handleResize = () => {
      rowVirtualizer?.measure?.();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [rowVirtualizer]);

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
    <Card className="w-full mx-2">
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
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="px-3 py-2 border rounded-md text-sm bg-background"
              >
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
              <div className="relative w-full sm:w-64">
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
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setFilter("")}
                  >
                    ×
                  </Button>
                )}
              </div>
            </div>
            {filter && (
              <div className="text-xs text-muted-foreground self-start sm:self-center">
                {totalResults} of {results.length} results match "{filter}"
              </div>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Header - Desktop */}
        <div className="hidden sm:grid grid-cols-12 gap-2 p-2 border-b font-medium text-sm">
          <div
            className="col-span-5 cursor-pointer hover:text-primary"
            onClick={() => handleSort("Title")}
          >
            Title{" "}
            {sortField === "Title" && (sortDirection === "asc" ? "↑" : "↓")}
          </div>
          <div
            className="col-span-1 cursor-pointer hover:text-primary text-center"
            onClick={() => handleSort("Seeders")}
          >
            Seeds{" "}
            {sortField === "Seeders" && (sortDirection === "asc" ? "↑" : "↓")}
          </div>
          <div
            className="col-span-1 cursor-pointer hover:text-primary text-center"
            onClick={() => handleSort("Size")}
          >
            Size {sortField === "Size" && (sortDirection === "asc" ? "↑" : "↓")}
          </div>
          <div className="col-span-1 text-center">Actions</div>
          <div className="col-span-1 text-center">Link</div>
          <div
            className="col-span-3 cursor-pointer hover:text-primary"
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
          className="h-[600px] sm:h-96 overflow-auto mt-2 will-change-transform box-border"
        >
          <div
            key={`virtual-list-${paginatedResults.length}`}
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualItem) => {
              const result = paginatedResults[virtualItem.index];
              if (!result) return null;
              return (
                <div
                  key={`${virtualItem.key}-${virtualItem.index}`}
                  data-index={virtualItem.index}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualItem.size}px`,
                    minHeight: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                  className="overflow-hidden border-box"
                >
                  {/* Desktop Layout */}
                  <div className="hidden sm:grid grid-cols-12 gap-2 p-2 border-b hover:bg-muted/50 items-center text-sm h-full">
                    <div className="col-span-5 truncate" title={result.Title}>
                      {result.Title}
                    </div>
                    <div className="col-span-1 text-center font-medium">
                      {result.Seeders}
                    </div>
                    <div className="col-span-1 text-center">
                      {convertSizeToGB(Number(result.Size))}
                    </div>
                    <div className="col-span-1 flex justify-center">
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
                    <div className="col-span-1 flex justify-center">
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
                    <div className="col-span-3 flex items-center gap-2">
                      <span className="truncate" title={result.IndexerId}>
                        {result.IndexerId}
                      </span>
                    </div>
                  </div>

                  {/* Mobile Layout - Card Format */}
                  <div className="sm:hidden p-2 border-b hover:bg-muted/50 h-full">
                    <div className="font-medium mb-2" title={result.Title}>
                      {result.Title}
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground mb-2">
                      <span>
                        <span className="font-medium">{result.Seeders}</span>{" "}
                        seeds
                      </span>
                      <span>{convertSizeToGB(Number(result.Size))}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mb-3">
                      Indexer: {result.IndexerId}
                    </div>
                    <div className="flex justify-between">
                      <Button
                        variant="default"
                        size="sm"
                        className="h-9 px-3"
                        onClick={() => {
                          onCopy("source", result.Details);
                          window.open(result.Details, "_blank");
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span className="ml-2">Source</span>
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-9 px-3"
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
                        <span className="ml-2">Magnet</span>
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
