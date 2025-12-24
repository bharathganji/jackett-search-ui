/**
 * Interface for Jackett search results
 */
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
  Relevance?: number;
}
