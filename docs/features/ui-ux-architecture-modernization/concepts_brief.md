# UI/UX and Architecture Modernization for Jackett Search UI

- **Author:** Bharath Ganji (https://github.com/bharathganji)
- **Date:** 2026-11-09

## Overview

The `jackett-search-ui` application is a specialized React 19 web interface for querying torrent indexers via real-time Server-Sent Events (SSE) streaming. This modernization resolves existing usability and architectural shortcomings: an artificial 50-item pagination slice wrapping a virtualized table, suboptimal default sorting by relevance rather than peer availability, layout instability when streaming items re-sort under the user's cursor, main-thread blocking during client-side fuzzy filtering, and design token contrast deficiencies that fail accessibility standards.

The target outcome is an adaptive Bento-grid interface featuring true continuous full-dataset virtualization via `react-virtuoso`, default sorting by seeders, viewport-aware stream buffering to prevent layout shifts, in-place button micro-interactions, and React 19 concurrent filtering (`useDeferredValue`) to optimize Core Web Vitals (INP and CLS).

## Analysis

### 1. Inventive Contradictions & Resolutions (TRIZ)

- **Real-Time Streaming vs. Seeders Sort Stability**:
  - _Contradiction_: Users require default sorting by `Seeders` descending to find healthy swarms immediately. However, streaming in real-time results via SSE inserts high-seeder torrents at the top of the table mid-stream, displacing rows under the user's cursor and causing layout shifts (CLS).
  - _Resolution (Principle of Local Quality & Segmentation)_: Implement **Viewport-Aware Buffer Ingestion**. If the user is at the top (`scrollTop < 100px`), incoming results merge with requestAnimationFrame batching. If the user is actively inspecting rows (`scrollTop >= 100px`), incoming items accumulate in an uncommitted buffer, and a non-disruptive floating pill displays `"⚡ N new results available"`. Clicking the pill scrolls to the top and flushes the buffer.

- **High-Density Torrent Lists vs. Bento Grid Aesthetics**:
  - _Contradiction_: Consumer Bento grids emphasize large whitespace, oversized cards, and low information density. Torrent discovery requires high information density (compact rows displaying title, size, seeds, leechers, and indexer).
  - _Resolution (Adaptive State Shifting)_: In the pre-search idle state, Bento cards display the search console, recent search pills, indexer health matrices, and connection telemetry. Upon query submission, the Bento grid transitions into an active search state: search and active filters compress into a compact 12-column header ribbon, allocating maximum viewport height to the continuous virtualized results canvas.

- **Input Responsiveness vs. Comprehensive Fuzzy Scoring**:
  - _Contradiction_: Users want immediate character feedback while typing into the secondary filter, but running Fuse.js scoring across 2,000 items synchronously on every keystroke blocks the main thread for 120ms–280ms, degrading Interaction to Next Paint (INP).
  - _Resolution (Concurrent Scheduling)_: Decouple the text input state from filtering using React 19's `useDeferredValue`. The input element responds in under 16ms, while fuzzy scoring and virtual list re-rendering execute concurrently in the background.

### 2. Architectural & Codebase Details

- **Virtualization Architecture**:
  - Current implementation in `ResultsTable.tsx` slices data into 50-item pages and feeds that slice into `<Virtuoso />`. This redundant combination adds scroll container nesting bugs and defeats windowed virtualization.
  - The upgrade eliminates `PaginationControls`, `itemsPerPage`, and `currentPage`. The complete sorted array feeds directly into `<Virtuoso overscan={200} />` with stabilized key computation (`item.InfoHash || item.Link || `${item.IndexerId}-${index}``).
- **Design System & Contrast Tokens**:
  - Current CSS tokens in `src/index.css` provide only 3.5:1 contrast for the light mode primary color against background, failing WCAG AA (requires 4.5:1).
  - Light mode primary is darkened to `hsl(250 65% 42%)` (5.6:1 contrast ratio) and `--muted-foreground` to `hsl(220 20% 30%)`.
  - Explicit focus rings (`focus-visible:ring-2 focus-visible:ring-primary`) and 44×44px minimum mobile touch targets are enforced.
  - Numeric columns (Seeders, Leechers, Size) use `font-mono tabular-nums` to eliminate horizontal text jitter.
- **Micro-Interactions**:
  - Copy actions in table rows and mobile cards morph in-place: clicking the magnet icon transitions the button to a green checkmark icon with text feedback for 1,400ms before returning to its default state. This provides immediate spatial confirmation without requiring the user to look away to a floating toast.

## Goals vs. Non-Goals

### In-Scope Goals

- **Continuous Virtualization**: Replace the 50-item pagination slice inside `ResultsTable.tsx` with full-dataset windowing via `react-virtuoso`.
- **Default Seeders Sorting**: Set initial table sort to `Seeders` descending with strict numeric parsing (`Number(aVal) || 0`).
- **Viewport-Aware Stream Buffering**: Buffer incoming SSE results when the user is scrolled down, presenting a floating update trigger to eliminate layout shifts (CLS).
- **Deferred Fuzzy Filtering**: Wrap secondary fuzzy filter input in `useDeferredValue` to keep Interaction to Next Paint (INP) under 50ms.
- **WCAG AA Design System Tokens**: Standardize semantic light/dark mode CSS tokens with minimum 4.5:1 text contrast and 44px mobile touch targets.
- **Adaptive Bento Grid**: Build modular Bento containers for search, indexer availability chips, and telemetry stats that compress smoothly into a results header upon search.
- **In-Place Button Micro-Interactions**: Provide immediate tactile feedback (120ms press state, 1,400ms in-place checkmark morph) for link copy actions.

### Out-of-Scope Non-Goals

- **Backend Protocol Changes**: Zero modifications to `jackett-python` or upstream Jackett JSON/Torznab endpoints.
- **New Heavy Runtime Dependencies**: Sticking strictly to existing installed dependencies (`react-virtuoso`, `react 19`, `lucide-react`, `tailwindcss`). No new global state managers (Redux/Zustand) or styling frameworks.
- **Torrent Download Execution**: The client will not act as a BitTorrent client engine; it remains purely a search and discovery interface.

## Alternatives Weighed

- **Retaining 50-Item Pagination without Virtualization**: Rejected by author. Windowed virtualization allows continuous scanning of thousands of torrents across multiple indexers without pagination friction.
- **Naive Live Re-sorting on Every SSE Chunk**: Rejected by author. Inserting results into the active viewport mid-stream displaces rows and breaks click accuracy.
- **Offloading Fuzzy Filtering to a Dedicated Web Worker**: Weighed during ideation. Deferred in favor of React 19 `useDeferredValue`, which achieves sub-50ms INP with zero worker message-passing overhead and zero bundle scaffolding complexity.
- **Toast-Only Copy Confirmation**: Rejected by author. Floating toast alerts at the edge of the viewport are easily missed on desktop and mobile; in-place button state morphing provides spatial confirmation directly at the point of action.

## Key Decisions & Staging for Next Steps

### Key Decisions

1. **Virtualization Strategy**: Use `react-virtuoso` as the sole rendering mechanism for results; remove pagination controls and associated slice state.
2. **Default Sort Order**: Default to `Seeders` descending.
3. **Stream Buffer Ingestion**: Split stream handling into two modes: direct rAF ingestion when viewport scroll is anchored at top, and buffered ingestion with a floating notification badge when scrolled down.
4. **Input Scheduling**: Use React 19 `useDeferredValue` for client-side search filtering.
5. **Design System**: Apply Bento-grid card structure with WCAG AA compliant HSL color tokens.

### Staging Roadmap for `/egm-draft`

- **Phase 1: Virtualization & Sort Engine**: Remove pagination slicing from `useFilteredResults.ts`, configure `react-virtuoso` in `ResultsTable.tsx`, set default sort to `Seeders` desc, and implement viewport-aware batch buffering in `useResultBatching.ts`.
- **Phase 2: Deferred Filtering & Core Web Vitals**: Integrate `useDeferredValue` into filter input and stabilize Fuse instance lifecycle in `searchUtils.ts`.
- **Phase 3: Design Tokens & Bento Grid**: Upgrade `src/index.css` with 4.5:1 contrast tokens and refactor `JackettSearch.tsx` into modular Bento containers.
- **Phase 4: In-Place Micro-Interactions & Polish**: Upgrade row and card components with in-place copy state morphing, verify accessibility, and validate the complete Vitest suite.
