import { useEffect, useMemo, useRef, useState } from "react";

import { useVirtualizer } from "@tanstack/react-virtual";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Globe,
  Magnet,
} from "lucide-react";

import {
  MobileSortModal,
  type SortOption,
} from "@/components/ui/MobileSortModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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

export function ResultsTable({ results, onCopy, indexers }: ResultsTableProps) {
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

  // Helper function to get indexer site link
  const getIndexerSiteLink = (indexerId: string): string | undefined => {
    return indexers.find((idx) => idx.id === indexerId)?.site_link;
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
      filtered = results.filter(
        (result) =>
          result.Title.toLowerCase().includes(filter.toLowerCase()) ||
          result.IndexerId.toLowerCase().includes(filter.toLowerCase())
      );
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

  const rowVirtualizer = useVirtualizer({
    count: paginatedResults.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => {
      // Mobile cards are taller than desktop rows but more compact now
      if (window.innerWidth < 640) {
        return 160; // Reduced height for more compact mobile card
      }
      return 60; // Desktop row height
    },
    overscan: 5,
  });

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
    <Card className="mx-auto p-2 sm:p-4 w-full">
      <CardHeader className="pb-4">
        <CardTitle className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <span className="text-lg font-semibold">
              Search Results ({totalResults})
            </span>
            <div className="text-sm text-muted-foreground sm:hidden">
              Page {currentPage} of {totalPages}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="px-3 py-2 border rounded-md text-sm bg-background"
            >
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
            <Input
              placeholder="Filter results..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="flex-1 sm:max-w-xs"
            />
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
        <div ref={parentRef} className="h-[600px] sm:h-96 overflow-auto">
          <div
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
                  key={virtualItem.key}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  {/* Desktop Layout */}
                  <div className="hidden sm:grid grid-cols-12 gap-2 p-2 border-b hover:bg-muted/50 items-center text-sm">
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

                  {/* Mobile Layout - Card Design */}
                  <div className="sm:hidden">
                    <Card className="m-2 shadow-sm hover:shadow-md transition-all duration-200 border border-border/50 mobile-card-hover touch-manipulation active:scale-[0.98]">
                      <div className="p-3 space-y-3">
                        {/* Top Section - Title */}
                        <div>
                          <h3 className="font-semibold text-sm leading-tight line-clamp-2 text-foreground">
                            {result.Title}
                          </h3>
                        </div>

                        {/* Bottom Section - Horizontal Scrollable Chip Group */}
                        <div className="space-y-3">
                          {/* Chips Row */}
                          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                            <Badge
                              variant="chip-seeds"
                              className="flex-shrink-0"
                            >
                              <span className="font-medium">
                                {result.Seeders}
                              </span>
                              <span className="text-xs opacity-75">seeds</span>
                            </Badge>

                            <Badge
                              variant="chip-size"
                              className="flex-shrink-0"
                            >
                              <span className="font-medium">
                                {convertSizeToGB(Number(result.Size))}
                              </span>
                            </Badge>

                            <Badge
                              variant="chip-indexer"
                              className="flex-shrink-0"
                            >
                              <span>{result.IndexerId}</span>
                              {getIndexerSiteLink(result.IndexerId) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-4 w-4 p-0 hover:bg-white/20"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(
                                      getIndexerSiteLink(result.IndexerId),
                                      "_blank",
                                      "noopener,noreferrer"
                                    );
                                  }}
                                  title={`Visit ${result.IndexerId} site`}
                                >
                                  <Globe className="h-3 w-3" />
                                </Button>
                              )}
                            </Badge>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="flex items-center gap-1.5 min-h-[32px] px-3"
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
                              <span className="text-xs font-medium">
                                Magnet
                              </span>
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              className="flex items-center gap-1.5 min-h-[32px] px-3"
                              onClick={() => {
                                onCopy("source", result.Details);
                                window.open(result.Details, "_blank");
                              }}
                            >
                              <ExternalLink className="h-4 w-4" />
                              <span className="text-xs font-medium">
                                Source
                              </span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
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
