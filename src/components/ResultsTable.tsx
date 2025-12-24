import { useEffect, useRef, useState } from "react";

import { useVirtualizer } from "@tanstack/react-virtual";
import { Search, X } from "lucide-react";

import {
  MobileSortModal,
  type SortOption,
} from "@/components/ui/MobileSortModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { JackettSearchResult } from "@/types/search";

import { useFilteredResults } from "../hooks/useFilteredResults";
import type { Indexer } from "../types/indexer";
import { PaginationControls } from "./results/PaginationControls";
import { ResultsMobileCard } from "./results/ResultsMobileCard";
import { ResultsTableHeader } from "./results/ResultsTableHeader";
import { ResultsTableRow } from "./results/ResultsTableRow";

interface ResultsTableProps {
  results: JackettSearchResult[];
  onCopy: (type: "magnet" | "source", content: string) => void;
  indexers: Indexer[];
  selectedIndexerFilters: string[];
  searchQuery: string;
}

/**
 * Optimized measure function for virtualized list
 */
const getElementHeight = (
  element: HTMLElement | null,
  isMobile: boolean
): number => {
  if (!element) return isMobile ? 120 : 60;
  return Math.max(element.getBoundingClientRect().height, isMobile ? 80 : 60);
};

export function ResultsTable({
  results,
  onCopy,
  selectedIndexerFilters,
  searchQuery,
}: ResultsTableProps) {
  // --- UI State ---
  const [filter, setFilter] = useState("");
  const [sortField, setSortField] =
    useState<keyof JackettSearchResult>("Relevance");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 640 : false
  );

  // --- Refs ---
  const parentRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // --- Modularized Data Logic ---
  const { paginatedResults, totalPages, totalResults } = useFilteredResults({
    results,
    filter,
    searchQuery,
    selectedIndexerFilters,
    sortField,
    sortDirection,
    itemsPerPage,
    currentPage,
  });

  // --- Virtualization ---
  const rowVirtualizer = useVirtualizer({
    count: paginatedResults.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) =>
      getElementHeight(rowRefs.current.get(index) || null, isMobile),
    measureElement: (element) =>
      getElementHeight(element as HTMLElement, isMobile),
    overscan: 10,
  });

  // --- Effects ---
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
      rowVirtualizer.measure();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [rowVirtualizer]);

  useEffect(() => {
    setCurrentPage(1); // Reset page on filter change
  }, [filter, selectedIndexerFilters]);

  // Handle dynamic measurement synchronization
  useEffect(() => {
    const timer = requestAnimationFrame(() => rowVirtualizer.measure());
    return () => cancelAnimationFrame(timer);
  }, [paginatedResults, isMobile, rowVirtualizer]);

  // --- Callbacks ---
  const handleSort = (field: keyof JackettSearchResult) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const mobileSortOptions: SortOption[] = [
    { key: "Title", label: "Title" },
    { key: "Seeders", label: "Seeds" },
    { key: "Size", label: "Size" },
    { key: "Relevance", label: "Relevance" },
  ];

  if (results.length === 0) return null;

  return (
    <Card className="border-border bg-background/40 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden animate-fadeIn">
      <CardHeader className="pb-3 border-b border-border/20">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Search className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-bold tracking-tight text-foreground/80 uppercase text-[11px]">
                Search Results ({totalResults})
              </span>
            </div>
            <div className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase bg-secondary/30 px-3 py-1 rounded-full border border-border/50">
              Page {currentPage} of {totalPages}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="h-10 px-4 bg-secondary/20 border-border/40 text-sm font-medium rounded-xl hover:bg-secondary/30 transition-all focus:ring-primary/20 cursor-pointer w-full sm:w-auto"
            >
              {[25, 50, 100, 200].map((val) => (
                <option key={val} value={val}>
                  {val} / page
                </option>
              ))}
            </select>

            <div className="relative flex-1 w-full group">
              <Input
                placeholder="Fuzzy filter results (e.g. '720p season 1')..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="h-10 pl-10 bg-secondary/20 border-border/80 rounded-xl transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary/50 text-lg shadow-sm"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              {filter && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setFilter("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ResultsTableHeader
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
        />

        <div className="sm:hidden flex justify-between items-center p-2 border-b">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Quick Sort
          </span>
          <MobileSortModal
            currentSort={sortField}
            currentDirection={sortDirection}
            onSort={(f, d) => {
              setSortField(f as keyof JackettSearchResult);
              setSortDirection(d);
            }}
            options={mobileSortOptions}
          />
        </div>

        <div
          ref={parentRef}
          className="h-[600px] sm:h-96 overflow-auto mt-2 will-change-transform scrollbar-thin scrollbar-thumb-primary/20"
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((v) => {
              const result = paginatedResults[v.index];
              if (!result) return null;

              return (
                <div
                  key={v.key}
                  ref={(el) => {
                    if (el) {
                      rowRefs.current.set(v.index, el);
                      rowVirtualizer.measureElement(el);
                    } else rowRefs.current.delete(v.index);
                  }}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${v.start}px)`,
                  }}
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
