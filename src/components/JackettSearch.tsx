import { memo, useEffect, useRef, useState } from "react";

import { toast } from "sonner";

import { useEventSource } from "../hooks/useEventSource";
import { useIndexers } from "../hooks/useIndexers";
import { useLocalStorage } from "../hooks/usePersistentState";
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

// Define the interface for Jackett search results
interface JackettSearchResult {
  Title: string;
  Link: string;
  InfoHash: string;
  Seeders: number;
  Leechers: number;
  Size: string;
  IndexerId: string;
  Year: number;
  Details: string;
}

// JackettSearch component for searching and displaying results
const JackettSearch = memo(() => {
  // Use regular state instead of sessionStorage to start fresh on page reload
  const [results, setResults] = useState<JackettSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Search cache
  const { getCachedResults, setCachedResults } = useSearchCache();

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
  const fetchDataJackettWrapper = () => {
    const query = inputRef.current?.value || "";
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

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Clean up any pending batches and timeouts on unmount
      cleanupBatches();
      cleanupEventSource();
    };
  }, [cleanupBatches]);

  // Cleanup the EventSource connection and batches when the component unmounts
  useEffect(() => {
    return () => {
      // Clean up any pending batches and timeouts on unmount
      cleanupBatches();
      cleanupEventSource();
      // Process any remaining batch before unmounting
      processBatch();
    };
  }, [processBatch, cleanupBatches]);

  // Focus the input field when the component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <>
      <div className="flex flex-col w-full gap-4 p-2 sm:p-4">
        <Header />

        <SearchForm
          ref={inputRef}
          onSubmit={(e) => {
            e.preventDefault();
            fetchDataJackettWrapper();
          }}
          onCancel={cancelSearch}
          loading={loading}
          showSuggestions={results.length === 0 && !loading}
        />

        {error && (
          <ErrorDisplay error={error} onRetry={fetchDataJackettWrapper} />
        )}
        {info && <InfoDisplay message={info} variant="info" />}

        <IndexerSelector
          indexers={indexers}
          loading={indexersLoading}
          error={indexersError}
          selectionState={indexerSelection}
          onSelectionChange={setIndexerSelection}
          onRefetch={refetchIndexers}
        />
      </div>

      {results.length > 0 ? (
        <>
          <ResultsTable
            results={results}
            onCopy={handleCopy}
            indexers={indexers}
          />
          <IndexerChips results={results} indexers={indexers} />
        </>
      ) : (
        !loading && (
          <div className="p-4">
            <SearchSuggestions
              onSuggestionClick={(suggestion) => {
                if (inputRef.current) {
                  inputRef.current.value = suggestion;
                  fetchDataJackettWrapper();
                }
              }}
            />
          </div>
        )
      )}
    </>
  );
});

export default JackettSearch;
