# Stage 5 Zoom Out Review: UI/UX & Architecture Modernization

**Target:** `/home/ubuntu/projects/jackett-search-ui/docs/designs/ui_ux_architecture_modernization.md` (`1..338`)
**Document Standard:** `zoom-out-standard.md`
**Output Destination:** `/home/ubuntu/projects/jackett-search-ui/zoom_out_report.md`

---

## Reviewer Status

| Reviewer                 | Status    |
| ------------------------ | --------- |
| `egm-zoom-out`           | completed |
| `egm-inventive-catalyst` | completed |

---

## Severity Breakdown

- 🔴 **Blockers:** 2
- 🟡 **Major:** 3
- 🟢 **Nits:** 2

---

## Prioritized Findings (Blockers -> Major -> Nits)

### 1. Stream Jitter & CLS Unresolved at `scrollTop <= 100px` (Contradiction Between Anchored Mode and Layout Stability) - Severity: 🔴 Blocker

- **Reviewer Lens:** `egm-inventive-catalyst` / `egm-zoom-out`
- **Affected Scope:** Section 2: Viewport-Aware Dual-Buffer Stream Pipeline (Lines 99–115), The Problem #3 (Lines 18–19), Alternative B (Lines 192–196)
- **Discrepancy Description**:
  The document identifies "Stream Jitter & Cursor Displacement (CLS)" when sorting by seeders as Problem #3, explicitly rejecting Alternative B ("Naive Live Re-Sorting on Every Incoming SSE Chunk") on the basis that inserting results into an active viewport displaces rows and causes misclicks.
  However, the proposed dual-buffer solution activates buffering _only_ when `scrollTop > 100px` ("Inspecting Mode"). In "Anchored Mode" (`scrollTop <= 100px`), incoming SSE chunks are flushed every 100ms directly into the active `results` state.
  When a search executes, the user is initially positioned at `scrollTop === 0`. During the first 5–10 seconds of active multi-indexer streaming, the user is reading the top rows at `scrollTop === 0`. Under this design, the top of the table will re-sort and thrash every 100ms as higher-seeded results arrive from slower indexers—reintroducing the exact disruptive cursor displacement and layout shifting the design intended to eliminate.
- **Rationale & Recommendation**:
  The assumption that layout shifts only matter when scrolled down is flawed; cursor displacement is most damaging when reading the initial top results.
  1. Decouple stream intake from live re-sorting: ingest incoming items into the dataset, but freeze the sorted presentation order once initial items appear, or defer sorting until the stream completes or the user requests an explicit re-sort.
  2. Alternatively, apply the notification pill mechanism universally: after an initial batch (e.g. first 20 items or 500ms), buffer subsequent items into `pendingBuffer` regardless of scroll position and display the pill `"⚡ N new results available (Top: X seeds)"`, allowing the user to read without row displacement.

---

### 2. Inverted Dependency & Missing Pipeline Abstraction in Implementation Plan (`useJackettSearch.ts` and `useSearch.ts` Omitted) - Severity: 🔴 Blocker

- **Reviewer Lens:** `egm-zoom-out`
- **Affected Scope:** Section 1 (Lines 74–97), Section 2 (Lines 103–109), Detailed Implementation Plan (Lines 227–320)
- **Discrepancy Description**:
  The Technical Plan mandates an inverted architectural dependency: `<Virtuoso />` (a low-level presentation component inside `ResultsTable.tsx`) detects scroll offsets and passes `isScrolledDown` upstream through `JackettSearch.tsx` to control `useResultBatching`.
  In the codebase, `useResultBatching` is instantiated inside `src/hooks/useJackettSearch.ts` (Line 59) and consumed by `src/hooks/useSearch.ts` (Lines 63–74).
  However, both `src/hooks/useJackettSearch.ts` and `src/hooks/useSearch.ts` are completely omitted from the "Target Files to Create/Modify" section (Files 1–12).
  Furthermore, passing high-frequency scroll state across multiple component boundaries (`ResultsTable` -> `JackettSearch` -> `useJackettSearch` -> `useResultBatching`) violates minimalist data flow and causes unnecessary re-renders across the root search view whenever the scroll threshold is crossed.
