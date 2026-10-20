import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Indexer } from "@/types/indexer";
import type { JackettSearchResult } from "@/types/search";

interface IndexerChipsProps {
  results: JackettSearchResult[];
  indexers: Indexer[];
  selectedIndexerFilters: string[];
  onToggleFilter: (indexerId: string) => void;
  onClearFilters: () => void;
}

export function IndexerChips({
  results,
  indexers,
  selectedIndexerFilters,
  onToggleFilter,
  onClearFilters,
}: IndexerChipsProps) {
  // Optimized function to get unique indexer names from the results
  const indexerStats = (() => {
    const stats = new Map<string, number>();
    for (const result of results) {
      stats.set(result.IndexerId, (stats.get(result.IndexerId) || 0) + 1);
    }

    // Precompute site links for O(1) lookup
    const siteLinks = new Map<string, string | undefined>();
    for (const indexer of indexers) {
      siteLinks.set(indexer.id, indexer.site_link);
    }

    const result = [];
    for (const [indexerId, count] of stats) {
      result.push({
        indexerId,
        count,
        siteLink: siteLinks.get(indexerId),
      });
    }
    return result;
  })();

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-secondary/30 rounded-xl border border-border/60 shadow-sm">
      <div className="flex items-center gap-2 mr-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
          Filter by:
        </span>
      </div>
      <div className="flex flex-wrap gap-2.5">
        {indexerStats.map(({ indexerId, count, siteLink }, index) => {
          const isFiltered = selectedIndexerFilters.includes(indexerId);
          const isActive = selectedIndexerFilters.length === 0 || isFiltered;

          return (
            <div
              key={index}
              className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border transition-all duration-300 cursor-pointer ${
                isFiltered
                  ? "bg-primary text-primary-foreground border-primary scale-[1.02] shadow-sm"
                  : selectedIndexerFilters.length > 0 && !isFiltered
                    ? "bg-secondary/10 border-transparent opacity-40 hover:opacity-100 hover:bg-secondary/30"
                    : "bg-background border-border/40 hover:border-primary/40 hover:bg-primary/5 shadow-sm"
              }`}
              onClick={() => onToggleFilter(indexerId)}
            >
              <span
                className={`text-xs font-bold tracking-tight ${isFiltered ? "text-primary-foreground" : isActive ? "text-primary" : "text-muted-foreground"}`}
              >
                {indexerId}
              </span>
              <span
                className={`text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[22px] text-center transition-colors ${
                  isFiltered
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-primary/10 text-primary"
                }`}
              >
                {count}
              </span>
              {siteLink && (
                <button
                  className={`p-1 transition-colors focus:outline-none rounded-full ${isFiltered ? "hover:bg-primary-foreground/20 text-primary-foreground/80 hover:text-primary-foreground" : "hover:bg-primary/10 hover:text-primary text-muted-foreground"}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(siteLink, "_blank", "noopener,noreferrer");
                  }}
                  title={`Visit ${indexerId} site`}
                >
                  <ExternalLink className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {selectedIndexerFilters.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="text-[10px] h-8 px-4 font-bold uppercase tracking-widest text-destructive hover:bg-destructive/10 rounded-full ml-auto transition-all"
          onClick={onClearFilters}
        >
          Reset Filters
        </Button>
      )}
    </div>
  );
}
