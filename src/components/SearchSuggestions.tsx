import { Clock, Search, X } from "lucide-react";

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
      className={`border-border/40 bg-background/40 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden transition-all duration-500 ${className}`}
    >
      <CardContent className="p-6">
        <div className="space-y-8">
          {/* Recent Searches section */}
          {recentSearches.length > 0 && (
            <div className="animate-slideDown">
              <div className="flex items-center gap-3 mb-4 group/header">
                <div className="p-2 bg-primary/10 rounded-lg group-hover/header:bg-primary/20 transition-colors duration-300">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-bold tracking-tight text-foreground/80 uppercase text-[11px]">
                  Recent Activity
                </span>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-border/50 to-transparent"></div>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {recentSearches.map((search, index) => (
                  <div key={index} className="group relative">
                    <div
                      className="flex items-center gap-2 pl-4 pr-2 py-2 bg-secondary/30 hover:bg-secondary/60 backdrop-blur-md border border-border/50 rounded-full cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg hover:border-primary/30"
                      onClick={() => handleSuggestionClick(search)}
                    >
                      <span className="text-sm font-medium text-foreground/90 max-w-[150px] truncate">
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
          <div className="animate-slideUp">
            <div className="flex items-center gap-3 mb-4 group/header">
              <div className="p-2 bg-cyan-600/10 rounded-lg group-hover/header:bg-cyan-600/20 transition-colors duration-300">
                <Search className="h-4 w-4 text-cyan-600" />
              </div>
              <span className="text-sm font-bold tracking-tight text-foreground/80 uppercase text-[11px]">
                Trending Topics
              </span>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-border/50 to-transparent"></div>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {popularSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="px-4 py-2 bg-primary/5 hover:bg-primary/10 backdrop-blur-sm border border-primary/10 hover:border-primary/30 rounded-full cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-md text-sm font-medium text-primary/80 hover:text-primary"
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
