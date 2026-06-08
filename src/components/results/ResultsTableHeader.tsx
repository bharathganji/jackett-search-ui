import type { JackettSearchResult } from "@/types/search";

interface ResultsTableHeaderProps {
  sortField: keyof JackettSearchResult;
  sortDirection: "asc" | "desc";
  onSort: (field: keyof JackettSearchResult) => void;
}

export function ResultsTableHeader({
  sortField,
  sortDirection,
  onSort,
}: ResultsTableHeaderProps) {
  return (
    <div className="hidden sm:grid grid-cols-12 gap-2 p-2 border-b font-medium text-sm overflow-hidden bg-muted/30 rounded-t-lg">
      <div
        className="col-span-5 cursor-pointer hover:text-primary truncate transition-colors"
        onClick={() => onSort("Title")}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSort("Title");
          }
        }}
      >
        Title {sortField === "Title" && (sortDirection === "asc" ? "↑" : "↓")}
      </div>
      <div className="col-span-1 text-center flex-shrink-0">Seeds</div>
      <div className="col-span-1 text-center flex-shrink-0">Size</div>
      <div className="col-span-1 text-center flex-shrink-0">Copy</div>
      <div className="col-span-1 text-center flex-shrink-0">Open</div>
      <div className="col-span-1 text-center flex-shrink-0">Copy</div>
      <div className="col-span-1 text-center flex-shrink-0">Open</div>
      <div className="col-span-1 text-right flex-shrink-0 pr-2">Indexer</div>
    </div>
  );
}
