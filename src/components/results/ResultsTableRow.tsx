import { Check, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { convertSizeToGB } from "@/lib/searchUtils";
import { getSafeUrl } from "@/lib/utils";
import type { JackettSearchResult } from "@/types/search";

import { DownloadLinkIcon } from "./DownloadLinkIcon";

export interface CopiedAction {
  id: string;
  type: "magnet" | "source";
}

interface ResultsTableRowProps {
  result: JackettSearchResult;
  copiedAction: CopiedAction | null;
  onCopy: (type: "magnet" | "source", content: string, id: string) => void;
}

export function ResultsTableRow({
  result,
  copiedAction,
  onCopy,
}: Readonly<ResultsTableRowProps>) {
  const rowId =
    result.InfoHash || result.Link || `${result.Title}-${result.IndexerId}`;
  const isMagnetCopied =
    copiedAction?.id === rowId && copiedAction?.type === "magnet";
  const isSourceCopied =
    copiedAction?.id === rowId && copiedAction?.type === "source";

  return (
    <div className="grid grid-cols-12 gap-2 p-2.5 border-b border-border/50 hover:bg-muted/50 items-center text-sm min-h-[60px] transition-colors group">
      {/* Title */}
      <div
        className="col-span-5 font-semibold text-foreground/90 leading-snug line-clamp-2 break-words pl-2"
        title={result.Title}
      >
        {result.Title}
      </div>

      {/* Seeders */}
      <div className="col-span-1 text-center font-bold flex-shrink-0 text-primary bg-primary/10 rounded-full py-1 font-mono tabular-nums">
        {result.Seeders}
      </div>

      {/* Leechers */}
      <div className="col-span-1 text-center flex-shrink-0 text-muted-foreground font-medium font-mono tabular-nums">
        {result.Leechers ?? "--"}
      </div>

      {/* Size */}
      <div className="col-span-2 text-center flex-shrink-0 text-muted-foreground font-medium bg-secondary/30 rounded-full py-1 font-mono tabular-nums">
        {convertSizeToGB(result.Size)}
      </div>

      {/* Download / Magnet Action */}
      <div className="col-span-1 flex justify-center flex-shrink-0">
        <Button
          variant="secondary"
          size="icon"
          aria-label={
            isMagnetCopied
              ? "Magnet link copied to clipboard"
              : `Copy magnet link for ${result.Title}`
          }
          className={`h-9 w-9 rounded-full transition-all duration-200 shadow-sm border ${
            isMagnetCopied
              ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-600 dark:text-emerald-400 scale-105"
              : "bg-background border-border hover:scale-110 hover:bg-primary hover:text-primary-foreground"
          }`}
          onClick={() => {
            if (result.Link?.startsWith("magnet:")) {
              onCopy("magnet", result.Link, rowId);
            } else {
              const safeUrl = getSafeUrl(result.Link);
              if (safeUrl !== "#") {
                window.open(safeUrl, "_blank", "noopener,noreferrer");
              }
            }
          }}
        >
          {isMagnetCopied ? (
            <Check className="h-4 w-4 animate-in zoom-in-50 duration-200" />
          ) : (
            <DownloadLinkIcon link={result.Link} />
          )}
        </Button>
        <span className="sr-only" aria-live="polite">
          {isMagnetCopied ? "Magnet link copied to clipboard" : ""}
        </span>
      </div>

      {/* Details Link Action */}
      <div className="col-span-1 flex justify-center flex-shrink-0">
        <Button
          variant="default"
          size="icon"
          aria-label={
            isSourceCopied
              ? "Source link copied"
              : `Open source details for ${result.Title}`
          }
          className={`h-9 w-9 rounded-full transition-all duration-200 shadow-md ${
            isSourceCopied
              ? "bg-emerald-500 text-white scale-105"
              : "bg-primary/90 hover:bg-primary text-primary-foreground hover:scale-110"
          }`}
          onClick={() => {
            const safeUrl = getSafeUrl(result.Details);
            if (safeUrl !== "#") {
              window.open(safeUrl, "_blank", "noopener,noreferrer");
            }
          }}
        >
          {isSourceCopied ? (
            <Check className="h-4 w-4 animate-in zoom-in-50 duration-200" />
          ) : (
            <ExternalLink className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Indexer */}
      <div className="col-span-1 flex items-center justify-end min-w-0 pr-3">
        <span
          className="truncate text-xs text-muted-foreground/80 font-medium group-hover:text-primary transition-colors text-right w-full"
          title={result.IndexerId}
        >
          {result.IndexerId}
        </span>
      </div>
    </div>
  );
}
