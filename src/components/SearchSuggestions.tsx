import { Clock, Info, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { useRecentSearches } from "../hooks/useRecentSearches";

interface SearchSuggestionsProps {
  onSuggestionClick: (suggestion: string) => void;
  className?: string;
}

export function SearchSuggestions({
  onSuggestionClick,
  className = "",
}: SearchSuggestionsProps) {
  const { recentSearches, removeFromRecentSearches } = useRecentSearches();

  // Popular search suggestions
  const popularSuggestions = [
    "Batman",
    "Marvel",
    "Game of Thrones",
    "The Office",
    "Breaking Bad",
    "Ubuntu",
    "Windows 11",
    "Adobe",
    "4K movies",
    "REMUX",
  ];

  const handleSuggestionClick = (suggestion: string) => {
    onSuggestionClick(suggestion);
  };

  return (
    <Card
      className={`border-border bg-background shadow rounded-lg overflow-hidden ${className}`}
    >
      <CardContent className="p-6">
        <div className="space-y-8">
          {/* Onboarding Tip - shown when no recent searches */}
          {recentSearches.length === 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4 group/header">
                <div className="p-2 bg-muted/50 rounded-lg">
                  <Info className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-sm font-bold tracking-tight text-foreground/80 uppercase text-[11px]">
                  Tip
                </span>
                <div className="h-[1px] flex-1 bg-border" />
              </div>
              <div className="px-4 py-2 bg-muted/30 border border-border/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Press{" "}
                  <kbd className="px-1.5 py-0.5 text-xs font-mono bg-background border border-border rounded">
                    /
                  </kbd>{" "}
                  to focus search from anywhere
                </p>
                 <p className="text-sm text-muted-foreground mt-1">
                   Use fuzzy terms like{" "}
                   <span className="font-medium text-foreground">720p</span> or a{" "}
                   <span className="font-medium text-foreground">year</span> to filter results
                 </p>
              </div>
            </div>
          )}

          {/* Recent Searches section */}
          {recentSearches.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4 group/header">
                <div className="p-2 bg-muted rounded-lg group-hover/header:bg-muted transition-colors duration-300">
                  <Clock className="h-4 w-4 text-foreground" />
                </div>
                <span className="text-sm font-bold tracking-tight text-foreground/80 uppercase text-[11px]">
                  Recent Activity
                </span>
                <div className="h-[1px] flex-1 bg-border" />
              </div>
              <div className="flex flex-wrap gap-2.5">
                {recentSearches.map((search, index) => (
                  <div key={index} className="group relative">
                    <div
                      className="flex items-center gap-2 pl-4 pr-2 py-2 bg-muted/50 hover:bg-muted border border-border rounded-full cursor-pointer transition-all duration-300"
                      onClick={() => handleSuggestionClick(search)}
                    >
                      <span className="text-sm font-medium text-foreground max-w-[150px] truncate">
                        {search}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full hover:bg-destructive/20 hover:text-destructive opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromRecentSearches(search);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Popular Suggestions section */}
          <div>
            <div className="flex items-center gap-3 mb-4 group/header">
              <div className="p-2 bg-muted rounded-lg group-hover/header:bg-muted transition-colors duration-300">
                <Search className="h-4 w-4 text-foreground" />
              </div>
              <span className="text-sm font-bold tracking-tight text-foreground/80 uppercase text-[11px]">
                Trending Topics
              </span>
              <div className="h-[1px] flex-1 bg-border" />
            </div>
            <div className="flex flex-wrap gap-2.5">
              {popularSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="px-4 py-2 bg-muted border border-border rounded-full cursor-pointer transition-all duration-300 text-sm font-medium text-foreground"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
