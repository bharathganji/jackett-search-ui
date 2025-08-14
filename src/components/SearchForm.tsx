import { forwardRef, useState } from "react";

import { Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { SearchSuggestions } from "./SearchSuggestions";

interface SearchFormProps {
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  loading: boolean;
  showSuggestions?: boolean;
}

export const SearchForm = forwardRef<HTMLInputElement, SearchFormProps>(
  ({ onSubmit, onCancel, loading, showSuggestions = false }, ref) => {
    const [showSuggestionsPanel, setShowSuggestionsPanel] = useState(false);

    const handleSuggestionClick = (suggestion: string) => {
      if (ref && "current" in ref && ref.current) {
        ref.current.value = suggestion;
        setShowSuggestionsPanel(false);
        // Trigger form submission
        const form = ref.current.closest("form");
        if (form) {
          form.dispatchEvent(
            new Event("submit", { bubbles: true, cancelable: true })
          );
        }
      }
    };

    return (
      <div className="w-full">
        <form onSubmit={onSubmit} className="w-full">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
            <div className="flex-1 relative">
              <Input
                ref={ref}
                className="w-full"
                placeholder="Search for torrents..."
                disabled={loading}
                onFocus={() => showSuggestions && setShowSuggestionsPanel(true)}
                onBlur={() =>
                  setTimeout(() => setShowSuggestionsPanel(false), 200)
                }
              />
            </div>
            {loading ? (
              // Cancel state - show red cancel button with spinner when loading
              <Button
                variant="destructive"
                onClick={(e) => {
                  e.preventDefault();
                  onCancel();
                }}
                className="w-full sm:w-auto sm:min-w-[100px] h-10"
              >
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Cancel
              </Button>
            ) : (
              // Default state - show search button
              <Button
                variant="default"
                type="submit"
                className="w-full sm:w-auto sm:min-w-[100px] h-10"
              >
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            )}
          </div>
        </form>

        {showSuggestions && showSuggestionsPanel && (
          <SearchSuggestions
            onSuggestionClick={handleSuggestionClick}
            className="mb-4"
          />
        )}
      </div>
    );
  }
);

SearchForm.displayName = "SearchForm";
