# Goldfish Critic Review Report (Stage 7)

**Target:** `/home/ubuntu/projects/jackett-search-ui/docs/designs/ui_ux_architecture_modernization.md` (`Lines 1..226`)
**Standard:** `resources/document_standards/feature-spec-standard.md`

## Reviewer Status

| Reviewer         | Status    |
| ---------------- | --------- |
| `egm-design`     | completed |
| `egm-structural` | completed |
| `egm-style`      | completed |

## Severity Breakdown

- 🔴 **Blocker**: 3
- 🟡 **Major**: 4
- 🟢 **Nit**: 2
- **Total Findings**: 9

## Prioritized Findings (Blockers -> Major -> Nits)

### 1. Missing Mandatory "Risks & Mitigations" Section - Severity: Blocker

- **Reviewer Lens:** `egm-structural`, `egm-design`
- **Affected Scope:** Lines 1..226 (Structural layout / Post-Section 8)
- **Discrepancy Description**: The document completely omits the mandatory `Risks & Mitigations` section required by `feature-spec-standard.md`. While the specification proposes significant architectural shifts (continuous buffer queuing during streaming, full-dataset virtualization, and concurrent filtering), it identifies zero failure modes, memory ceilings, or mitigations.
- **Rationale & Recommendation**: `feature-spec-standard.md` mandates: _"The specification must explicitly call out its own constraints. It must identify potential failure modes, security implications, scalability limits, and how they will be mitigated."_
  Add an explicit `## Risks & Mitigations` section addressing:
  1. Memory bloat from unbounded stream buffer accumulation when the user is scrolled down.
  2. Main-thread stalls during high-volume buffer flushes.
  3. Dynamic row height calculation glitches in `react-virtuoso` with multi-line torrent titles.
  4. Fallback behavior when React 19 `useDeferredValue` operates under sustained CPU pressure.

### 2. Unbounded Memory Growth and Flush Bottlenecks in Viewport-Aware Dual-Buffer - Severity: Blocker

- **Reviewer Lens:** `egm-design`
- **Affected Scope:** Lines 76-85, 99-115 (`### 2. Viewport-Aware Dual-Buffer Stream Pipeline`)
- **Discrepancy Description**: The stream buffering mechanism queues all incoming SSE chunks into `pendingBuffer` while `isScrolled` is true, without any upper boundary or eviction policy. Furthermore, when the user clicks the pill or returns to scroll 0, the entire pending buffer is dumped directly into state at once, risking massive main-thread lockups and UI freezes.
- **Rationale & Recommendation**: A multi-indexer search across 15+ trackers can return thousands of results over 30–60 seconds. An unbounded queue risks excessive memory consumption on mobile devices. When flushed, synchronizing thousands of items in one state transition will force heavy recalculation in `useFilteredResults` and `Fuse.js`, causing severe INP spikes.
  Recommendation:
  1. Establish a bounded ring buffer or max queue size (e.g., maximum 500 pending items, dropping lower-seeded duplicates or alerting the user).
  2. Implement a chunked or progressive flush using `requestAnimationFrame` or `startTransition` to yield back to the main thread instead of an instantaneous monolithic state update.

### 3. Violation of Alternatives Rule: Rejections Attributed to Maintainer/Author Without Links - Severity: Blocker

- **Reviewer Lens:** `egm-structural`, `egm-style`
- **Affected Scope:** Lines 185-206 (`## Alternatives Considered`, Lines 190, 195, 200, 205)
- **Discrepancy Description**: All four alternatives in `## Alternatives Considered` document their rejection rationales as `"Rejected by author: [...]"` without citing or linking to any maintainer discussions, issues, or PRs.
- **Rationale & Recommendation**: `feature-spec-standard.md` explicitly dictates: _"Rejection rationales must state concrete technical or scope trade-offs and must not attribute a rejection to a maintainer without linking their issue, discussion, or PR."_
  Remove all `"Rejected by author:"` phrasing and restate each rejection purely in terms of objective technical trade-offs (complexity, latency, memory overhead, layout shifts), or link to concrete discussion threads if maintainer input was given.

### 4. Contradictory Trigger Thresholds and Prepend Jump on Scroll-to-Top Auto-Flush - Severity: Major

- **Reviewer Lens:** `egm-design`
- **Affected Scope:** Lines 82-84, 105, 114
- **Discrepancy Description**: The document contains contradictory trigger criteria for buffer flushing: Section 1 (Line 82) states `scrollTop <= 100px` flushes to `ActiveStore`, while Section 2 (Line 114) specifies `scrollTop === 0`. Furthermore, auto-flushing newly discovered torrents with high seeds while the user is actively scrolling near the top will immediately prepend rows above the viewport, shifting the rows under the user's focus and causing the exact Cumulative Layout Shift (CLS) the design aims to prevent.
- **Rationale & Recommendation**: Reconcile the threshold definitions across Sections 1 and 2. Require that auto-flush only occurs when the user is explicitly idle at the exact top (`scrollTop === 0` and user is not actively touching/dragging the scrollbar), or require manual pill interaction whenever items would be prepended above the current viewport.

### 5. Inconsistent Fuse.js 10% Cache Invalidation Threshold and Missing Query Results - Severity: Major

