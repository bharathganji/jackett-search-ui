# Stage 8 Intermediate Zoom Out Review Report: UI/UX & Architecture Modernization

**Target:** `/home/ubuntu/projects/jackett-search-ui/docs/designs/ui_ux_architecture_modernization.md` (`Lines 1..374`)  
**Document Standard:** `zoom-out-standard.md`  
**Output Destination:** `/home/ubuntu/projects/jackett-search-ui/intermediate_zoom_out_report.md`

---

## Reviewer Status

| Reviewer       | Status    |
| -------------- | --------- |
| `egm-zoom-out` | completed |

---

## Severity Breakdown

- 🔴 **Blockers:** 2
- 🟡 **Major:** 3
- 🟢 **Nits:** 2
- **Total Findings:** 7

---

## Prioritized Findings (Blockers -> Major -> Nits)

### 1. Unresolved Top-of-Table Stream Jitter & Row Thrashing at `scrollTop === 0` - Severity: 🔴 Blocker

- **Reviewer Lens:** `egm-zoom-out`
- **Affected Scope:** Section "The Problem" #3 (Lines 18–19), Section "Technical Plan" (Lines 82–84, 108–110, 192–196), Detailed Implementation Plan File 4 (`useResultBatching.ts`, Lines 285–286)
- **Discrepancy Description**:
  The document identifies "Stream Jitter & Cursor Displacement (CLS)" when sorting by seeders as Problem #3, explicitly rejecting Alternative B ("Naive Live Re-Sorting on Every Incoming SSE Chunk") on the grounds that inserting rows into an active viewport displaces rows and causes misclicks.
  To resolve this, the document introduces a dual-buffer mechanism. However, stream buffering activates _only_ when `scrollTop > 0` ("Inspecting Stream"). When the user is at `scrollTop === 0` ("Initial & Anchored Stream"), incoming batches merge directly into `results` every 100ms via `requestAnimationFrame` and are re-sorted descending by `Seeders`.
  Every search journey begins at `scrollTop === 0`. During active multi-indexer streaming (which lasts 10–30 seconds across 15+ indexers), the user is positioned at `scrollTop === 0` reading the top results. Every 100ms, higher-seeded releases from slower indexers arrive, merge into `results`, re-sort descending, and prepend rows above or beneath the user's cursor.
  Consequently, the top of the table re-sorts and thrashes repeatedly under the user's cursor, directly reintroducing the exact cursor displacement, misclick hazard, and layout jitter the specification was chartered to eliminate.
- **Rationale & Recommendation**:
  Under `zoom-out-standard.md` Section 1 ("Root Problem Focus: Symptom vs. Root Cause"), the design treats layout shifts as a symptom of scrolling down, rather than addressing the root cause: live re-sorting an actively streaming dataset.
  1. Decouple stream intake from live re-sorting. Ingest incoming items into `results` without re-sorting the active view during the stream, or freeze the top visible slice once initial results appear.
  2. Alternatively, apply the stream buffer notification pill universally: render the first batch of results (e.g. after the first 500ms or 20 results), then buffer all subsequent incoming batches into `pendingBuffer` regardless of scroll position, displaying `"⚡ N new results available"`. This allows the user to inspect and click without row thrashing, putting the user in control of when the view updates.

### 2. Inverted Architecture & High-Frequency Scroll State Threading Across 4 Component Boundaries - Severity: 🔴 Blocker

- **Reviewer Lens:** `egm-zoom-out`
- **Affected Scope:** Section "Technical Plan" Mermaid Diagram (Lines 76–98), Section "Viewport-Aware Dual-Buffer" (Lines 104–110), Detailed Implementation Plan Files 2, 4, 5, 10 (Lines 267, 282, 293, 328)
- **Discrepancy Description**:
  The technical plan mandates that `<Virtuoso />` (a low-level presentation component inside `ResultsTable.tsx`) tracks scroll offset (`isAtTop = scrollTop === 0`) and threads this state upstream to `JackettSearch.tsx`, then into `useJackettSearch.ts`, and finally into `useResultBatching.ts`.
  This creates an inverted architectural dependency:
  1. A presentation component controls the internal queuing behavior of a network streaming hook.
  2. In React's component hierarchy, `useJackettSearch` is instantiated inside `JackettSearch`, before `ResultsTable` is rendered. To pass `isAtTop` into `useJackettSearch`, `ResultsTable` must emit scroll events that trigger state updates in `JackettSearch`, forcing the entire root console (including `SearchForm`, `Header`, and `IndexerSelector`) to re-render whenever the user scrolls to or from the top.
  3. `useResultBatching` then derives `pendingCount` and `flushPendingBuffer`, passing them back down through `useJackettSearch` and `JackettSearch` into `ResultsTable`.
