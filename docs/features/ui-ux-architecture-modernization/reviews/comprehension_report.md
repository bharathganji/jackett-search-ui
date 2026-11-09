# Comprehension Review Report: UI/UX & Architecture Modernization

**Target:** `/home/ubuntu/projects/jackett-search-ui/docs/designs/ui_ux_architecture_modernization.md` (`1..338`)

## What this proposes

The proposal redesigns `jackett-search-ui` into an adaptive Bento-grid interface that replaces artificial page-based pagination slicing with continuous full-dataset windowing powered by `react-virtuoso`. It establishes `Seeders` descending as the default sort order and introduces a viewport-aware dual-buffer mechanism that queues incoming real-time SSE torrent results when scrolled down to eliminate Cumulative Layout Shift (CLS). In addition, it offloads client-side secondary fuzzy filtering onto React 19's `useDeferredValue` to maintain sub-50ms Interaction to Next Paint (INP), upgrades color tokens and mobile touch targets to achieve WCAG AA compliance, and implements localized, in-place button morphs for link copying.

## How the existing system works, per this document

The existing application streams torrent results from multiple Jackett indexers in real time over Server-Sent Events (SSE) and displays them in a hybrid table that partitions results into 25–200 item pages before rendering with `<Virtuoso />`. Results default to relevance sorting and are re-sorted/inserted on incoming SSE chunks every 100ms, causing rows to jump under the user's cursor during active stream intake. Secondary fuzzy filtering synchronously invokes Fuse.js across the entire dataset on every keystroke in the main thread, leading to high input lag (>150ms INP). Finally, design tokens fail WCAG AA contrast standards (3.5:1), touch targets lack consistent 44px sizing, and copying links relies on edge floating toasts without in-place feedback.

---

### Findings

#### 1. Undefined Concepts & Phantom Components in Bento-Grid Layout

- **Severity**: Blocker
- **Affected Scope**: Section 5 ("Bento-Grid Surface Layout", lines 165–174) and Section 8 ("Detailed Implementation Plan - JackettSearch.tsx", lines 288–294).
- **Discrepancy Description & Rationale**:
  The document introduces four Bento cells for the idle and active states:
  - _Bento Cell 2_: "Indexer health radar (ping, status, count)"
  - _Bento Cell 3_: "Recent searches and quick keyword chips"
  - _Bento Cell 4_: "Aggregated statistics and cache metrics"
  - _Active Search Ribbon_: Telemetry counter showing `428 torrents | 12 indexers | 48ms`

  None of these concepts or data sources are defined anywhere in the document:
  1. There is no specification for where indexer "ping" or "health status" is sourced, especially since Line 36 explicitly establishes "Backend Protocol Modifications" (API contracts, Jackett configs) as a Non-Goal.
  2. "Cache metrics" and "aggregated statistics" are undefined—the reader is not told what statistics exist, how they are computed, or where they reside.
  3. The latency metric (`48ms`) has no defined timer or telemetry hook.
  4. In Section "Target Files to Create/Modify" (lines 227–319), no components are created or designated to house or render these Bento cells. A new developer has no blueprint to build these surfaces.

#### 2. Missing Prerequisite Architecture / File Modification: `src/hooks/useJackettSearch.ts`

- **Severity**: Major
- **Affected Scope**: Section 2 ("Viewport-Aware Dual-Buffer Stream Pipeline", lines 99–115), `useResultBatching.ts` (lines 258–266), and `ResultsTable.tsx` (lines 239–249).
- **Discrepancy Description & Rationale**:
  The design modifies `useResultBatching.ts` to require a new `isScrolledDown: boolean` input parameter and expose `pendingCount: number` and `flushPendingBuffer()`. Concurrently, `ResultsTable.tsx` is modified to detect Virtuoso scrolling and mount the `"⚡ N new results available"` pill.
  However, in the application architecture, `useResultBatching` is instantiated inside `src/hooks/useJackettSearch.ts`, which connects data flow to `JackettSearch.tsx` and down to `ResultsTable.tsx`.
  `src/hooks/useJackettSearch.ts` is omitted from the "Target Files to Create/Modify" list (lines 227–320). Following the implementation plan as written leaves a broken compilation contract on `useResultBatching` and provides no path to thread `isScrolledDown` upstream or `pendingCount` / `flushPendingBuffer` downstream.

#### 3. Contradictory Thresholds for Flushing the Pending Ingestion Queue