- **Reviewer Lens:** `egm-design`
- **Affected Scope:** Lines 136, 254-255 (`### 3. Non-Blocking Secondary Filtering Pipeline`)
- **Discrepancy Description**: Line 136 specifies: _"Fuse.js instance creation in `searchUtils.ts` is memoized and only reconstructed when `results.length` changes by more than 10% or stream completes."_ During active streaming, newly arriving items will not be indexed by Fuse until the 10% boundary is met. If a user is filtering by a specific term, newly streamed torrents containing that term will be completely invisible until a threshold is crossed, creating unpredictable data omissions. Moreover, rebuilding Fuse every 10% on large datasets during active stream intake introduces recurring background thread churn.
- **Rationale & Recommendation**: During active streaming with an active secondary filter, either:
  1. Perform linear substring/regex matching against incoming batches, or
  2. Debounce Fuse reconstruction to idle periods (e.g. `requestIdleCallback`) while querying raw results with basic inclusion fallbacks, ensuring all incoming data is searchable without locking up the CPU.

### 6. Mobile Overflow and Rigid Dimension Failures in Virtualization Container - Severity: Major

- **Reviewer Lens:** `egm-design`, `egm-structural`
- **Affected Scope:** Lines 142-145 (`### 4. Continuous Virtualization Engine Configuration`)
- **Discrepancy Description**: Enforcing `h-[calc(100vh-280px)] min-h-[500px]` causes layout overflow on mobile screens where total viewport height is often under 650px (e.g., iPhone SE at 667px leaves only 387px, which is overridden by `min-h-[500px]` to blow past the viewport). Additionally, enforcing a fixed `h-[52px]` on desktop table rows ignores verbose torrent release names (which often include audio formats, encoders, and group tags) that wrap onto 2 lines, resulting in text clipping or broken row layout.
- **Rationale & Recommendation**:
  1. Replace fixed `min-h-[500px]` with flexible viewport-relative constraints using `dvh` (e.g. `h-[calc(100dvh-220px)] sm:h-[calc(100dvh-280px)]`) or flexbox container layout (`flex-1 min-h-0`).
  2. Allow `react-virtuoso` to perform dynamic row measurement rather than forcing rigid `h-[52px]`, or set explicit truncation rules (`truncate` / `line-clamp-1`) with tooltip/popover expansion on desktop rows.

### 7. Promotional Fluff, Hyperbolic Tone, and Subjective Framing - Severity: Major

- **Reviewer Lens:** `egm-style`
- **Affected Scope:** Lines 11-13, 26, 61, 177, 190, 194, 204
- **Discrepancy Description**: The document contains marketing adjectives, exaggerated claims, and pseudo-technical jargon: _"artificial 50-item pagination slice"_, _"smooth windowing"_, _"One-Click Tactile Link Copying"_, _"120ms physics bounce"_, _"seamless scanning"_, _"violent row thrashing"_, and _"outside the user's primary foveal focus"_.
- **Rationale & Recommendation**: EGM standards require dry, factual, objective engineering language (`CALIBRATE` / `DROP`):
  - Replace _"artificial 50-item pagination slice"_ with _"client-side 50-item pagination slice"_.
  - Replace _"physics bounce"_ with _"active scale transition (`scale-[0.98]`)"_.
  - Replace _"seamless scanning"_ with _"continuous scrolling"_.
  - Replace _"violent row thrashing"_ with _"uncontrolled row reordering and layout shifts"_.
  - Replace _"outside the user's primary foveal focus"_ with _"outside the immediate viewport center"_.

### 8. Uncalibrated Zero-CLS Claim Across Full Page Lifecycle - Severity: Nit

- **Reviewer Lens:** `egm-style`
- **Affected Scope:** Lines 213-214 (`### 1. Performance & Latency`)
- **Discrepancy Description**: Line 213 asserts: _"Must achieve `0.00` layout shift during stream intake by strictly reserving virtual canvas boundaries..."_ Cumulative Layout Shift is a whole-page metric sensitive to initial font loading, dynamic banner rendering, and scrollbar layout shifts. Stating `0.00` as an absolute system-wide requirement without scoping it to the component level is uncalibrated.
- **Rationale & Recommendation**: `CALIBRATE` the claim to target the results container specifically: _"Achieve 0.00 Cumulative Layout Shift (CLS) within the virtualized results container during active SSE stream intake by enforcing stable bounding containers and queuing off-screen items."_

### 9. Heading Numbering and Formatting Inconsistencies - Severity: Nit

- **Reviewer Lens:** `egm-structural`
- **Affected Scope:** Lines 44-65, 68-182, 185-206, 209-225
- **Discrepancy Description**: Inconsistent section and subsection labeling throughout the document: Section 68 and Section 209 use numeric prefixes (`### 1. Architectural System Overview`, `### 1. Performance & Latency`), Section 44 uses CUJ prefixes (`### CUJ 1: ...`), and Section 185 uses letters (`### Alternative A: ...`). Furthermore, Section 5 introduces H4 headings (`#### Token Contrast Specifications`) while other H3 sections remain flat.
- **Rationale & Recommendation**: Standardize subsection titling across the specification for structural symmetry. Remove arbitrary numbering from H3 headings or ensure consistent hierarchical numbering throughout all sections.
