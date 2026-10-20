import { useEffect, useState } from "react";

import { Search, X } from "lucide-react";
import { Virtuoso } from "react-virtuoso";

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
  onClearIndexerFilters: () => void;
}

export function ResultsTable({
  results,
  onCopy,
  selectedIndexerFilters,
  searchQuery,
  onClearIndexerFilters,
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

  // --- Effects ---
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setCurrentPage(1); // Reset page on filter change
  }, [filter, selectedIndexerFilters]);

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
    <Card className="border-border bg-background shadow-sm rounded-lg overflow-hidden">
      <CardHeader className="p-3 sm:p-6 sm:pb-3 border-b border-border/20">
        <div className="flex flex-col gap-4 sm:gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
                <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
              </div>
              <span className="text-xs sm:text-sm font-bold tracking-tight text-foreground/80 uppercase">
                Results ({totalResults})
              </span>
            </div>
            <div className="text-[10px] sm:text-[11px] font-bold tracking-widest text-muted-foreground uppercase bg-secondary/30 px-2.5 py-1 rounded-full border border-border/50">
              Page {currentPage} of {totalPages}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center">
            <div className="flex w-full sm:w-auto gap-2">
              <select
                aria-label="Items per page"
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="h-9 sm:h-10 px-3 sm:px-4 bg-secondary/30 border-border/60 text-xs sm:text-sm font-semibold rounded-full hover:bg-secondary/50 transition-all focus:ring-ring cursor-pointer flex-1 sm:flex-none shadow-sm"
              >
                {[25, 50, 100, 200].map((val) => (
                  <option key={val} value={val}>
                    {val} / page
                  </option>
                ))}
              </select>

              {(filter || selectedIndexerFilters.length > 0) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-3 text-[10px] font-bold uppercase tracking-widest text-destructive bg-destructive/5 hover:bg-destructive/15 rounded-full whitespace-nowrap transition-all border border-destructive/20 flex-1 sm:flex-none"
                  onClick={() => {
                    setFilter("");
                    onClearIndexerFilters();
                  }}
                >
                  Clear
                </Button>
              )}
            </div>

            <div className="relative w-full group">
              <Input
                placeholder="Fuzzy filter (e.g. '720p')..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="h-9 sm:h-10 pl-9 sm:pl-10 text-sm bg-secondary/30 border-border/60 rounded-full transition-all duration-300 focus:ring-4 focus:ring-ring/20 focus:border-ring shadow-sm"
              />
              <Search className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              {filter && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 h-6 w-6 sm:h-7 sm:w-7 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setFilter("")}
                >
                  <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 sm:p-2 sm:pt-0">
        <ResultsTableHeader
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
        />

        <div className="sm:hidden flex justify-between items-center px-3 py-2 border-b bg-muted/20">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Sort By
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

        <div className="h-[600px] sm:h-96 mt-2">
          <Virtuoso
            className="h-full scrollbar-thin scrollbar-thumb-primary/20"
            data={paginatedResults}
            itemContent={(index, result) => {
              if (!result) return null;

              return (
                <div
                  key={result.InfoHash || result.Link || index}
                  className="w-full"
                >
                  {!isMobile ? (
                    <ResultsTableRow result={result} onCopy={onCopy} />
                  ) : (
                    <ResultsMobileCard result={result} onCopy={onCopy} />
                  )}
                </div>
              );
            }}
          />
        </div>

        <div className="p-3 sm:p-0">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalResults={totalResults}
            onPageChange={setCurrentPage}
          />
        </div>
      </CardContent>
    </Card>
  );
}
