import { memo } from "react";

import { useJackettSearch } from "../hooks/useJackettSearch";
import { ErrorDisplay } from "./ErrorDisplay";
import { Header } from "./Header";
import { IndexerChips } from "./IndexerChips";
import { IndexerSelector } from "./IndexerSelector";
import { InfoDisplay } from "./InfoDisplay";
import { ResultsTable } from "./ResultsTable";
import { SearchForm } from "./SearchForm";
import { SearchSuggestions } from "./SearchSuggestions";
import { SkeletonLoader } from "./SkeletonLoader";

// JackettSearch component for searching and displaying results
const JackettSearch = memo(() => {
  const {
    results,
    loading,
    error,
    info,
    searchQuery,
    setSearchQuery,
    indexerSelection,
    setIndexerSelection,
    indexers,
    indexersLoading,
    indexersError,
    refetchIndexers,
    selectedIndexerFilters,
    handleIndexerFilterToggle,
    handleClearIndexerFilters,
    fetchDataJackettWrapper,
    cancelSearch,
    handleCopy,
    inputRef,
  } = useJackettSearch();

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      <div className="flex flex-col w-full max-w-7xl mx-auto gap-6 sm:gap-12 p-3 sm:p-8 animate-fadeIn">
        {/* Unified Search Console */}
        <div className="flex flex-col w-full max-w-4xl mx-auto gap-4 sm:gap-8">
          <Header />

          <SearchForm
            ref={inputRef}
            onSubmit={(e: React.FormEvent) => {
              e.preventDefault();
              fetchDataJackettWrapper();
            }}
            onCancel={cancelSearch}
            loading={loading}
            showSuggestions={results.length === 0 && !loading}
            value={searchQuery}
            onChange={setSearchQuery}
          />

          {error && (
            <div className="w-full">
              <ErrorDisplay error={error} onRetry={fetchDataJackettWrapper} />
            </div>
          )}
          {info && (
            <div className="w-full">
              <InfoDisplay message={info} variant="info" />
            </div>
          )}

          <div className="mb-2 sm:mb-0">
            <IndexerSelector
              indexers={indexers}
              loading={indexersLoading}
              error={indexersError}
              selectionState={indexerSelection}
              onSelectionChange={setIndexerSelection}
              onRefetch={refetchIndexers}
            />
          </div>
        </div>

        {loading && results.length === 0 && (
          <div className="p-2 sm:p-4 animate-fadeIn">
            <SkeletonLoader rows={10} />
          </div>
        )}

        {results.length > 0 ? (
          <div className="space-y-6 sm:space-y-8">
            <ResultsTable
              results={results}
              onCopy={handleCopy}
              indexers={indexers}
              selectedIndexerFilters={selectedIndexerFilters}
              searchQuery={searchQuery}
              onClearIndexerFilters={handleClearIndexerFilters}
            />
            <div className="max-w-4xl mx-auto w-full">
              <IndexerChips
                results={results}
                indexers={indexers}
                selectedIndexerFilters={selectedIndexerFilters}
                onToggleFilter={handleIndexerFilterToggle}
                onClearFilters={handleClearIndexerFilters}
              />
            </div>
          </div>
        ) : (
          !loading && (
            <div className="max-w-4xl mx-auto w-full animate-fadeIn">
              <SearchSuggestions
                onSuggestionClick={(suggestion: string) => {
                  setSearchQuery(suggestion);
                  fetchDataJackettWrapper(suggestion);
                }}
              />
            </div>
          )
        )}
      </div>
    </div>
  );
});

export default JackettSearch;
