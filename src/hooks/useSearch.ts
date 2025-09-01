import type { JackettSearchResult } from "../lib/searchUtils";
import type { IndexerSelectionState } from "../types/indexer";
import { useEventSource } from "./useEventSource";

interface UseSearchProps {
  indexerSelection: IndexerSelectionState;
  setResults: (results: JackettSearchResult[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setInfo: (info: string | null) => void;
  getCachedResults: (cacheKey: string) => JackettSearchResult[] | null;
  setCachedResults: (cacheKey: string, results: JackettSearchResult[]) => void;
  processBatch: () => void;
  addResultToBatch: (result: JackettSearchResult) => void;
  cleanupBatches: () => void;
}

export function useSearch({
  indexerSelection,
  setResults,
  setLoading,
  setError,
  setInfo,
  getCachedResults,
  processBatch,
  addResultToBatch,
  cleanupBatches,
}: UseSearchProps) {
  // Use the EventSource hook
  const {
    eventSourceRef,
    timeoutIdRef,
    closeEventSource,
    setTimeoutId,
    clearTimeoutId,
    cleanupEventSource,
  } = useEventSource();

  // Function to fetch data from Jackett
  const fetchDataJackett = (query: string): void => {
    if (!query.trim()) return;

    // Set loading state immediately for instant feedback
    setLoading(true);
    setError(null);
    setInfo(null);
    setResults([]);

    // Clear any pending batches using the hook function
    cleanupBatches();

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
      return;
    }

    // Clear any pending batches using the hook function
    cleanupBatches();

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

        setTimeoutId(timeoutId);

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
                  clearTimeoutId();

                  // Process any remaining batch and cache results
                  processBatch();

                  // Note: The actual results are set by the batch processing hook
                  // We just need to ensure the batch is processed before we finish

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

          setLoading(false);
          if (eventSourceRef.current === eventSource) {
            eventSourceRef.current = null;
          }
        };

        eventSource.addEventListener("close", () => {
          console.log("EventSource connection closed");
          processBatch();

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

        setTimeoutId(timeoutId);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Error fetching data");
      setLoading(false);
    }
  };

  // Function to cancel ongoing search
  const cancelSearch = (): void => {
    // Close EventSource connection
    closeEventSource();

    // Clear the search timeout
    clearTimeoutId();

    // Clear any pending batches using the hook function
    cleanupBatches();

    // Reset loading state
    setLoading(false);
    setInfo("Search cancelled by user");
  };

  // Cleanup effect
  const cleanupSearch = (): void => {
    // Clean up any pending batches and timeouts on unmount
    cleanupBatches();
    cleanupEventSource();
  };

  return {
    fetchDataJackett,
    cancelSearch,
    cleanupSearch,
    eventSourceRef,
    timeoutIdRef,
  };
}
