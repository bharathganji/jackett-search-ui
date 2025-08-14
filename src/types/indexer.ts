export interface Indexer {
  id: string;
  site_link: string;
}

export interface IndexersResponse {
  indexers: Indexer[];
  total: number;
}

export interface IndexerSelectionState {
  selectedIndexers: string[];
  searchMode: "all" | "selected";
}
