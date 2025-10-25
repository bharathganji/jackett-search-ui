// Import Fuse.js at the top of the file
import Fuse from "fuse.js";

// Define the interface for Jackett search results
export interface JackettSearchResult {
  Title: string;
  Link: string;
  InfoHash: string | null;
  Seeders: number;
  Leechers: number | null;
  Size: string | number;
  IndexerId: string;
  Year: number | null;
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

// Common abbreviation mappings for torrent search
const ABBREVIATION_MAP: Record<string, string[]> = {
  "720": ["720p"],
  "1080": ["1080p"],
  "2160": ["2160p"],
  "4k": ["2160p", "4k"],
  multi: ["multiple", "multi"],
  dub: ["dubbed", "dub", "dual"],
  dual: ["dual", "dub", "dubbed"],
  eng: ["english", "eng"],
  sub: ["subtitle", "sub", "subs"],
  hevc: ["hevc", "h265", "h.265"],
  h264: ["h264", "h.264", "avc"],
  avc: ["avc", "h264", "h.264"],
  web: ["web-dl", "webrip", "web"],
  bluray: ["bluray", "blu-ray", "bdrip", "bd"],
  bdrip: ["bdrip", "bluray", "blu-ray"],
  remux: ["remux"],
  x265: ["x265", "hevc"],
  x264: ["x264", "avc"],
  aac: ["aac", "ac3"],
  ac3: ["ac3", "aac"],
  flac: ["flac"],
  dts: ["dts"],
  atmos: ["atmos"],
  hdr: ["hdr", "hdr10"],
  dv: ["dv", "dolby vision"],
};

// Helper function to expand search term with abbreviations
function expandSearchTerm(term: string): string[] {
  const termLower = term.toLowerCase();

  // If term is in abbreviation map, return all variations
  if (ABBREVIATION_MAP[termLower]) {
    return [termLower, ...ABBREVIATION_MAP[termLower]];
  }

  // Check if term is a prefix of any abbreviation key
  const matchingAbbreviations = Object.entries(ABBREVIATION_MAP)
    .filter(([key]) => key.startsWith(termLower) || termLower.startsWith(key))
    .flatMap(([, values]) => values);

  if (matchingAbbreviations.length > 0) {
    return [termLower, ...matchingAbbreviations];
  }

  return [termLower];
}

// Helper function to calculate match score for a single term
function calculateTermScore(title: string, term: string): number | null {
  const titleLower = title.toLowerCase();
  const termLower = term.toLowerCase();

  // Get all variations of the search term
  const termVariations = expandSearchTerm(termLower);

  // Check each variation
  for (const variation of termVariations) {
    // Exact substring match - highest priority
    if (titleLower.includes(variation)) {
      return 0; // Lower score is better
    }

    // Word boundary match (e.g., "Batman" matches "Batman Ninja")
    const wordBoundaryRegex = new RegExp(
      `\\b${variation.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
      "i"
    );
    if (wordBoundaryRegex.test(title)) {
      return 0.1;
    }
  }

  // Use Fuse.js for fuzzy matching with all variations
  const fuse = new Fuse([{ Title: title }], {
    keys: ["Title"],
    threshold: 0.3,
    includeScore: true,
    minMatchCharLength: Math.max(2, Math.floor(termLower.length * 0.6)),
  });

  // Try fuzzy matching with original term and variations
  for (const variation of termVariations) {
    const fuseResults = fuse.search(variation);
    if (fuseResults.length > 0 && fuseResults[0]?.score != null) {
      return fuseResults[0].score;
    }
  }

  return null; // No match
}

// Function to perform advanced fuzzy search with multi-term matching
export function advancedFuzzySearch(
  results: JackettSearchResult[],
  filter: string
): JackettSearchResult[] {
  if (!filter) return results;

  // Split the filter into multiple terms
  const filterTerms = filter
    .split(/\s+/)
    .filter((term) => term.trim().length > 0);

  if (filterTerms.length === 0) return results;

  // Score each result based on how well it matches all terms
  const scoredResults: FilteredResult[] = [];

  for (const result of results) {
    const scores: number[] = [];
    let matchedAllTerms = true;

    // Calculate score for each term
    for (const term of filterTerms) {
      const score = calculateTermScore(result.Title, term);

      if (score === null) {
        // Term didn't match
        matchedAllTerms = false;
        break;
      }

      scores.push(score);
    }

    // Only include results that match ALL terms
    if (matchedAllTerms && scores.length === filterTerms.length) {
      const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      scoredResults.push({
        item: result,
        score: averageScore,
        matchCount: filterTerms.length,
      });
    }
  }

  // Sort by score (ascending - lower is better)
  scoredResults.sort((a, b) => (a.score || 0) - (b.score || 0));

  return scoredResults.map((result) => result.item);
}
