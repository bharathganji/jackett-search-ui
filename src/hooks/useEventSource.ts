import { useRef } from "react";

export function useEventSource() {
  // Ref to store the EventSource instance
  const eventSourceRef = useRef<EventSource | null>(null);
  // Ref to store the timeout ID for cleanup
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  // Function to close the EventSource connection
  const closeEventSource = (): void => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  };

  // Function to set a timeout
  const setTimeoutId = (timeoutId: NodeJS.Timeout): void => {
    // Clear any existing timeout
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }
    timeoutIdRef.current = timeoutId;
  };

  // Function to clear the timeout
  const clearTimeoutId = (): void => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  };

  // Cleanup effect
  const cleanupEventSource = (): void => {
    closeEventSource();
    clearTimeoutId();
  };

  return {
    eventSourceRef,
    timeoutIdRef,
    closeEventSource,
    setTimeoutId,
    clearTimeoutId,
    cleanupEventSource,
  };
}
