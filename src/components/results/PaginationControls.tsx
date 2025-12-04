import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalResults: number;
  onPageChange: (page: number) => void;
}

export function PaginationControls({
  currentPage,
  totalPages,
  totalResults,
  onPageChange,
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between mt-4 pt-4 border-t gap-4 animate-fadeIn">
      <div className="text-sm text-muted-foreground order-2 sm:order-1">
        Page {currentPage} of {totalPages} ({totalResults} total results)
      </div>
      <div className="flex items-center gap-2 order-1 sm:order-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="flex items-center gap-1 hover:bg-primary/10 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Previous</span>
        </Button>
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
            const pageNum =
              Math.max(1, Math.min(totalPages - 2, currentPage - 1)) + i;
            return (
              <Button
                key={pageNum}
                variant={pageNum === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNum)}
                className={`w-8 h-8 p-0 transition-all ${
                  pageNum === currentPage
                    ? "bg-primary shadow-md hover:scale-110"
                    : "hover:bg-primary/10"
                }`}
              >
                {pageNum}
              </Button>
            );
          })}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 hover:bg-primary/10 transition-colors"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
