import { Check, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { convertSizeToGB } from "@/lib/searchUtils";
import { getSafeUrl } from "@/lib/utils";
import type { JackettSearchResult } from "@/types/search";

import { DownloadLinkIcon } from "./DownloadLinkIcon";
import type { CopiedAction } from "./ResultsTableRow";

interface ResultsMobileCardProps {
  result: JackettSearchResult;
  copiedAction: CopiedAction | null;
  onCopy: (type: "magnet" | "source", content: string, id: string) => void;
}

export function ResultsMobileCard({
  result,
  copiedAction,
  onCopy,
}: ResultsMobileCardProps) {
  const rowId =
    result.InfoHash || result.Link || `${result.Title}-${result.IndexerId}`;
  const isMagnetCopied =
    copiedAction?.id === rowId && copiedAction?.type === "magnet";
  const isSourceCopied =
    copiedAction?.id === rowId && copiedAction?.type === "source";

  return (
    <div className="p-3 border-b border-border/50 hover:bg-muted/40 flex flex-col gap-2.5 transition-colors active:bg-muted/30">
      {/* Title */}
      <div
        className="font-semibold text-foreground/90 text-sm leading-snug line-clamp-2 break-words"
        title={result.Title}
      >
        {result.Title}
      </div>

      {/* Metadata Pill Row */}
      <div className="flex justify-between text-xs text-muted-foreground gap-2 flex-wrap items-center">
        <div className="flex gap-2 items-center flex-wrap">
          <span className="flex-shrink-0 bg-primary/15 px-2 py-0.5 rounded-full text-primary font-bold font-mono tabular-nums">
            {result.Seeders} seeds
          </span>
          <span className="flex-shrink-0 bg-secondary/50 px-2 py-0.5 rounded-full text-foreground/80 font-mono tabular-nums">
            {convertSizeToGB(result.Size)}
          </span>
          {result.Leechers !== null && (
            <span className="flex-shrink-0 bg-secondary/30 px-2 py-0.5 rounded-full text-muted-foreground font-mono tabular-nums">
              {result.Leechers} leeches
            </span>
          )}
        </div>
        <div className="truncate text-xs font-medium text-muted-foreground/90 ml-auto">
          {result.IndexerId}
        </div>
      </div>

      {/* Actions (44px Minimum Touch Targets) */}
      <div className="flex gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          aria-label={
            isSourceCopied
              ? "Source opened"
              : `View details for ${result.Title}`
          }
          className="min-h-[44px] h-11 px-3 text-xs font-semibold shadow-sm hover:scale-[1.01] transition-transform flex-1 border-border/70"
          onClick={() => {
            const safeUrl = getSafeUrl(result.Details);
            if (safeUrl !== "#") {
              window.open(safeUrl, "_blank", "noopener,noreferrer");
            }
          }}
        >
          {isSourceCopied ? (
            <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mr-1.5 animate-in zoom-in-50" />
          ) : (
            <ExternalLink className="h-4 w-4 mr-1.5" />
          )}
          <span>Source</span>
        </Button>

        <Button
          variant={isMagnetCopied ? "default" : "secondary"}
          size="sm"
          aria-label={
            isMagnetCopied
              ? "Magnet copied to clipboard"
              : `Copy magnet link for ${result.Title}`
          }
          className={`min-h-[44px] h-11 px-3 text-xs font-semibold shadow-sm hover:scale-[1.01] transition-transform flex-1 ${
            isMagnetCopied
              ? "bg-emerald-600 hover:bg-emerald-600 text-white"
              : "hover:bg-primary hover:text-primary-foreground border border-border/60"
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
            <>
              <Check className="h-4 w-4 mr-1.5 animate-in zoom-in-50" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <DownloadLinkIcon link={result.Link} />
              <span className="ml-1.5">Magnet</span>
            </>
          )}
        </Button>
      </div>

      <span className="sr-only" aria-live="polite">
        {isMagnetCopied ? "Magnet link copied to clipboard" : ""}
      </span>
    </div>
  );
}
