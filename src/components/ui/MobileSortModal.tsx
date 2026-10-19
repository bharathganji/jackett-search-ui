import { useState } from "react";

import { ArrowDown, ArrowUp, ChevronDown } from "lucide-react";

import { Button } from "./button";
import { Card } from "./card";

export interface SortOption {
  key: string;
  label: string;
  direction?: "asc" | "desc";
}

interface MobileSortModalProps {
  currentSort: string;
  currentDirection: "asc" | "desc";
  onSort: (field: string, direction: "asc" | "desc") => void;
  options: SortOption[];
}

export function MobileSortModal({
  currentSort,
  currentDirection,
  onSort,
  options,
}: MobileSortModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentOption = options.find((opt) => opt.key === currentSort);
  const sortLabel = currentOption
    ? `${currentOption.label} (${currentDirection === "asc" ? "↑" : "↓"})`
    : "Sort By";

  const handleSort = (key: string) => {
    if (key === currentSort) {
      // Toggle direction for same field
      onSort(key, currentDirection === "asc" ? "desc" : "asc");
    } else {
      // Default to desc for new field
      onSort(key, "desc");
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 min-w-[120px] justify-between"
      >
        <span className="text-sm truncate">{sortLabel}</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <Card className="absolute top-full left-0 right-0 mt-1 z-50 shadow-lg border bg-background">
            <div className="p-2">
              <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
                Sort By
              </div>
              {options.map((option) => {
                const isSelected = option.key === currentSort;

                return (
                  <Button
                    key={option.key}
                    variant={isSelected ? "secondary" : "ghost"}
                    className={`w-full justify-between text-left h-10 px-3 mb-1 last:mb-0 rounded-md transition-all ${
                      isSelected ? "bg-primary/10 hover:bg-primary/20" : "hover:bg-muted"
                    }`}
                    onClick={() => handleSort(option.key)}
                  >
                    <span className={`text-sm ${isSelected ? "font-bold text-primary" : "text-foreground"}`}>
                      {option.label}
                    </span>
                    {isSelected && (
                      currentDirection === "asc" ? (
                        <ArrowUp className="h-4 w-4 text-primary" />
                      ) : (
                        <ArrowDown className="h-4 w-4 text-primary" />
                      )
                    )}
                  </Button>
                );
              })}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
