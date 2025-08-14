import { memo, useCallback, useEffect, useRef, useState } from "react";

import { toast } from "sonner";

import { useIndexers } from "../hooks/useIndexers";
import { useLocalStorage } from "../hooks/usePersistentState";
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

  // Ref to store the EventSource instance
  const eventSourceRef = useRef<EventSource | null>(null);
  // Ref for the input element
  const inputRef = useRef<HTMLInputElement | null>(null);
  // Ref for batching results
  const batchRef = useRef<JackettSearchResult[]>([]);
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const processingBatchRef = useRef<boolean>(false);

  // Optimized batch processing function with race condition protection
  const processBatch = useCallback(() => {
    if (processingBatchRef.current || batchRef.current.length === 0) {
      return;
    }

    processingBatchRef.current = true;
    const batchToProcess = [...batchRef.current];
    batchRef.current = [];

    setResults((prevResults) => {
      const newResults = [...prevResults, ...batchToProcess];
      console.log(
        `Batch processed: ${batchToProcess.length} new results, total: ${newResults.length}`
      );
      return newResults;
    });

    processingBatchRef.current = false;
    batchTimeoutRef.current = null;
  }, [setResults]);

  // Add result to batch with debouncing
  const addResultToBatch = useCallback(
    (result: JackettSearchResult) => {
      batchRef.current.push(result);

      // Clear existing timeout
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }

      // Process batch after 100ms of inactivity or when batch reaches 10 items
      if (batchRef.current.length >= 10) {
        processBatch();
      } else {
        batchTimeoutRef.current = setTimeout(processBatch, 100);
      }
    },
    [processBatch]
  );

  // Ref to store the timeout ID for cleanup
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  // Function to cancel ongoing search
  const cancelSearch = useCallback((): void => {
    // Close EventSource connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // Clear the search timeout
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }

    // Clear any pending batches
    batchRef.current = [];
    processingBatchRef.current = false;
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
      batchTimeoutRef.current = null;
    }

    // Reset loading state
    setLoading(false);
    setInfo("Search cancelled by user");

    toast.info("Search cancelled");
  }, []);

  // Function to fetch data from Jackett
  const fetchDataJackett = (): void => {
    const query = inputRef.current?.value || "";
    if (!query.trim()) return;

    // Set loading state immediately for instant feedback
    setLoading(true);
    setError(null);
    setInfo(null);
    setResults([]);

    // Clear any pending batches
    batchRef.current = [];
    processingBatchRef.current = false;
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
      batchTimeoutRef.current = null;
    }

    // Create cache key that includes indexer selection
    const cacheKey =
      indexerSelection.searchMode === "all"
        ? query
        : `${query}-${indexerSelection.selectedIndexers.sort().join(",")}`;

    // Check cache first
    const cachedResults = getCachedResults(cacheKey);
    if (cachedResults && cachedResults.length > 0) {
      setResults(cachedResults);
      setLoading(false);
      toast.success("Results loaded from cache");
      return;
    }

    // Clear any pending batches
    batchRef.current = [];
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
      batchTimeoutRef.current = null;
    }

    // Close existing EventSource connection if it exists
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const timeout = 60000; // 1 minute

    try {
      // Build the search URL based on indexer selection
      let searchUrl = `${import.meta.env.VITE_JACKETT_API_URL}/search?query=${encodeURIComponent(query)}`;
      let useMultipleEndpoint = false;

      // If specific indexers are selected and search mode is 'selected'
      if (
        indexerSelection.searchMode === "selected" &&
        indexerSelection.selectedIndexers.length > 0
      ) {
        if (indexerSelection.selectedIndexers.length === 1) {
          // Single indexer - use the existing single indexer endpoint
          const indexerId = indexerSelection.selectedIndexers[0];
          searchUrl = `${import.meta.env.VITE_JACKETT_API_URL}/search/${indexerId}?query=${encodeURIComponent(query)}`;
        } else {
          // Multiple indexers - use the new multiple endpoint
          searchUrl = `${import.meta.env.VITE_JACKETT_API_URL}/search/multiple?query=${encodeURIComponent(query)}`;
          useMultipleEndpoint = true;
        }
      }

      if (useMultipleEndpoint) {
        // For multiple indexers, we need to make a POST request with indexer_ids in the body
        // Since EventSource doesn't support POST, we'll use fetch with streaming
        const requestBody = {
          indexer_ids: indexerSelection.selectedIndexers,
        };

        console.log("Making multiple indexer search request:", {
          url: searchUrl,
          body: requestBody,
        });

        // Show specific info for multiple indexer search
        setInfo(
          `Searching ${indexerSelection.selectedIndexers.length} indexers: ${indexerSelection.selectedIndexers.join(", ")}...`
        );

        // Use fetch with streaming instead of EventSource for POST requests
        const controller = new AbortController();
        eventSourceRef.current = {
          close: () => controller.abort(),
        } as EventSource;

        // Set up timeout for the fetch request
        const timeoutId = setTimeout(() => {
          controller.abort();
          setLoading(false);
          setInfo("Search timed out after 1 minute");
        }, timeout);

        timeoutIdRef.current = timeoutId;

        fetch(searchUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        })
          .then(async (response) => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            if (!response.body) {
              throw new Error("No response body");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            try {
              while (true) {
                const { done, value } = await reader.read();

                if (done) {
                  console.log("Stream completed");
                  // Clear timeout since request completed successfully
                  if (timeoutIdRef.current) {
                    clearTimeout(timeoutIdRef.current);
                    timeoutIdRef.current = null;
                  }

                  // Process any remaining batch and cache results
                  processBatch();

                  setResults((currentResults) => {
                    if (currentResults.length > 0) {
                      setCachedResults(cacheKey, currentResults);
                    }
                    return currentResults;
                  });

                  setLoading(false);
                  setInfo(null); // Clear the searching info message
                  break;
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || ""; // Keep the last incomplete line in buffer

                for (const line of lines) {
                  if (line.startsWith("data: ")) {
                    try {
                      const jsonData = line.slice(6); // Remove 'data: ' prefix
                      if (jsonData.trim() && jsonData !== "[DONE]") {
                        const parsedResult: JackettSearchResult =
                          JSON.parse(jsonData);
                        addResultToBatch(parsedResult);
                      }
                    } catch (jsonError) {
                      console.error(
                        "JSON parsing error:",
                        jsonError,
                        "Data:",
                        line
                      );
                    }
                  }
                }
              }
            } finally {
              reader.releaseLock();
            }
          })
          .catch((error) => {
            if (error.name === "AbortError") {
              console.log("Request aborted");
              return;
            }

            console.error("Fetch error:", error);
            setError(`Error fetching data: ${error.message}`);
            setLoading(false);

            // Process any remaining batch before closing
            processBatch();
          });
      } else {
        // Use EventSource for GET requests (all indexers or single indexer)
        const eventSource = new EventSource(searchUrl);
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          console.log("EventSource connection opened");
        };

        eventSource.onmessage = (event) => {
          try {
            const parsedResult: JackettSearchResult = JSON.parse(event.data);
            addResultToBatch(parsedResult);
          } catch (jsonError) {
            console.error("JSON parsing error:", jsonError);
          }
        };

        eventSource.onerror = (error) => {
          console.error("EventSource error:", error);
          eventSource.close();

          // Process any remaining batch before closing
          processBatch();

          setResults((currentResults) => {
            if (currentResults.length > 0) {
              setCachedResults(cacheKey, currentResults);
            }
            return currentResults;
          });

          setLoading(false);
          if (eventSourceRef.current === eventSource) {
            eventSourceRef.current = null;
          }
        };

        eventSource.addEventListener("close", () => {
          console.log("EventSource connection closed");
          processBatch();

          setResults((currentResults) => {
            if (currentResults.length > 0) {
              setCachedResults(cacheKey, currentResults);
            }
            return currentResults;
          });

          setLoading(false);
        });

        // Set up timeout for the fetch request
        const timeoutId = setTimeout(() => {
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
          }
          setLoading(false);
          setInfo("Search timed out after 1 minute");
        }, timeout);

        timeoutIdRef.current = timeoutId;
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Error fetching data");
      setLoading(false);
    }
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
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // Cleanup the EventSource connection and batches when the component unmounts
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
        batchTimeoutRef.current = null;
      }
      // Process any remaining batch before unmounting
      processBatch();
    };
  }, [processBatch]);

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
            fetchDataJackett();
          }}
          onCancel={cancelSearch}
          loading={loading}
          showSuggestions={results.length === 0 && !loading}
        />

        {error && <ErrorDisplay error={error} onRetry={fetchDataJackett} />}
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
                  fetchDataJackett();
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
