import { memo, useEffect, useRef, useState } from "react";

import { toast } from "sonner";

import type { JackettSearchResult } from "@/types/search";

import { useEventSource } from "../hooks/useEventSource";
import { useIndexers } from "../hooks/useIndexers";
import { useLocalStorage } from "../hooks/usePersistentState";
import { useRecentSearches } from "../hooks/useRecentSearches";
import { useResultBatching } from "../hooks/useResultBatching";
import { useSearch } from "../hooks/useSearch";
import { useSearchCache } from "../hooks/useSearchCache";
import type { IndexerSelectionState } from "../types/indexer";
import { ErrorDisplay } from "./ErrorDisplay";
import { Header } from "./Header";
import { IndexerChips } from "./IndexerChips";
import { IndexerSelector } from "./IndexerSelector";
import { InfoDisplay } from "./InfoDisplay";
import { ResultsTable } from "./ResultsTable";
import { SearchForm } from "./SearchForm";
import { SearchSuggestions } from "./SearchSuggestions";
import { SkeletonLoader } from "./SkeletonLoader";

// JackettSearch component for searching and displaying results
const JackettSearch = memo(() => {
  // Use regular state instead of sessionStorage to start fresh on page reload
  const [results, setResults] = useState<JackettSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Search cache
  const { getCachedResults, setCachedResults } = useSearchCache();

  // Recent searches
  const { addToRecentSearches } = useRecentSearches();

  // Indexer management
  const {
    indexers,
    loading: indexersLoading,
    error: indexersError,
    refetch: refetchIndexers,
  } = useIndexers();
  const [indexerSelection, setIndexerSelection] =
    useLocalStorage<IndexerSelectionState>("jackett-indexer-selection", {
      selectedIndexers: [],
      searchMode: "all",
    });

  // State for post-search indexer filtering
  const [selectedIndexerFilters, setSelectedIndexerFilters] = useState<
    string[]
  >([]);

  // Search query state for the search bar
  const [searchQuery, setSearchQuery] = useState("");

  // Toggle indexer filter
  const handleIndexerFilterToggle = (indexerId: string) => {
    setSelectedIndexerFilters((prev) =>
      prev.includes(indexerId)
        ? prev.filter((id) => id !== indexerId)
        : [...prev, indexerId]
    );
  };

  const handleClearIndexerFilters = () => {
    setSelectedIndexerFilters([]);
  };

  // Use the EventSource hook
  const { cleanupEventSource } = useEventSource();
  // Ref for the input element
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Use the result batching hook
  const { addResultToBatch, processBatch, cleanupBatches } = useResultBatching({
    setResults,
  });

  // Use the search hook
  const { fetchDataJackett, cancelSearch } = useSearch({
    indexerSelection,
    setResults,
    setLoading,
    setError,
    setInfo,
    getCachedResults,
    setCachedResults,
    processBatch,
    addResultToBatch,
    cleanupBatches,
  });

  // Wrapper function to match the expected signature
  const fetchDataJackettWrapper = (queryOverride?: string) => {
    const query = queryOverride !== undefined ? queryOverride : searchQuery;
    if (query.trim()) {
      addToRecentSearches(query.trim());
    }
    fetchDataJackett(query);
  };

  // Handle copy to clipboard
  const handleCopy = (type: "magnet" | "source", content: string) => {
    navigator.clipboard.writeText(content).then(
      () => {
        toast.success(`Copied ${type} link to clipboard`);
      },
      () => {
        toast.error(`Failed to copy ${type} link to clipboard`);
      }
    );
  };

  // Cleanup the EventSource connection and batches when the component unmounts
  useEffect(() => {
    return () => {
      cleanupBatches();
      cleanupEventSource();
      processBatch();
    };
  }, [processBatch, cleanupBatches, cleanupEventSource]);

  // Focus the input field when the component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      <div className="flex flex-col w-full max-w-7xl mx-auto gap-12 p-4 sm:p-8 animate-fadeIn">
        {/* Unified Search Console */}
        <div className="flex flex-col w-full max-w-4xl mx-auto gap-6 sm:gap-8">
          <Header />

          <SearchForm
            ref={inputRef}
            onSubmit={(e: React.FormEvent) => {
              e.preventDefault();
              fetchDataJackettWrapper();
            }}
            onCancel={cancelSearch}
            loading={loading}
            showSuggestions={results.length === 0 && !loading}
            value={searchQuery}
            onChange={setSearchQuery}
          />

          {error && (
            <div className="w-full">
              <ErrorDisplay error={error} onRetry={fetchDataJackettWrapper} />
            </div>
          )}
          {info && (
            <div className="w-full">
              <InfoDisplay message={info} variant="info" />
            </div>
          )}

          <IndexerSelector
            indexers={indexers}
            loading={indexersLoading}
            error={indexersError}
            selectionState={indexerSelection}
            onSelectionChange={setIndexerSelection}
            onRefetch={refetchIndexers}
          />
        </div>

        {loading && results.length === 0 && (
          <div className="p-2 sm:p-4 animate-fadeIn">
            <SkeletonLoader rows={10} />
          </div>
        )}

        {results.length > 0 ? (
          <div className="space-y-8">
            <ResultsTable
              results={results}
              onCopy={handleCopy}
              indexers={indexers}
              selectedIndexerFilters={selectedIndexerFilters}
              searchQuery={searchQuery}
              onClearIndexerFilters={handleClearIndexerFilters}
            />
            <div className="max-w-4xl mx-auto w-full">
              <IndexerChips
                results={results}
                indexers={indexers}
                selectedIndexerFilters={selectedIndexerFilters}
                onToggleFilter={handleIndexerFilterToggle}
                onClearFilters={handleClearIndexerFilters}
              />
            </div>
          </div>
        ) : (
          !loading && (
            <div className="max-w-4xl mx-auto w-full animate-fadeIn">
              <SearchSuggestions
                onSuggestionClick={(suggestion: string) => {
                  setSearchQuery(suggestion);
                  fetchDataJackettWrapper(suggestion);
                }}
              />
            </div>
          )
        )}
      </div>
    </div>
  );
});

export default JackettSearch;
