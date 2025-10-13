// Import Fuse.js at the top of the file
import Fuse from "fuse.js";

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

// Define the type for our intermediate results with match counts
interface FilteredResult {
  item: JackettSearchResult;
  score: number | undefined;
  matchCount: number;
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

// Function to perform advanced fuzzy search with multi-term matching
export function advancedFuzzySearch(
  results: JackettSearchResult[],
  filter: string
): JackettSearchResult[] {
  if (!filter) return results;

  // Split the filter into multiple terms for multiple matches
  const filterTerms = filter.split(/\s+/).filter((term) => term.trim() !== "");

  if (filterTerms.length > 1) {
    // For multiple terms, use an approach that prioritizes results with ALL terms
    // but still allows for some flexibility with fuzzy matching
    const matchingResults: FilteredResult[] = [];

    for (const result of results) {
      let matchedTermsCount = 0;
      let totalScore = 0;
      let hasAllTerms = true;

      // Check each filter term against the result
      for (const term of filterTerms) {
        // First try exact match (case-insensitive)
        const exactMatch =
          result.Title.toLowerCase().includes(term.toLowerCase()) ||
          (/\d+/.test(term) &&
            new RegExp(`\\b${term}\\b`, "i").test(result.Title));

        if (exactMatch) {
          matchedTermsCount++;
          totalScore += 0.1; // Give a good score for exact matches
        } else {
          // If no exact match, try fuzzy match using Fuse with enhanced options
          const fuse = new Fuse([result], {
            keys: ["Title"],
            threshold: 0.4, // Slightly more permissive threshold
            includeScore: true,
            minMatchCharLength: 1,
            // Use more permissive matching options
            ignoreLocation: true, // Ignore position when matching
            ignoreFieldNorm: true, // Don't normalize field length
          });

          const termResults = fuse.search(term);
          if (
            termResults.length > 0 &&
            termResults[0]?.score != null &&
            termResults[0].score < 0.4
          ) {
            // Fuzzy match found
            matchedTermsCount++;
            totalScore += termResults[0].score || 0.5; // Add the fuzzy score
          } else {
            // For cases where simple fuzzy matching doesn't work, try a more permissive approach
            // This helps with variations like "duL" vs "duaL" by checking for character sequence
            const titleLower = result.Title.toLowerCase();
            const termLower = term.toLowerCase();

            // Check if the term characters appear in sequence (allowing for some insertions)
            let sequenceMatch = false;
            if (termLower.length >= 2) {
              // Create a regex pattern that allows for some character insertions between letters
              const escapedTerm = termLower.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
              );
              // Create pattern that allows for 0-2 characters between each character of the term
              const pattern = escapedTerm.split("").join(".{0,2}");
              const sequenceRegex = new RegExp(pattern, "i");
              sequenceMatch = sequenceRegex.test(titleLower);
            }

            if (sequenceMatch) {
              matchedTermsCount++;
              totalScore += 0.6; // Medium score for sequence matches
            } else {
              // No match for this term
              hasAllTerms = false;
              break; // No need to check other terms if one doesn't match
            }
          }
        }
      }

      // Only include results that match ALL terms (either exact or fuzzy)
      if (hasAllTerms && matchedTermsCount === filterTerms.length) {
        matchingResults.push({
          item: result,
          score: totalScore / matchedTermsCount, // Average score
          matchCount: matchedTermsCount,
        });
      }
    }

    // Sort results by match count (descending) then by average score (ascending, better matches first)
    matchingResults.sort((a, b) => {
      if (b.matchCount !== a.matchCount) {
        return b.matchCount - a.matchCount; // More matches first
      }
      if (a.score != null && b.score != null) {
        return (a.score || 1) - (b.score || 1); // Better score first
      }
      return 0;
    });

    return matchingResults.map((result) => result.item);
  } else {
    // For single term, use regular fuzzy search
    const fuse = new Fuse(results, {
      keys: [
        { name: "Title", weight: 0.5 },
        { name: "IndexerId", weight: 0.2 },
      ],
      threshold: 0.3, // Adjust threshold for fuzzy matching (0.0 = exact match, 1.0 = match anything)
      includeScore: true,
      minMatchCharLength: 1,
    });

    const searchResults = fuse.search(filter);
    return searchResults.map(
      (result: { item: JackettSearchResult }) => result.item
    );
  }
}
