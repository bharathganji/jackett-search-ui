import { ExternalLink, Magnet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { convertSizeToGB } from "@/lib/searchUtils";
import type { JackettSearchResult } from "@/types/search";

interface ResultsTableRowProps {
  result: JackettSearchResult;
  onCopy: (type: "magnet" | "source", content: string) => void;
}

export function ResultsTableRow({
  result,
  onCopy,
}: Readonly<ResultsTableRowProps>) {
  const renderMagetButton = (Link: string) => {
    if (Link?.startsWith("magnet:")) {
      return <Magnet className="h-4 w-4" />;
    } else {
      return <ExternalLink className="h-4 w-4" />;
    }
  };

  return (
    <div className="grid grid-cols-12 gap-2 p-2 border-b border-border/50 hover:bg-muted/50 items-center text-sm min-h-[60px] transition-colors group">
      <div
        className="col-span-5 font-semibold text-foreground/90 break-all pl-2"
        title={result.Title}
      >
        {result.Title}
      </div>
      <div className="col-span-1 text-center font-bold flex-shrink-0 text-primary bg-primary/10 rounded-full py-1">
        {result.Seeders}
      </div>
      <div className="col-span-1 text-center flex-shrink-0 text-muted-foreground font-medium">
        {result.Leechers ?? "--"}
      </div>
      <div className="col-span-2 text-center flex-shrink-0 text-muted-foreground font-medium bg-secondary/30 rounded-full py-1">
        {convertSizeToGB(result.Size)}
      </div>
      <div className="col-span-1 flex justify-center flex-shrink-0">
        <Button
          variant="secondary"
          size="icon"
          className="h-9 w-9 rounded-full hover:scale-110 transition-transform hover:bg-primary hover:text-primary-foreground shadow-sm bg-background border border-border"
          onClick={() => {
            if (result.Link?.startsWith("magnet:")) {
              onCopy("magnet", result.Link);
            } else {
              window.open(result.Link, "_blank");
            }
          }}
        >
          {renderMagetButton(result.Link)}
        </Button>
      </div>
      <div className="col-span-1 flex justify-center flex-shrink-0">
        <Button
          variant="default"
          size="icon"
          className="h-9 w-9 rounded-full hover:scale-110 transition-transform shadow-md bg-primary/90 hover:bg-primary text-primary-foreground"
          onClick={() => window.open(result.Details, "_blank")}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
      <div className="col-span-1 flex items-center gap-2 min-w-0 pr-3">
        <span
          className="truncate text-muted-foreground/80 font-medium group-hover:text-primary transition-colors text-right w-full"
          title={result.IndexerId}
        >
          {result.IndexerId}
        </span>
      </div>
    </div>
  );
}
