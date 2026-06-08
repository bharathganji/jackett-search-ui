import { Copy, ExternalLink, Magnet } from "lucide-react";

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
    <div className="grid grid-cols-12 gap-2 p-2 border-b hover:bg-muted/50 items-center text-sm min-h-[60px] transition-colors duration-200 group animate-slideUp">
      <div className="col-span-5 font-medium text-foreground/90 break-all"
        title={result.Title}
      >
        {result.Title}
      </div>
      <div className="col-span-1 text-center font-medium flex-shrink-0 text-primary">
        {result.Seeders}
      </div>
      <div className="col-span-1 text-center flex-shrink-0 text-muted-foreground">
        {convertSizeToGB(result.Size)}
      </div>
      <div className="col-span-1 flex justify-center flex-shrink-0">
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 hover:scale-110 transition-transform hover:bg-primary hover:text-primary-foreground shadow-sm"
          onClick={() => onCopy("magnet", result.Link)}
          title="Copy magnet link"
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
      <div className="col-span-1 flex justify-center gap-1 flex-shrink-0">
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 hover:scale-110 transition-transform hover:bg-primary hover:text-primary-foreground shadow-sm"
          onClick={() => window.open(result.Link, "_blank")}
          title={result.Link?.startsWith("magnet:") ? "Open magnet" : "Open link"}
        >
          {renderMagetButton(result.Link)}
        </Button>
      </div>
      <div className="col-span-1 flex justify-center flex-shrink-0">
        <Button
          variant="default"
          size="icon"
          className="h-8 w-8 hover:scale-110 transition-transform shadow-sm"
          onClick={() => onCopy("source", result.Details)}
          title="Copy source link"
        >
          <Copy className="h-3 w-3" />
        </Button>
      </div>
      <div className="col-span-1 flex justify-center flex-shrink-0">
        <Button
          variant="default"
          size="icon"
          className="h-8 w-8 hover:scale-110 transition-transform shadow-sm"
          onClick={() => window.open(result.Details, "_blank")}
          title="Open source"
        >
          <ExternalLink className="h-3 w-3" />
        </Button>
      </div>
      <div className="col-span-2 flex items-center gap-2 min-w-0 pr-2">
        <span
          className="truncate text-muted-foreground group-hover:text-foreground transition-colors text-right w-full"
          title={result.IndexerId}
        >
          {result.IndexerId}
        </span>
      </div>
    </div>
  );
}
