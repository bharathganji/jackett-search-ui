import { useState } from "react";

import { Check, ChevronDown, Globe, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import type { Indexer, IndexerSelectionState } from "../types/indexer";
import { ErrorDisplay } from "./ErrorDisplay";
import { LoadingState } from "./LoadingState";

interface IndexerSelectorProps {
  indexers: Indexer[];
  loading: boolean;
  error: string | null;
  selectionState: IndexerSelectionState;
  onSelectionChange: (state: IndexerSelectionState) => void;
  onRefetch: () => void;
}

export function IndexerSelector({
  indexers,
  loading,
  error,
  selectionState,
  onSelectionChange,
  onRefetch,
}: IndexerSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");

  const filteredIndexers = indexers.filter((indexer) =>
    indexer.id.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const handleIndexerToggle = (indexerId: string) => {
    const isSelected = selectionState.selectedIndexers.includes(indexerId);
    const newSelected = isSelected
      ? selectionState.selectedIndexers.filter((id) => id !== indexerId)
      : [...selectionState.selectedIndexers, indexerId];

    onSelectionChange({
      ...selectionState,
      selectedIndexers: newSelected,
    });
  };

  const handleSelectAll = () => {
    onSelectionChange({
      ...selectionState,
      selectedIndexers: indexers.map((i) => i.id),
    });
  };

  const handleSelectNone = () => {
    onSelectionChange({
      ...selectionState,
      selectedIndexers: [],
    });
  };

  const handleModeChange = (mode: "all" | "selected") => {
    onSelectionChange({
      ...selectionState,
      searchMode: mode,
    });
  };

  if (loading) {
    return <LoadingState message="Loading indexers..." />;
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={onRefetch} />;
  }

  return (
    <Card className="w-full animate-fadeIn">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <span>Indexers ({indexers.length})</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="hover:bg-primary/10 transition-colors"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-300 ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </Button>
        </CardTitle>

        {/* Search Mode Toggle */}
        <div className="flex gap-2">
          <Button
            variant={
              selectionState.searchMode === "all" ? "default" : "outline"
            }
            size="sm"
            onClick={() => handleModeChange("all")}
            className={`flex items-center gap-1 transition-all duration-200 ${
              selectionState.searchMode === "all"
                ? "bg-primary shadow-md hover:scale-105"
                : "hover:bg-primary/5"
            }`}
          >
            <Search className="h-3 w-3" />
            All Indexers
          </Button>
          <Button
            variant={
              selectionState.searchMode === "selected" ? "default" : "outline"
            }
            size="sm"
            onClick={() => handleModeChange("selected")}
            className={`flex items-center gap-1 transition-all duration-200 ${
              selectionState.searchMode === "selected"
                ? "bg-primary shadow-md hover:scale-105"
                : "hover:bg-primary/5"
            }`}
            disabled={selectionState.selectedIndexers.length === 0}
          >
            <Check className="h-3 w-3" />
            Selected ({selectionState.selectedIndexers.length})
          </Button>
        </div>
      </CardHeader>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <CardContent className="pt-0">
          <div className="space-y-4">
            {/* Search and Controls */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Filter indexers..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="flex-1 focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="hover:bg-primary/10 transition-colors"
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectNone}
                  className="hover:bg-primary/10 transition-colors"
                >
                  Select None
                </Button>
              </div>
            </div>

            {/* Indexer List */}
            <div className="max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {filteredIndexers.map((indexer) => {
                  const isSelected = selectionState.selectedIndexers.includes(
                    indexer.id
                  );
                  return (
                    <div
                      key={indexer.id}
                      role="button"
                      tabIndex={0}
                      className={`flex items-center justify-between p-2 rounded border cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? "bg-primary/10 border-primary shadow-sm scale-[1.02]"
                          : "hover:bg-muted/50 hover:border-primary/30"
                      }`}
                      onClick={() => handleIndexerToggle(indexer.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleIndexerToggle(indexer.id);
                        }
                      }}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors duration-200 ${
                            isSelected
                              ? "bg-primary border-primary"
                              : "border-muted-foreground group-hover:border-primary"
                          }`}
                        >
                          {isSelected && (
                            <Check className="h-3 w-3 text-primary-foreground animate-scaleIn" />
                          )}
                        </div>
                        <span className="text-sm truncate" title={indexer.id}>
                          {indexer.id}
                        </span>
                      </div>
                      <a
                        href={indexer.site_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-muted-foreground hover:text-primary transition-colors p-1 hover:bg-primary/10 rounded-full"
                      >
                        <Globe className="h-3 w-3" />
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Summary */}
            {selectionState.selectedIndexers.length > 0 && (
              <div className="pt-2 border-t animate-slideUp">
                <div className="flex flex-wrap gap-1">
                  {selectionState.selectedIndexers.slice(0, 10).map((id) => (
                    <Badge
                      key={id}
                      variant="secondary"
                      className="text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                      {id}
                    </Badge>
                  ))}
                  {selectionState.selectedIndexers.length > 10 && (
                    <Badge variant="secondary" className="text-xs">
                      +{selectionState.selectedIndexers.length - 10} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
