import { ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

interface IndexerChipsProps {
  results: JackettSearchResult[];
  indexers: Indexer[];
}

export function IndexerChips({ results, indexers }: IndexerChipsProps) {
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
    <div className="flex flex-wrap gap-2 p-3">
      {indexerStats.map(({ indexerId, count, siteLink }, index) => (
        <div key={index} className="flex items-center gap-1">
          <Badge variant="secondary">{`${indexerId} (${count})`}</Badge>
          {siteLink && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() =>
                window.open(siteLink, "_blank", "noopener,noreferrer")
              }
              title={`Visit ${indexerId} site`}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