- **Rationale & Recommendation**:
  Add `src/hooks/useJackettSearch.ts` and `src/hooks/useSearch.ts` to the implementation plan. Refactor the architecture so presentation scroll state does not control network ingestion. Network streaming and batching should append to state predictably; viewport stability and pending item holds should be managed in the derivation/presentation layer (`ResultsTable` or a dedicated results controller hook), eliminating multi-tier state lifting and root re-render cascades.

---

### 3. Speculative "Bento Grid" Scope Creep Violates YAGNI and Induces Layout Shifts - Severity: 🟡 Major

- **Reviewer Lens:** `egm-zoom-out`
- **Affected Scope:** Overview (Line 13), Section 5: Bento-Grid Hierarchy (Lines 165–174), Target File 8 (`JackettSearch.tsx`, Lines 288–294)
- **Discrepancy Description**:
  The design specifies an "Adaptive Bento-Grid Architecture" featuring "Cell 2: Indexer health radar (ping, status, count)", "Cell 3: Recent searches and quick keyword chips", and "Cell 4: Aggregated statistics and cache metrics", which compress into a 12-column header ribbon upon active search.
  None of these widgets address the core problems listed in Section 2 (pagination redundancy, sorting defaults, stream jitter, INP lag, token contrast). The Jackett backend does not provide indexer ping or latency radar data, nor is cache telemetry part of the user journey. Introducing speculative dashboard widgets violates Zoom Out Standard Section 1 ("Root Problem Focus") and Section 2 ("YAGNI: Reject abstractions, code paths, or features built solely for speculative future requirements").
  Additionally, drastically shifting layouts between 4 expansive Bento boxes and a collapsed ribbon during query execution creates substantial Cumulative Layout Shift (CLS), contradicting the stated `0.00` CLS target.
- **Rationale & Recommendation**:
  Descale the layout scope. Eliminate unbacked speculative Bento surfaces (health radar, cache metrics, telemetry counters). Keep the focus on a clean, responsive search console and the continuous virtualized results table. Maintain stable container geometry between idle and active search states to prevent query-triggered layout shifts.

---

### 4. Fuse.js Memoization via 10% Length Delta Introduces Data Inconsistency and Conceals Architectural Mismatch - Severity: 🟡 Major

- **Reviewer Lens:** `egm-inventive-catalyst` / `egm-zoom-out`
- **Affected Scope:** Section 3: Non-Blocking Secondary Filtering (Line 136), Target File 11 (`searchUtils.ts`, Lines 307–312)
- **Discrepancy Description**:
  The design states: "Fuse.js instance creation in `searchUtils.ts` is memoized and only reconstructed when `results.length` changes by more than 10% or stream completes."
  This arbitrary threshold introduces a silent data omission bug: while results are actively streaming, any newly arrived torrents that do not cross the 10% delta (e.g. up to 100 new torrents in a 1,000-item list) will be completely absent from the Fuse index, making them unsearchable via the secondary filter.
  At an architectural level, rebuilding a multi-attribute Fuse index on an actively streaming dataset is an anti-pattern. For secondary in-memory filtering (where users filter for release keywords like "1080p", "hevc", or tracker names), an inverted index is unnecessary overhead.
- **Rationale & Recommendation**:
  1. For secondary in-memory filtering, use fast, normalized token/substring matching over `Title`, `IndexerId`, and `Year` rather than maintaining a heavyweight Fuse index during active streams.
  2. If Fuse.js is retained, reconstruct the index only after stream completion (`streamEnded === true`), or defer index builds to idle cycles using `requestIdleCallback`, rather than using an arbitrary length delta that causes data inconsistency.

