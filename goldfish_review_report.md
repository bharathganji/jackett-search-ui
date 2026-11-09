# Goldfish Annotated Review Report

**Target:** `/home/ubuntu/projects/jackett-search-ui/docs/designs/ui_ux_architecture_modernization.md` (`Lines 1..226`)

## Prioritized Findings & AI Suggestions

### 1. Missing Mandatory "Risks & Mitigations" Section [`egm-structural`, `egm-design`] - Severity: Blocker

- **Affected Scope:** Lines 1..226 (Pre-Section 7 / Architectural Scope)
- **Discrepancy Description:** The document completely omits the mandatory `Risks & Mitigations` section required by `feature-spec-standard.md`. While the specification proposes significant architectural shifts, it identifies zero failure modes or mitigations.
- **Elephant Disposition:** **PROPOSE FIX**
- **Proposed Textual Fix:**
  Add an explicit `## Risks & Mitigations` section to `docs/designs/ui_ux_architecture_modernization.md` covering:
  1. _Stream Buffer Memory Growth_: Capped at 500 items max with progressive chunked flushing.
  2. _Main-Thread Execution Stalls_: Offloading fuzzy evaluations to React 19 `useDeferredValue` and chunking buffer flushes.
  3. _Dynamic Title Height_: Relying on `react-virtuoso` dynamic height measurement and responsive overflow handling.
  4. _State Synchronization_: Strict search reset handlers clearing pending buffers upon new queries.

### 2. Unbounded Memory Growth and Flush Bottlenecks in Viewport-Aware Dual-Buffer [`egm-design`] - Severity: Blocker

- **Affected Scope:** Lines 76-85, 99-115 (`### 2. Viewport-Aware Dual-Buffer Stream Pipeline`)
- **Discrepancy Description:** The stream buffering mechanism queues all incoming SSE chunks into `pendingBuffer` without any upper boundary or eviction policy, risking memory exhaustion and main-thread freeze upon flush.
- **Elephant Disposition:** **PROPOSE FIX**
- **Proposed Textual Fix:**
  Update Section 2 to specify a bounded buffer of 500 items maximum (retaining highest seeders). Specify progressive chunked flushing using `startTransition` and `requestAnimationFrame` (100 items per frame) to prevent UI thread lockup.

### 3. Violation of Alternatives Rule: Rejections Attributed to Maintainer/Author Without Links [`egm-structural`, `egm-style`] - Severity: Blocker

- **Affected Scope:** Lines 185-206 (`## Alternatives Considered`)
- **Discrepancy Description:** All four alternatives document their rejection rationales as `"Rejected by author: [...]"` without citing links or framing rejections in terms of objective engineering trade-offs.
- **Elephant Disposition:** **PROPOSE FIX**
- **Proposed Textual Fix:**
  Remove all `"Rejected by author:"` phrasing in `## Alternatives Considered`. Frame all rejections around concrete technical trade-offs (e.g., interaction friction, visual layout displacement, serialization overhead, spatial disconnect).

### 4. Contradictory Trigger Thresholds and Prepend Jump on Scroll-to-Top Auto-Flush [`egm-design`] - Severity: Major

- **Affected Scope:** Lines 82-84, 105, 114
- **Discrepancy Description:** Contradictory trigger criteria between `scrollTop <= 100px` and `scrollTop === 0`. Auto-flushing while scrolling near top prepends rows and causes layout shifts.
- **Elephant Disposition:** **PROPOSE FIX**
- **Proposed Textual Fix:**
  Reconcile the threshold to `scrollTop === 0` (user anchored at exact top). If `scrollTop > 0`, incoming items are held in `pendingBuffer` and require clicking the floating pill, ensuring rows never shift under the user's cursor.

### 5. Inconsistent Fuse.js 10% Cache Invalidation Threshold and Missing Query Results [`egm-design`] - Severity: Major

- **Affected Scope:** Lines 136, 254-255 (`### 3. Non-Blocking Secondary Filtering Pipeline`)
- **Discrepancy Description:** The 10% length delta causes data omissions for newly streamed torrents during active filtering.
- **Elephant Disposition:** **PROPOSE FIX**
- **Proposed Textual Fix:**
  Replace the arbitrary 10% delta with fast normalized token/substring inclusion for secondary filtering during active streaming, and defer full Fuse index reconstruction to stream idle (`requestIdleCallback` after stream completion).

### 6. Mobile Overflow and Rigid Dimension Failures in Virtualization Container [`egm-design`, `egm-structural`] - Severity: Major

- **Affected Scope:** Lines 142-145 (`### 4. Continuous Virtualization Engine Configuration`)
- **Discrepancy Description:** Hardcoded `min-h-[500px]` causes layout overflow on mobile screens (<650px). Rigid `h-[52px]` clips long torrent titles.
- **Elephant Disposition:** **PROPOSE FIX**
- **Proposed Textual Fix:**
  Replace fixed heights with dynamic viewport units `h-[calc(100dvh-220px)] sm:h-[calc(100dvh-280px)]` and enable `react-virtuoso` dynamic height measurement with single-line title truncation and expandable tooltip/title display.

### 7. Promotional Fluff, Hyperbolic Tone, and Subjective Framing [`egm-style`] - Severity: Major

- **Affected Scope:** Lines 11-13, 26, 61, 177, 190, 194, 204
- **Discrepancy Description:** Promotional words ("artificial", "seamless", "violent row thrashing", "physics bounce").
- **Elephant Disposition:** **PROPOSE FIX**
- **Proposed Textual Fix:**
  Replace marketing phrasing with objective technical equivalents: "client-side 50-item pagination slice", "continuous scrolling", "active scale transition (`scale-[0.98]`)", "uncontrolled row reordering".

### 8. Uncalibrated Zero-CLS Claim Across Full Page Lifecycle [`egm-style`] - Severity: Nit

- **Affected Scope:** Lines 213-214 (`### 1. Performance & Latency`)
- **Discrepancy Description:** Unscoped 0.00 CLS across entire page.
- **Elephant Disposition:** **PROPOSE FIX**
- **Proposed Textual Fix:**
  Scope target to the results canvas: "Achieve 0.00 Cumulative Layout Shift (CLS) within the virtualized results container during active SSE stream intake."

### 9. Heading Numbering and Formatting Inconsistencies [`egm-structural`] - Severity: Nit

- **Affected Scope:** Document headings
- **Discrepancy Description:** Inconsistent heading prefixing across sections.
- **Elephant Disposition:** **PROPOSE FIX**
- **Proposed Textual Fix:**
  Normalize subsection headers to clean unnumbered headings matching standard Markdown layout.
