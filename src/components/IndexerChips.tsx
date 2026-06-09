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
    return Array.from(stats.entries()).map(([indexerId, count]) => ({
      indexerId,
      count,
      siteLink: indexers.find((idx) => idx.id === indexerId)?.site_link,
    }));
  })();

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-muted rounded-lg border border-border">
      <div className="flex items-center gap-2 mr-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
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
                  ? "bg-primary text-primary-foreground border-primary scale-[1.02]"
                  : selectedIndexerFilters.length > 0 && !isFiltered
                    ? "bg-secondary/5 border-transparent opacity-30 grayscale hover:grayscale-0 hover:opacity-100 hover:bg-secondary/15"
                    : "bg-background/80 border-border/60 hover:border-primary/50 hover:bg-background shadow-sm"
              }`}
              onClick={() => onToggleFilter(indexerId)}
            >
              <span
                className={`text-xs font-bold tracking-tight ${isFiltered ? "text-primary-foreground" : isActive ? "text-primary" : "text-muted-foreground"}`}
              >
                {indexerId}
              </span>
              <span
                className={`text-[10px] font-black px-1.5 py-0.5 rounded-md min-w-[22px] text-center transition-colors ${
                  isFiltered
                    ? "bg-white/20 text-white"
                    : "bg-primary/10 text-primary"
                }`}
              >
                {count}
              </span>
              {siteLink && (
                <button
                  className={`p-1 transition-colors focus:outline-none ${isFiltered ? "hover:text-white/80" : "hover:text-primary"}`}
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