---

### 5. Local State in Virtualized Presenters Causes State Loss and Leaks During Rapid Scrolling - Severity: 🟡 Major

- **Reviewer Lens:** `egm-inventive-catalyst`
- **Affected Scope:** Section 6: In-Place Micro-Interactions (Lines 175–182), Target Files 5 & 6 (`ResultsTableRow.tsx` Lines 267–275, `ResultsMobileCard.tsx` Lines 276–282)
- **Discrepancy Description**:
  The plan introduces local component state (`copiedType: "magnet" | "source" | null` with a 1,400ms auto-reset `setTimeout`) inside `ResultsTableRow` and `ResultsMobileCard` to drive button morphing.
  In `react-virtuoso`, row components are dynamically mounted and unmounted as the user scrolls. If a user clicks copy and scrolls down, the row unmounts, causing the timer to leak or fail to clean up. If the user scrolls back to that row within 1.4 seconds, the row remounts with fresh state, losing the visual confirmation.
- **Rationale & Recommendation**:
  Lift copied interaction state out of the virtualized item presenter into `ResultsTable` or a dedicated controller hook, storing `copiedId: string | null` (keyed by `InfoHash` or `Link`). Pass `isCopied: boolean` down to the row presenter. This preserves visual confirmation across virtualization recycling, eliminates unmounted timer leaks, and decouples presentation from timer lifecycles.

---

### 6. Fixed Row and Card Height Directives Conflict with Variable-Length Release Titles in Virtualized Windowing - Severity: 🟢 Nit

- **Reviewer Lens:** `egm-zoom-out`
- **Affected Scope:** Section 4 (Line 145), Target File 5 (Line 274), Target File 6 (Line 281)
- **Discrepancy Description**:
  The design enforces fixed row heights (`h-[52px]` on desktop) and fixed card min-heights (`min-h-[96px]` on mobile) to stabilize layout. Torrent titles are frequently 80–120+ characters long. Enforcing rigid fixed heights forces aggressive truncation or overflow, hiding crucial release quality tags (audio codecs, release group names) that appear at the end of the title.
- **Rationale & Recommendation**:
  `react-virtuoso` natively supports dynamic item measurement without blank flashing or layout shifting when given stable keys. Rather than hardcoding fixed 52px row heights that force truncation, allow flexible row height or multi-line titles with `break-words`, and rely on Virtuoso's dynamic height observer.

---

### 7. Incomplete Search Reset Lifecycle for Pending Stream Buffer - Severity: 🟢 Nit

- **Reviewer Lens:** `egm-zoom-out`
- **Affected Scope:** Section 2 (Lines 107–115), Target File 4 (`useResultBatching.ts`, Lines 258–266)
- **Discrepancy Description**:
  The document details `Anchored Mode`, `Inspecting Mode`, and user flush triggers for `pendingBufferRef`, but does not specify how the pending buffer and floating pill state are reset when a new search query is submitted or cancelled. If a previous search stream leaves pending items in the ref, a subsequent search could accidentally flush stale torrents from the earlier query into the new result set.
- **Rationale & Recommendation**:
  Explicitly specify in `useResultBatching`'s `cleanupBatches` method that `pendingBufferRef.current` and any pending count state must be cleared immediately upon `fetchDataJackett` invocation or `cancelSearch`.

---

## Conclusion

The design succeeds at pinpointing key UX bottlenecks (pagination/virtualization mismatch, seeder sorting, token contrast), but contains two critical architectural flaws:

1. It leaves the top-of-table view (`scrollTop <= 100px`) vulnerable to the exact stream jitter and CLS it set out to prevent.
2. It omits the primary coordinator hooks (`useJackettSearch.ts` and `useSearch.ts`) while attempting to drive network ingestion from presentation scroll events.
   Addressing these blockers and stripping out speculative Bento features will produce a clean, robust modernization plan.
