// Define the interface for Jackett search results
export interface JackettSearchResult {
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

// Function to validate Jackett search results
export function isValidSearchResult(result: JackettSearchResult): boolean {
  // Check if Title exists and is not empty
  return !!(
    result.Title &&
    typeof result.Title === "string" &&
    result.Title.trim().length > 0
  );
}

// Function to filter valid search results
export function filterValidSearchResults(
  results: JackettSearchResult[]
): JackettSearchResult[] {
  return results.filter(isValidSearchResult);
}
