import { ExternalLink, Magnet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { convertSizeToGB } from "@/lib/searchUtils";
import type { JackettSearchResult } from "@/types/search";

interface ResultsMobileCardProps {
  result: JackettSearchResult;
  onCopy: (type: "magnet" | "source", content: string) => void;
}

export function ResultsMobileCard({ result, onCopy }: ResultsMobileCardProps) {
  const renderMagetButton = (Link: string) => {
    if (Link?.startsWith("magnet:")) {
      return <Magnet className="h-4 w-4" />;
    } else {
      return <ExternalLink className="h-4 w-4" />;
    }
  };

  return (
    <div className="mx-2 p-3 bg-card border border-border/60 rounded-xl shadow-sm flex flex-col gap-2 transition-all active:scale-[0.98]">
      <div
        className="font-semibold text-card-foreground break-all leading-snug text-[13px] line-clamp-2"
        title={result.Title}
      >
        {result.Title}
      </div>

      <div className="flex justify-between text-xs gap-2 items-center flex-wrap">
        <div className="flex gap-1.5 items-center">
          <span className="bg-primary/15 text-primary px-2 py-0.5 rounded-full font-bold text-[11px]">
            {result.Seeders} <span className="opacity-70 font-normal">seeds</span>
          </span>
          <span className="bg-secondary/50 text-secondary-foreground px-2 py-0.5 rounded-full font-medium text-[11px]">
            {convertSizeToGB(result.Size)}
          </span>
          {result.Leechers !== null && (
            <span className="text-muted-foreground text-[11px]">
              {result.Leechers} leech
            </span>
          )}
        </div>
        <span className="truncate text-[10px] font-medium text-muted-foreground uppercase tracking-wider max-w-[90px] text-right">
          {result.IndexerId}
        </span>
      </div>

      <div className="flex gap-2 pt-1 mt-auto">
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2 min-w-0 flex-1 rounded-lg border-border/50 bg-background/50 text-[11px] font-medium hover:bg-secondary"
          onClick={() => window.open(result.Details, "_blank")}
        >
          <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 mr-1.5 text-muted-foreground" />
          <span className="truncate">Source</span>
        </Button>
        <Button
          variant="default"
          size="sm"
          className="h-8 px-2 min-w-0 flex-1 rounded-lg text-[11px] font-semibold shadow-sm transition-all active:scale-95"
          onClick={() => {
            if (result.Link?.startsWith("magnet:")) {
              onCopy("magnet", result.Link);
            } else {
              window.open(result.Link, "_blank");
            }
          }}
        >
          {renderMagetButton(result.Link)}
          <span className="ml-1.5 truncate">Download</span>
        </Button>
      </div>
    </div>
  );
}
