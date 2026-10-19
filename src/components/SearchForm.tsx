import { forwardRef, useState } from "react";

import { Loader2, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { SearchSuggestions } from "./SearchSuggestions";

interface SearchFormProps {
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  loading: boolean;
  showSuggestions?: boolean;
  value: string;
  onChange: (value: string) => void;
}

export const SearchForm = forwardRef<HTMLInputElement, SearchFormProps>(
  (
    { onSubmit, onCancel, loading, showSuggestions = false, value, onChange },
    ref
  ) => {
    const [showSuggestionsPanel, setShowSuggestionsPanel] = useState(false);

    const handleSuggestionClick = (suggestion: string) => {
      onChange(suggestion);
      setShowSuggestionsPanel(false);

      // Trigger submission after state update
      setTimeout(() => {
        if (ref && typeof ref !== "function" && ref.current) {
          const form = ref.current.closest("form");
          if (form) {
            form.dispatchEvent(
              new Event("submit", { bubbles: true, cancelable: true })
            );
          }
        }
      }, 0);
    };

    const handleClear = () => {
      onChange("");
      setShowSuggestionsPanel(false);
      if (ref && typeof ref !== "function" && ref.current) {
        ref.current.focus();
      }
    };

    return (
      <div className="w-full">
        <form onSubmit={onSubmit} className="w-full">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 w-full relative group">
              <Input
                ref={ref}
                className="relative w-full h-14 pl-6 pr-14 bg-background/80 shadow-sm border border-border/80 rounded-full transition-all duration-300 focus:ring-4 focus:ring-ring/20 focus:border-ring text-lg backdrop-blur-sm"
                placeholder="Search for movies, TV shows, or anything..."
                disabled={loading}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() =>
                  showSuggestions && !value && setShowSuggestionsPanel(true)
                }
                onBlur={() =>
                  setTimeout(() => setShowSuggestionsPanel(false), 200)
                }
              />
              {value && !loading && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 flex-shrink-0 hover:bg-destructive/10 hover:text-destructive rounded-full transition-colors duration-200"
                  onClick={handleClear}
                  title="Clear search"
                >
                  <X className="h-5 w-5" />
                </Button>
              )}
            </div>
            {loading ? (
              <Button
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  onCancel();
                }}
                className="w-full sm:w-auto h-14 px-8 border-destructive/30 text-destructive bg-destructive/5 hover:bg-destructive/10 transition-all duration-300 rounded-full shadow-sm"
              >
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                Cancel
              </Button>
            ) : (
              <Button
                variant="default"
                type="submit"
                className="w-full sm:w-auto h-14 px-8 transition-all duration-300 hover:scale-105 active:scale-95 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full shadow-md"
              >
                <Search className="w-5 h-5 mr-3" />
                Search
              </Button>
            )}
          </div>
        </form>

        {showSuggestions && showSuggestionsPanel && (
          <div className="mt-4">
            <SearchSuggestions onSuggestionClick={handleSuggestionClick} />
          </div>
        )}
      </div>
    );
  }
);

SearchForm.displayName = "SearchForm";