- **Severity**: Major
- **Affected Scope**: Section "Open Questions" (line 42), Section 2 ("Viewport-Aware Dual-Buffer Stream Pipeline", lines 105, 108, 114), and Detailed Plan (line 265).
- **Discrepancy Description & Rationale**:
  The document provides conflicting definitions for when the pending queue automatically flushes:
  - Line 42 (Open Questions), Line 114 (Flush Triggers), and Line 265 (`useResultBatching.ts`) state that pending items flush automatically when the user returns to the top (`scrollTop === 0`).
  - Line 105 and Line 108 (Anchored Mode) state that `isScrolled = scrollOffset > 100`, and that in Anchored Mode (`!isScrolled`, i.e., `scrollOffset <= 100`), incoming SSE result chunks flush directly into `results` every 100ms.
    If the user scrolls from 300px back to 80px, `scrollOffset <= 100` is true. The document does not clarify whether the buffer flushes at 80px or waits for 0px. If it flushes at 80px while the user is actively reading rows, rows will shift unexpectedly, contradicting the zero-CLS design goal.

#### 4. Inaccurate and Undefined "Ring Buffer" Terminology

- **Severity**: Major
- **Affected Scope**: Section 1 (Mermaid Diagram, line 78) and Section 4 ("Detailed Implementation Plan - useResultBatching.ts", lines 258–266).
- **Discrepancy Description & Rationale**:
  The ingestion mechanism is labeled a "Viewport-Aware Ring Buffer". In standard computer science, a ring buffer is a fixed-capacity, circular data structure that overwrites or drops oldest elements on overflow. For a torrent search aggregator, silently dropping stream results would lead to lost search hits.
  Line 109 and Line 262 describe an append-only ref array (`pendingBufferRef: React.MutableRefObject<JackettSearchResult[]>`) that holds items until flushed. Describing an append queue as a "Ring Buffer" without defining capacity, wrap-around semantics, or overflow policies is misleading engineering jargon.

#### 5. React Re-rendering Gap for Ref-Based Pending Buffer

- **Severity**: Major
- **Affected Scope**: Section 2 (lines 109–111) and Detailed Plan (lines 262–264).
- **Discrepancy Description & Rationale**:
  Line 262 specifies appending incoming items to `pendingBufferRef: React.MutableRefObject<JackettSearchResult[]>`. Line 110 states: "When `pendingBuffer.length > 0`, an absolute-positioned floating pill is mounted".
  Mutating a React ref does not trigger a re-render. If chunks are appended to a ref, the component tree in `ResultsTable.tsx` will not re-render to display the floating pill or update the counter. The document needs to specify whether `pendingCount` is backed by a React state hook (`useState`) to trigger reactivity upon chunk arrival.

#### 6. Undefined and Inconsistent `topSeedCount` Variable

- **Severity**: Nit
- **Affected Scope**: Section 2 (line 111) vs CUJ 2 (line 54) vs Detailed Plan (lines 248, 263).
- **Discrepancy Description & Rationale**:
  Line 111 formats the floating pill as `"⚡ {pendingBuffer.length} new torrents available (Top: {topSeedCount} seeds)"`.
  `topSeedCount` is never defined or calculated, and is omitted in CUJ 2 (line 54: `"⚡ 20 new results available"`), in the `ResultsTable.tsx` plan (line 248: `"⚡ N new results available"`), and in the `useResultBatching.ts` API (line 263: only exposes `pendingCount: number`).

#### 7. Vague Detection Mechanism for "Stream Completes"

- **Severity**: Nit
- **Affected Scope**: Section 3 (line 136) and Detailed Plan (line 310).
- **Discrepancy Description & Rationale**:
  Line 136 states that the Fuse.js instance is reconstructed "when `results.length` changes by more than 10% or stream completes."
  `useFilteredResults` and `searchUtils` currently only take data arrays. The document does not describe how stream completion is detected, passed to, or tracked by the memoized Fuse indexing logic.

#### 8. Inconsistent Legacy Pagination Page Sizing

- **Severity**: Nit
- **Affected Scope**: Overview (line 11), The Problem (line 17), and Continuous Virtualization Engine Configuration (line 140).
- **Discrepancy Description & Rationale**:
  Line 11 and Line 140 refer to an "artificial 50-item pagination slice" and "legacy 50-item pagination slice", while Line 17 refers to "25–200 item pages". Clarifying that 50 is the default page size within a 25–200 selectable range avoids minor confusion.
