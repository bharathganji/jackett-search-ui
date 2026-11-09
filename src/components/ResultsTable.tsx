import {
  useCallback,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
} from "react";

import { ArrowUp, Loader2, Search, X } from "lucide-react";
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso";

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
import { ResultsMobileCard } from "./results/ResultsMobileCard";
import { ResultsTableHeader } from "./results/ResultsTableHeader";
import { type CopiedAction, ResultsTableRow } from "./results/ResultsTableRow";

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
  // --- UI & Filter State ---
  const [filterInput, setFilterInput] = useState("");
  const deferredFilter = useDeferredValue(filterInput);
  const isFiltering = filterInput !== deferredFilter;

  // Sorting defaults to Seeders descending
  const [sortField, setSortField] =
    useState<keyof JackettSearchResult>("Seeders");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Viewport & Scroll State
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 640 : false
  );
  const [showScrollTop, setShowScrollTop] = useState(false);
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  // Micro-interaction: Granular copied state
  const [copiedAction, setCopiedAction] = useState<CopiedAction | null>(null);
  const copyTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleRowCopy = useCallback(
    (type: "magnet" | "source", content: string, id: string) => {
      onCopy(type, content);
      setCopiedAction({ id, type });
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = setTimeout(() => {
        setCopiedAction(null);
      }, 1400);
    },
    [onCopy]
  );

  // Filtered & Sorted Full Dataset Virtualization
  const { sortedResults, totalResults } = useFilteredResults({
    results,
    filter: deferredFilter,
    searchQuery,
    selectedIndexerFilters,
    sortField,
    sortDirection,
  });

  // Responsive window listener
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Cleanup copy timer on unmount
  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const handleSort = (field: keyof JackettSearchResult) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const scrollToTop = () => {
    virtuosoRef.current?.scrollToIndex({ index: 0, behavior: "smooth" });
  };

  const mobileSortOptions: SortOption[] = [
    { key: "Seeders", label: "Seeds" },
    { key: "Size", label: "Size" },
    { key: "Title", label: "Title" },
    { key: "Relevance", label: "Relevance" },
  ];

  if (results.length === 0) return null;

  return (
    <Card className="border-border bg-background shadow-sm rounded-xl overflow-hidden relative">
      <CardHeader className="p-3 sm:p-5 sm:pb-3 border-b border-border/30">
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Header Row: Title & Result Stats */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
                <Search className="h-4 w-4 text-primary" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xs sm:text-sm font-bold tracking-tight text-foreground/90 uppercase">
                  Results
                </span>
                <span className="text-xs font-semibold text-muted-foreground font-mono tabular-nums">
                  ({totalResults.toLocaleString()})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {selectedIndexerFilters.length > 0 && (
                <span className="text-[10px] sm:text-[11px] font-bold tracking-wide text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                  {selectedIndexerFilters.length} indexer
                  {selectedIndexerFilters.length > 1 ? "s" : ""} filtered
                </span>
              )}
            </div>
          </div>

          {/* Controls Row: Search Filter & Clear Button */}
          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-4 items-center">
            <div className="relative w-full group">
              <Input
                placeholder="Fuzzy filter (e.g. '720p', 'hevc', 'repack')..."
                value={filterInput}
                onChange={(e) => setFilterInput(e.target.value)}
                aria-label="Fuzzy filter search results"
                className="h-10 pl-10 pr-10 text-sm bg-secondary/30 border-border/60 rounded-full transition-all duration-200 focus:ring-2 focus:ring-primary/40 focus:border-primary shadow-sm"
              />
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                {isFiltering ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </div>
              {filterInput && (
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Clear filter text"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setFilterInput("")}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {(filterInput || selectedIndexerFilters.length > 0) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-10 px-4 text-xs font-bold uppercase tracking-wider text-destructive bg-destructive/5 hover:bg-destructive/15 rounded-full whitespace-nowrap transition-all border border-destructive/20 w-full sm:w-auto"
                onClick={() => {
                  setFilterInput("");
                  onClearIndexerFilters();
                }}
              >
                Clear all filters
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 sm:p-2 sm:pt-0">
        <ResultsTableHeader
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
        />

        {/* Mobile Sort Controller */}
        <div className="sm:hidden flex justify-between items-center px-3 py-2 border-b border-border/40 bg-muted/20">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Sort by: <strong className="text-foreground">{sortField}</strong> (
            {sortDirection.toUpperCase()})
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

        {/* Continuous Full-Dataset Virtualization */}
        <div className="h-[calc(100dvh-260px)] min-h-[460px] relative">
          <Virtuoso
            ref={virtuosoRef}
            className="h-full scrollbar-thin scrollbar-thumb-primary/20"
            data={sortedResults}
            overscan={200}
            atTopStateChange={(atTop) => setShowScrollTop(!atTop)}
            computeItemKey={(index, result) =>
              result.InfoHash ||
              result.Link ||
              `${result.Title}-${result.IndexerId}-${index}`
            }
            itemContent={(_index, result) => {
              if (!result) return null;

              return (
                <div className="w-full">
                  {!isMobile ? (
                    <ResultsTableRow
                      result={result}
                      copiedAction={copiedAction}
                      onCopy={handleRowCopy}
                    />
                  ) : (
                    <ResultsMobileCard
                      result={result}
                      copiedAction={copiedAction}
                      onCopy={handleRowCopy}
                    />
                  )}
                </div>
              );
            }}
          />

          {/* Floating Back to Top Button */}
          {showScrollTop && (
            <Button
              variant="default"
              size="sm"
              onClick={scrollToTop}
              aria-label="Scroll back to top"
              className="absolute bottom-4 right-4 z-20 shadow-lg rounded-full flex items-center gap-1.5 px-3.5 py-2 bg-primary/95 hover:bg-primary text-primary-foreground backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-200"
            >
              <ArrowUp className="h-4 w-4" />
              <span className="text-xs font-semibold">Top</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
