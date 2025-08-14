import { useEffect, useState } from "react";

import { Clock, Search, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface SearchSuggestionsProps {
  onSuggestionClick: (suggestion: string) => void;
  className?: string;
}

export function SearchSuggestions({
  onSuggestionClick,
  className = "",
}: SearchSuggestionsProps) {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

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

  useEffect(() => {
    // Load recent searches from localStorage
    const stored = localStorage.getItem("jackett-recent-searches");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRecentSearches(Array.isArray(parsed) ? parsed.slice(0, 5) : []);
      } catch (error) {
        console.error("Error parsing recent searches:", error);
      }
    }
  }, []);

  const addToRecentSearches = (query: string) => {
    const updated = [query, ...recentSearches.filter((s) => s !== query)].slice(
      0,
      5
    );
    setRecentSearches(updated);
    localStorage.setItem("jackett-recent-searches", JSON.stringify(updated));
  };

  const removeFromRecentSearches = (query: string) => {
    const updated = recentSearches.filter((s) => s !== query);
    setRecentSearches(updated);
    localStorage.setItem("jackett-recent-searches", JSON.stringify(updated));
  };

  const handleSuggestionClick = (suggestion: string) => {
    addToRecentSearches(suggestion);
    onSuggestionClick(suggestion);
  };

  return (
    <Card className={`${className}`}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Recent Searches</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search, index) => (
                  <div key={index} className="flex items-center gap-1">
                    <Badge
                      variant="secondary"
                      className="cursor-pointer hover:bg-secondary/80"
                      onClick={() => handleSuggestionClick(search)}
                    >
                      {search}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => removeFromRecentSearches(search)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Popular Suggestions */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Popular Searches</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {popularSuggestions.map((suggestion, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
