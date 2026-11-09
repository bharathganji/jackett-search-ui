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

// Pre-compile static patterns
const sePattern = /s\d{1,2}e\d{1,2}/i;
const yearPattern = /\b(19|20)\d{2}\b/;

/**
 * Escapes special characters in a string for use in a regular expression
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

type ProcessedTerm = {
  original: string;
  lower: string;
  regex: RegExp;
  hasSePattern: boolean;
  hasYearPattern: boolean;
};

/**
 * Calculates a relevance boost for media-specific patterns (Season/Episode)
 */
function getPatternBoost(titleLower: string, term: ProcessedTerm): number {
  if (term.hasSePattern && titleLower.includes(term.lower)) return 0.5;
  if (term.hasYearPattern && titleLower.includes(term.lower)) return 0.3;

  return 0;
}

/**
 * Core relevance scoring logic
 */
function calculateRelevance(
  result: JackettSearchResult,
  terms: ProcessedTerm[],
  fuseScore: number = 1
): number {
  const titleLower = result.Title.toLowerCase();
  let bonus = 0;

  // 1. Exact phrase start bonus
  const firstTerm = terms[0];
  if (firstTerm && titleLower.startsWith(firstTerm.lower)) {
    bonus += 0.4;
  }

  // 2. Term-specific boosts across searchable fields
  for (let i = 0; i < terms.length; i++) {
    const term = terms[i];
    if (!term) continue;

    // Exact match in word boundaries (Title first priority)
    if (term.regex.test(result.Title)) bonus += 0.2;

    // Exact match in Year
    if (
      result.Year !== null &&
      String(result.Year).toLowerCase() === term.lower
    ) {
      bonus += 0.15;
    }

    // Exact match in Details
    const detailsLower = (result.Details || "").toLowerCase();
    if (detailsLower.includes(term.lower)) bonus += 0.1;

    // Exact match in IndexerId
    const indexerLower = (result.IndexerId || "").toLowerCase();
    if (indexerLower.includes(term.lower)) bonus += 0.08;

    // Pattern specific boosts (Seasons, Years) - applied to Title
    bonus += getPatternBoost(titleLower, term);
  }

  // 3. Health bonus (Seeds) - capped to avoid popularity overriding relevance
  const healthBonus = Math.min(0.2, (result.Seeders || 0) / 2000);

  // Combine: (Fuzzy Base) + (Pattern/Exact Bonuses) + (Health)
  // Fuse score is 0 (best) to 1 (worst)
  return 1 - fuseScore + bonus + healthBonus;
}

// Cache for Fuse instance
let lastFuseResults: JackettSearchResult[] | null = null;
let lastFuseInstance: Fuse<JackettSearchResult> | null = null;

/**
 * Perform high-performance fuzzy search and relevance ranking.
 * When `filter` is non-empty, fuzzy filtering is executed and matching results are returned.
 * When `filter` is empty, NO results are filtered/dropped; if `scoringQuery` is provided,
 * relevance is calculated across all results without pruning.
 */
export function advancedFuzzySearch(
  results: JackettSearchResult[],
  filter: string,
  scoringQuery?: string
): JackettSearchResult[] {
  const cleanFilter = (filter || "").trim();
  const cleanScoring = (scoringQuery || "").trim();

  // 1. If no in-table filter is active, do NOT filter out any results!
  if (!cleanFilter) {
    if (!cleanScoring) {
      return results.map((r) => ({
        ...r,
        Relevance: Math.min(1, (Number(r.Seeders) || 0) / 1000),
      }));
    }

    const rawTerms = cleanScoring.split(/\s+/).filter((t) => t.length > 1);
    const terms: ProcessedTerm[] = rawTerms.map((t) => ({
      original: t,
      lower: t.toLowerCase(),
      regex: new RegExp(`\\b${escapeRegExp(t)}\\b`, "i"),
      hasSePattern: sePattern.test(t),
      hasYearPattern: yearPattern.test(t),
    }));

    return results.map((r) => ({
      ...r,
      Relevance: calculateRelevance(r, terms, 1),
    }));
  }

  // 2. An explicit filter IS active -> filter results using Fuse.js
  const rawTerms = cleanFilter.split(/\s+/).filter((t) => t.length > 1);
  const terms: ProcessedTerm[] = rawTerms.map((t) => ({
    original: t,
    lower: t.toLowerCase(),
    regex: new RegExp(`\\b${escapeRegExp(t)}\\b`, "i"),
    hasSePattern: sePattern.test(t),
    hasYearPattern: yearPattern.test(t),
  }));

  // Initialize Fuse only if the results array has changed
  let fuse: Fuse<JackettSearchResult>;
  if (lastFuseResults === results && lastFuseInstance) {
    fuse = lastFuseInstance;
  } else {
    fuse = new Fuse(results, {
      keys: ["Title", "Year", "Details", "IndexerId"],
      threshold: 0.4,
      includeScore: true,
      useExtendedSearch: true,
    });
    lastFuseResults = results;
    lastFuseInstance = fuse;
  }

  // Search using the filter query
  const fuseResults = fuse.search(cleanFilter);

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
      const titleLower = r.Title.toLowerCase();
      const detailsLower = (r.Details || "").toLowerCase();
      const indexerLower = (r.IndexerId || "").toLowerCase();
      const yearStringLower =
        r.Year !== null ? String(r.Year).toLowerCase() : null;

      const matchedTerms = terms.filter((t) => {
        return (
          titleLower.includes(t.lower) ||
          (yearStringLower !== null && yearStringLower === t.lower) ||
          detailsLower.includes(t.lower) ||
          indexerLower.includes(t.lower)
        );
      });
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
 * Safe multi-type comparator for sorting search results.
 * Handles numeric fields (Seeders, Leechers, Size, Relevance, Year) and string fields.
 * Includes deterministic secondary tie-breaking on Seeders and Title.
 */
export function compareSearchResults(
  a: JackettSearchResult,
  b: JackettSearchResult,
  field: keyof JackettSearchResult,
  direction: "asc" | "desc" = "desc"
): number {
  let diff = 0;

  if (
    field === "Seeders" ||
    field === "Leechers" ||
    field === "Size" ||
    field === "Relevance" ||
    field === "Year"
  ) {
    const valA = Number(a[field]) || 0;
    const valB = Number(b[field]) || 0;
    diff = valA - valB;
  } else {
    const strA = String(a[field] ?? "");
    const strB = String(b[field] ?? "");
    diff = strA.localeCompare(strB, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  }

  let result = direction === "asc" ? diff : -diff;

  // Secondary tie-breaker: Seeders descending, then Title ascending
  if (result === 0 && field !== "Seeders") {
    result = (Number(b.Seeders) || 0) - (Number(a.Seeders) || 0);
  }
  if (result === 0 && field !== "Title") {
    result = String(a.Title ?? "").localeCompare(String(b.Title ?? ""));
  }

  return result;
}

/**
 * Node-safe idle callback scheduler with setTimeout fallback
 */
export const scheduleIdle = (callback: () => void): (() => void) => {
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    const handle = window.requestIdleCallback(callback);
    return () => window.cancelIdleCallback(handle);
  }
  const timer = setTimeout(callback, 1);
  return () => clearTimeout(timer);
};

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
