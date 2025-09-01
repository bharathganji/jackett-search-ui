import { useCallback, useRef } from "react";

import type { JackettSearchResult } from "../lib/searchUtils";
import {
  filterValidSearchResults,
  isValidSearchResult,
} from "../lib/searchUtils";

interface UseResultBatchingProps {
  setResults: (
    updater: (prevResults: JackettSearchResult[]) => JackettSearchResult[]
  ) => void;
}

export function useResultBatching({ setResults }: UseResultBatchingProps) {
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
      // Filter batch results to ensure they're valid before adding to state
      const validBatchResults = filterValidSearchResults(batchToProcess);
      const newResults = [...prevResults, ...validBatchResults];
      console.log(
        `Batch processed: ${validBatchResults.length} new results, total: ${newResults.length}`
      );
      return newResults;
    });

    processingBatchRef.current = false;
    batchTimeoutRef.current = null;
  }, [setResults]);

  // Add result to batch with debouncing
  const addResultToBatch = useCallback(
    (result: JackettSearchResult) => {
      // Validate the result before adding to batch
      if (!isValidSearchResult(result)) {
        return;
      }

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

  // Cleanup function for batches
  const cleanupBatches = useCallback(() => {
    // Clear any pending batches
    batchRef.current = [];
    processingBatchRef.current = false;
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
      batchTimeoutRef.current = null;
    }
  }, []);

  return {
    addResultToBatch,
    processBatch,
    cleanupBatches,
    batchRef,
    batchTimeoutRef,
    processingBatchRef,
  };
}
