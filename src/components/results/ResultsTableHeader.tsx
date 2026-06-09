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
        className="col-span-4 cursor-pointer hover:text-primary truncate transition-colors"
        onClick={() => onSort("Title")}
        role="button"
        tabIndex={0}
        aria-label="Sort by Title"
        aria-sort={
          sortField === "Title"
            ? sortDirection === "asc"
              ? "ascending"
              : "descending"
            : "none"
        }
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSort("Title");
          }
        }}
      >
        Title {sortField === "Title" && (sortDirection === "asc" ? "↑" : "↓")}
      </div>
      <div
        className="col-span-1 cursor-pointer hover:text-primary text-center flex-shrink-0 transition-colors"
        onClick={() => onSort("Relevance")}
        role="button"
        tabIndex={0}
        aria-label="Sort by Relevance"
        aria-sort={
          sortField === "Relevance"
            ? sortDirection === "asc"
              ? "ascending"
              : "descending"
            : "none"
        }
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSort("Relevance");
          }
        }}
      >
        Rel {sortField === "Relevance" && (sortDirection === "asc" ? "↑" : "↓")}
      </div>
      <div
        className="col-span-2 cursor-pointer hover:text-primary text-center flex-shrink-0 transition-colors"
        onClick={() => onSort("Seeders")}
        role="button"
        tabIndex={0}
        aria-label="Sort by Seeds"
        aria-sort={
          sortField === "Seeders"
            ? sortDirection === "asc"
              ? "ascending"
              : "descending"
            : "none"
        }
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSort("Seeders");
          }
        }}
      >
        Seeds · Leechers{" "}
        {sortField === "Seeders" && (sortDirection === "asc" ? "↑" : "↓")}
      </div>
      <div
        className="col-span-2 cursor-pointer hover:text-primary text-center flex-shrink-0 transition-colors"
        onClick={() => onSort("Size")}
        role="button"
        tabIndex={0}
        aria-label="Sort by Size"
        aria-sort={
          sortField === "Size"
            ? sortDirection === "asc"
              ? "ascending"
              : "descending"
            : "none"
        }
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSort("Size");
          }
        }}
      >
        Size {sortField === "Size" && (sortDirection === "asc" ? "↑" : "↓")}
      </div>
      <div className="col-span-1 text-center flex-shrink-0">Actions</div>
      <div className="col-span-1 text-center flex-shrink-0">Link</div>
      <div
        className="col-span-1 cursor-pointer hover:text-primary truncate transition-colors text-right pr-2"
        onClick={() => onSort("IndexerId")}
        role="button"
        tabIndex={0}
        aria-label="Sort by Indexer"
        aria-sort={
          sortField === "IndexerId"
            ? sortDirection === "asc"
              ? "ascending"
              : "descending"
            : "none"
        }
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSort("IndexerId");
          }
        }}
      >
        Indexer{" "}
        {sortField === "IndexerId" && (sortDirection === "asc" ? "↑" : "↓")}
      </div>
    </div>
  );
}
