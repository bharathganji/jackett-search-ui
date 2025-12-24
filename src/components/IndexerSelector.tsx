import { useState } from "react";

import { Check, ChevronDown, Globe, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
    <Card className="border-border bg-background/40 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden transition-all duration-500 animate-fadeIn">
      <CardHeader className="pb-3 border-b border-border/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Globe className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-bold tracking-tight text-foreground/80 uppercase text-[11px]">
              Indexers ({indexers.length})
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0 rounded-full hover:bg-primary/10 transition-colors"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-500 ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </Button>
        </div>

        {/* Search Mode Toggle */}
        <div className="flex gap-2">
          <Button
            variant={
              selectionState.searchMode === "all" ? "default" : "outline"
            }
            size="sm"
            onClick={() => handleModeChange("all")}
            className={`flex-1 flex items-center justify-center gap-2 h-9 rounded-xl transition-all duration-300 ${
              selectionState.searchMode === "all"
                ? "bg-gradient-to-r from-primary to-cyan-600 border-none text-white font-semibold"
                : "border-border/50 hover:border-primary/30 hover:bg-primary/5"
            }`}
          >
            <Search className="h-3.5 w-3.5" />
            <span className="text-xs">All Indexers</span>
          </Button>
          <Button
            variant={
              selectionState.searchMode === "selected" ? "default" : "outline"
            }
            size="sm"
            onClick={() => handleModeChange("selected")}
            className={`flex-1 flex items-center justify-center gap-2 h-9 rounded-xl transition-all duration-300 ${
              selectionState.searchMode === "selected"
                ? "bg-gradient-to-r from-primary to-cyan-600 border-none text-white font-semibold"
                : "border-border/50 hover:border-primary/30 hover:bg-primary/5"
            }`}
            disabled={selectionState.selectedIndexers.length === 0}
          >
            <Check className="h-3.5 w-3.5" />
            <span className="text-xs">
              Selected ({selectionState.selectedIndexers.length})
            </span>
          </Button>
        </div>
      </CardHeader>

      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          isExpanded ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <CardContent className="pt-6">
          <div className="space-y-6">
            {/* Search and Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 group">
                <Input
                  placeholder="Filter indexers..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="h-10 pl-10 bg-secondary/20 border-border/40 focus:border-primary/50 focus:ring-primary/10 transition-all rounded-xl"
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="px-4 bg-secondary/10 border-border/40 hover:border-primary/30 hover:bg-primary/10 rounded-xl transition-all font-medium text-xs"
                >
                  All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectNone}
                  className="px-4 bg-secondary/10 border-border/40 hover:border-primary/30 hover:bg-primary/10 rounded-xl transition-all font-medium text-xs"
                >
                  None
                </Button>
              </div>
            </div>

            {/* Indexer List */}
            <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {filteredIndexers.map((indexer) => {
                  const isSelected = selectionState.selectedIndexers.includes(
                    indexer.id
                  );
                  return (
                    <div
                      key={indexer.id}
                      role="button"
                      tabIndex={0}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${
                        isSelected
                          ? "bg-primary/10 border-primary/40 scale-[1.01]"
                          : "bg-secondary/10 border-transparent hover:border-primary/30 hover:bg-secondary/20"
                      }`}
                      onClick={() => handleIndexerToggle(indexer.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleIndexerToggle(indexer.id);
                        }
                      }}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-300 ${
                            isSelected
                              ? "bg-primary border-primary"
                              : "border-muted-foreground/30"
                          }`}
                        >
                          {isSelected && (
                            <Check className="h-3.5 w-3.5 text-primary-foreground stroke-[3px] animate-scaleIn" />
                          )}
                        </div>
                        <span
                          className={`text-sm font-medium truncate transition-colors ${isSelected ? "text-primary" : "text-foreground/90"}`}
                        >
                          {indexer.id}
                        </span>
                      </div>
                      <a
                        href={indexer.site_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-muted-foreground hover:text-primary hover:bg-primary/10 p-1.5 rounded-full transition-all"
                      >
                        <Globe className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Summary */}
            {selectionState.selectedIndexers.length > 0 && (
              <div className="pt-4 border-t border-border/20">
                <div className="flex flex-wrap gap-2">
                  {selectionState.selectedIndexers.slice(0, 15).map((id) => (
                    <Badge
                      key={id}
                      variant="outline"
                      className="px-3 py-1 bg-primary/10 border-primary/20 text-primary font-bold text-[10px] hover:bg-primary/20 transition-all rounded-full"
                    >
                      {id}
                    </Badge>
                  ))}
                  {selectionState.selectedIndexers.length > 15 && (
                    <Badge
                      variant="outline"
                      className="px-3 py-1 bg-secondary/20 border-border/50 text-[10px] font-bold text-muted-foreground rounded-full"
                    >
                      +{selectionState.selectedIndexers.length - 15} MORE
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
