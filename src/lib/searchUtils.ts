import Fuse from "fuse.js";

import type { JackettSearchResult } from "../types/search";

/**
 * Validates basic structure of a search result
 */
export function isValidSearchResult(result: JackettSearchResult): boolean {
  return !!(
    result.Title &&
    typeof result.Title === "string" &&
    result.Title.trim()
  );
}

/**
 * Function to filter valid search results
 */
export function filterValidSearchResults(
  results: JackettSearchResult[]
): JackettSearchResult[] {
  return results.filter(isValidSearchResult);
}

/**
 * Calculates a relevance boost for media-specific patterns (Season/Episode)
 */
function getPatternBoost(title: string, term: string): number {
  const titleLower = title.toLowerCase();
  const termLower = term.toLowerCase();

  // Season/Episode pattern (e.g. S01E05)
  const sePattern = /s\d{1,2}e\d{1,2}/i;
  if (sePattern.test(term) && titleLower.includes(termLower)) return 0.5;

  // Year pattern
  const yearPattern = /\b(19|20)\d{2}\b/;
  if (yearPattern.test(term) && titleLower.includes(termLower)) return 0.3;

  return 0;
}

/**
 * Core relevance scoring logic
 */
function calculateRelevance(
  result: JackettSearchResult,
  terms: string[],
  fuseScore: number = 1
): number {
  const titleLower = result.Title.toLowerCase();
  let bonus = 0;

  // 1. Exact phrase start bonus
  const firstTerm = terms[0];
  if (firstTerm && titleLower.startsWith(firstTerm.toLowerCase())) {
    bonus += 0.4;
  }

  // 2. Term-specific boosts
  terms.forEach((term) => {
    // Exact match in word boundaries
    const regex = new RegExp(`\\b${term}\\b`, "i");
    if (regex.test(result.Title)) bonus += 0.2;

    // Pattern specific boosts (Seasons, Years)
    bonus += getPatternBoost(result.Title, term);
  });

  // 3. Health bonus (Seeds) - capped to avoid popularity overriding relevance
  const healthBonus = Math.min(0.2, (result.Seeders || 0) / 2000);

  // Combine: (Fuzzy Base) + (Pattern/Exact Bonuses) + (Health)
  // Fuse score is 0 (best) to 1 (worst)
  return 1 - fuseScore + bonus + healthBonus;
}

/**
 * Perform high-performance fuzzy search and relevance ranking
 */
export function advancedFuzzySearch(
  results: JackettSearchResult[],
  filter: string,
  scoringQuery?: string
): JackettSearchResult[] {
  const query = (filter || scoringQuery || "").trim();
  if (!query) {
    return results.map((r) => ({
      ...r,
      Relevance: Math.min(1, r.Seeders / 1000),
    }));
  }

  const terms = query.split(/\s+/).filter((t) => t.length > 1);

  // Initialize Fuse one time for the entire batch
  const fuse = new Fuse(results, {
    keys: ["Title"],
    threshold: 0.4,
    includeScore: true,
    useExtendedSearch: true,
  });

  // Search using the full query
  const fuseResults = fuse.search(query);

  // If we have fuzzy results, process them
  if (fuseResults.length > 0) {
    return fuseResults
      .map((fr) => ({
        ...fr.item,
        Relevance: calculateRelevance(fr.item, terms, fr.score),
      }))
      .sort((a, b) => (b.Relevance || 0) - (a.Relevance || 0));
  }

  // Fallback: If Fuse finds nothing, try basic inclusion for each term
  return results
    .map((r) => {
      const matchedTerms = terms.filter((t) =>
        r.Title.toLowerCase().includes(t.toLowerCase())
      );
      const score = matchedTerms.length / terms.length;
      return {
        ...r,
        Relevance: score > 0 ? calculateRelevance(r, terms, 1 - score) : 0,
      };
    })
    .filter((r) => (r.Relevance || 0) > 0.1)
    .sort((a, b) => (b.Relevance || 0) - (a.Relevance || 0));
}

/**
 * Utility: Pretty format file size
 */
export const convertSizeToGB = (size: number | string): string => {
  if (!size) return "N/A";
  const bytes = typeof size === "string" ? parseFloat(size) : size;
  if (isNaN(bytes)) return "N/A";

  if (bytes > 1024 * 1024 * 1024) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  if (bytes > 1024 * 1024) return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
  return `${(bytes / 1024).toFixed(2)} KB`;
};