- **Rationale & Recommendation**:
  Violates `zoom-out-standard.md` Section 2 ("Minimalist Data Flow: Ensure data passes through the minimal number of components") and Section 3 ("Right Placement / Architectural Fit").
  Network batching and presentation scroll stabilization should not be coupled across 4 layers.
  `useResultBatching` should focus purely on batching network SSE events to avoid excessive React state updates. Viewport stabilization and pending queue logic belongs in the results derivation/presentation layer (either inside `ResultsTable` or a dedicated `useResultsStream` controller hook). The presentation layer can decide what to render from the dataset without mutating network ingestion contracts or lifting high-frequency presentation scroll state to the application root.

### 3. Premature Optimization: Dropping Valid Search Results via 500-Item Buffer Ceiling - Severity: 🟡 Major

- **Reviewer Lens:** `egm-zoom-out`
- **Affected Scope:** Section "Viewport-Aware Dual-Buffer" (Line 109), Section "Risks & Mitigations" #1 (Lines 211–213), Detailed Plan File 4 (`useResultBatching.ts`, Line 283)
- **Discrepancy Description**:
  To mitigate memory growth (Critic Stage Finding #2), the design imposes a hard cap of 500 items on `pendingBufferRef`, discarding or dropping lower-seeded items when the buffer ceiling is reached while the user is scrolled down.
  In a multi-indexer search across 15+ trackers, total results frequently reach 1,500–3,000 items. 2,000 JavaScript result objects represent only ~1–2 MB of memory—well within modern desktop and mobile browser capabilities.
  Capping the buffer at 500 items and dropping results causes silent data loss: if a user searches for a rare release that has only 1–2 seeds, and 500 higher-seeded items arrive first from faster indexers, the rare release will be permanently dropped from the search results and never displayed to the user.
- **Rationale & Recommendation**:
  Violates `zoom-out-standard.md` Section 2 ("Premature Optimization: Avoid introducing complexity before performance bottlenecks are proven") and Section 1 ("Root Problem Focus"). A search UI's fundamental purpose is completeness of query results. Discarding valid torrent releases to save 1 MB of memory breaks this core purpose.
  Remove the destructive 500-item eviction cap. Keep all valid streamed results in memory. If memory throttling is ever needed on extreme queries (>10,000 items), cap the total stream at the network level in `useSearch.ts` rather than silently dropping lower-seeded items in a UI buffer.

### 4. Multi-Frame Re-render Churn from Progressive 100-Item rAF Flush - Severity: 🟡 Major

- **Reviewer Lens:** `egm-zoom-out`
- **Affected Scope:** Section "Viewport-Aware Dual-Buffer" (Lines 115–116), Section "Risks & Mitigations" #2 (Lines 216–217), Detailed Plan File 4 (`useResultBatching.ts`, Line 287)
- **Discrepancy Description**:
  The document specifies: _"When the user clicks the floating pill... `pendingBufferRef` merges into active results progressively using `startTransition` and `requestAnimationFrame` chunks (100 items per frame) to prevent UI thread lockup."_
  Splitting a 500-item pending buffer into 100-item chunks over 5 successive animation frames causes 5 separate React state updates, 5 successive array copies, 5 full-dataset re-sorts in `useFilteredResults`, and 5 Virtuoso re-measurements in under 85ms.
  This introduces significant thread churn and layout thrashing. Furthermore, in React 19, `startTransition` is already non-blocking and concurrent; the React scheduler automatically yields to user input during heavy state transitions. Layering a manual chunked `requestAnimationFrame` queue on top of `startTransition` is redundant, multiplies sorting overhead by 5x, and introduces intermediate race conditions if new SSE packets arrive mid-flush.
- **Rationale & Recommendation**:
  Violates `zoom-out-standard.md` Section 2 ("Simplicity: Avoid introducing complexity (async queues) before bottlenecks are proven") and Section 4 ("Platform Standards: Use established ecosystem frameworks").
  Eliminate the bespoke chunked `requestAnimationFrame` flush queue. Perform a single batch update wrapped in React 19's native `startTransition(() => { setResults(prev => [...prev, ...pendingBufferRef.current]); })`. React 19 will execute the derivation concurrently without freezing the main thread or causing multi-frame layout churn.

### 5. Single-Line Truncation of Release Titles Compromises Primary Torrent Usability - Severity: 🟡 Major

- **Reviewer Lens:** `egm-zoom-out`
- **Affected Scope:** Section "Continuous Virtualization Engine" (Lines 145–146), Section "Risks & Mitigations" #3 (Lines 220–222)
- **Discrepancy Description**:
  The specification mandates: _"Enforce single-line truncation (`truncate`) with title tooltips on desktop, and rely on `react-virtuoso`'s built-in ResizeObserver with deterministic item keys."_
  Torrent release titles routinely exceed 80–120 characters, with crucial discriminating metadata (codec: `HEVC`/`AV1`, resolution: `2160p`/`1080p`, source: `BluRay`/`WEB-DL`, audio: `DDP5.1`/`Atmos`, release group: `-FLUX`) positioned at the end of the title string.
  Truncating titles to a single line forces users to hover each individual row and wait for a desktop browser tooltip to compare releases. On touch-enabled devices or mobile screens where hover does not exist, truncated metadata is permanently inaccessible.
  The rationale provided (Risk #3: avoiding scrollbar jitter) is an unproven concern; `react-virtuoso` is built specifically to support variable-height items via its native `ResizeObserver`.
- **Rationale & Recommendation**:
  Violates `zoom-out-standard.md` Section 1 ("Root Problem Focus: Usability & Core Purpose") and Section 3 ("Premature Detail / Workarounds vs Structural Fixes").
  Allow release titles to wrap naturally across 2 lines with `break-words` or `line-clamp-2`, relying on `react-virtuoso`'s proven dynamic measurement. If truncation is used, ensure it does not hide essential release tags, or provide an expandable view.

### 6. Disruptive Auto-Scroll Animation on Pill Click Violates Motion Best Practices - Severity: 🟢 Nit

- **Reviewer Lens:** `egm-zoom-out`
- **Affected Scope:** Section "Viewport-Aware Dual-Buffer" (Line 114), Section "Detailed Implementation Plan - ResultsTable.tsx" (Line 268)
- **Discrepancy Description**:
  Line 114 specifies: _"When the user clicks the floating pill, `virtuosoRef.current.scrollToIndex({ index: 0, align: "start", behavior: "smooth" })` is executed."_
  If a user has scrolled down hundreds of items, forcing a 5,000px `behavior: "smooth"` scroll animation while concurrently flushing new items into the virtual list causes heavy frame drops as Virtuoso mounts and unmounts hundreds of intermediate DOM elements during the scroll.
  Furthermore, forcing smooth scroll without checking `prefers-reduced-motion` violates accessibility standards for users with vestibular disorders.
- **Rationale & Recommendation**:
  Violates `zoom-out-standard.md` Section 2 ("Simplicity & Ergonomics").
  Use instantaneous scrolling (`behavior: "auto"`) or respect user motion settings via `window.matchMedia("(prefers-reduced-motion: reduce)")`. Do not forcefully yank the scroll position if the user prefers to inspect the newly prepended items in their own time.

### 7. Lingering "Bento Grid" Buzzword Architecture vs Standard Search Interface - Severity: 🟢 Nit

- **Reviewer Lens:** `egm-zoom-out`
- **Affected Scope:** Overview (Line 13), Section 5 (Lines 165–173), Target File 1 (Line 255), Target File 10 (Lines 327–329)
- **Discrepancy Description**:
  While the speculative radar and cache telemetry widgets were removed in response to earlier reviews, the document still frames the entire UI modernization around an "Adaptive Bento-Grid Architecture" with custom CSS utilities (`.bento-grid`, `.bento-tile`) and "adaptive state shifting: hero layout on idle, compressed header ribbon on active search".
  The application is a focused search tool with a search bar, indexer selector, and results table. Branding standard card containers as a "Bento Grid" and shifting layouts between idle and active search states introduces unnecessary layout shift risks and CSS abstraction overhead without adding functional value.
- **Rationale & Recommendation**:
  Violates `zoom-out-standard.md` Section 2 ("YAGNI / Simplicity").
  Retain the clean, accessible token updates and responsive card styling, but drop speculative custom Bento layout abstractions. Maintain stable header and search container geometry between idle and active search states to prevent query-triggered layout shifts.

---

### Review Summary & Next Steps

- **Status:** Review completed with 2 Blockers, 3 Majors, and 2 Nits.
- **Report File Destination:** `/home/ubuntu/projects/jackett-search-ui/intermediate_zoom_out_report.md`
- **Recommended Action:** Address Blocker 1 (freezing/buffering top-of-table live re-sorting) and Blocker 2 (decoupling presentation scroll state from network batching) before progressing to Stage 9.
