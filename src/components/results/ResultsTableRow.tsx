import { ExternalLink, Magnet } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { JackettSearchResult } from "@/lib/searchUtils";
import { convertSizeToGB } from "@/lib/searchUtils";

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
      <div
        className="col-span-5 font-medium text-foreground/90 break-all"
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
          onClick={() => {
            if (result.Link?.startsWith("magnet:")) {
              onCopy("magnet", result.Link);
            } else {
              onCopy("magnet", result.Link);
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
          className="h-8 w-8 hover:scale-110 transition-transform shadow-sm"
          onClick={() => {
            onCopy("source", result.Details);
            window.open(result.Details, "_blank");
          }}
        >
          <ExternalLink className="h-3 w-3" />
        </Button>
      </div>
      <div className="col-span-3 flex items-center gap-2 min-w-0">
        <span
          className="truncate text-muted-foreground group-hover:text-foreground transition-colors"
          title={result.IndexerId}
        >
          {result.IndexerId}
        </span>
      </div>
    </div>
  );
}
