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
    <div className="p-2.5 border-b hover:bg-muted/50 flex flex-col gap-1.5 transition-colors active:bg-muted/30">
      <div
        className="font-medium text-foreground/90 break-all leading-snug text-sm"
        title={result.Title}
      >
        {result.Title}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground gap-2 flex-wrap items-center">
        <div className="flex gap-2 items-center">
          <span className="flex-shrink-0 bg-primary/10 px-1.5 py-0.5 rounded text-primary font-medium">
            {result.Seeders} seeds
          </span>
          <span className="flex-shrink-0">{convertSizeToGB(result.Size)}</span>
          {result.Leechers !== null && (
            <span className="flex-shrink-0">{result.Leechers} leechers</span>
          )}
        </div>
        <div className="truncate max-w-[100px]">{result.IndexerId}</div>
      </div>
      <div className="flex gap-1 pt-0.5">
        <Button
          variant="default"
          size="sm"
          className="h-7 px-2 min-w-0 shadow-sm hover:scale-[1.02] transition-transform text-[10px] flex-1"
          onClick={() => window.open(result.Details, "_blank")}
        >
          <ExternalLink className="h-3 w-3 flex-shrink-0 mr-1" />
          <span className="truncate">Source</span>
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="h-7 px-2 min-w-0 shadow-sm hover:scale-[1.02] transition-transform hover:bg-primary hover:text-primary-foreground text-[10px] flex-1"
          onClick={() => {
            if (result.Link?.startsWith("magnet:")) {
              onCopy("magnet", result.Link);
            } else {
              window.open(result.Link, "_blank");
            }
          }}
        >
          {renderMagetButton(result.Link)}
          <span className="ml-1 truncate">Magnet</span>
        </Button>
      </div>
    </div>
  );
}
