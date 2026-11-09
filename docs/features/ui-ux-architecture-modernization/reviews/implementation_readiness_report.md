# Implementation Readiness Audit Report: UI/UX Architecture Modernization

**Target:** `/home/ubuntu/projects/jackett-search-ui/docs/designs/ui_ux_architecture_modernization.md` (`247..374`)
**Document Standard:** `implementation-readiness-standard.md`

## Reviewer Status

| Reviewer                       | Status    |
| ------------------------------ | --------- |
| `egm-implementation-readiness` | completed |
| `egm-codebase-details`         | completed |
| `egm-style`                    | completed |

## Summary of Findings

- 🔴 **Blockers**: 2
- 🟡 **Major**: 6
- 🟢 **Nits**: 3

---

## Prioritized Findings (Blockers -> Major -> Nits)

### 1. Complete Absence of Phasing & Checkpoints - Severity: Blocker

- **Reviewer Lens:** `egm-implementation-readiness`
- **Affected Scope:** Lines 247–355 (`### Target Files to Create/Modify`)
- **Discrepancy Description**:
  The implementation plan presents an unsequenced, flat list of 14 target files without phased grouping, order of execution, or intermediate verification checkpoints. Modifying files in isolation (for instance, removing pagination from `useFilteredResults.ts` before modifying `ResultsTable.tsx`, or changing `useResultBatching.ts` before updating `useJackettSearch.ts`) immediately breaks TypeScript compilation (`tsc -b`) and leaves the repository unbuildable during development.
- **Rationale & Recommendation**:
  The _Implementation Readiness Standard_ mandates that: _"The plan must partition the work into logical, incremental phases. Each phase must leave the codebase in a stable, buildable, and testable state."_
  Restructure the plan into distinct, testable phases, such as:
  - **Phase 1: Foundations & Token Modernization** (`src/index.css`, `src/components/Header.tsx`, `src/components/IndexerSelector.tsx`). Checkpoint: `npm run build && npm run lint`.
  - **Phase 2: Stream Queue & Pure Utilities** (`src/lib/searchUtils.ts`, `src/lib/searchUtils.test.ts`, `src/hooks/useResultBatching.ts`). Checkpoint: `npm test`.
  - **Phase 3: Hook Orchestration & Data Pipeline** (`src/hooks/useFilteredResults.ts`, `src/hooks/useJackettSearch.ts`, `src/hooks/useSearch.ts`). Checkpoint: Unit tests pass.
  - **Phase 4: Component Presentation & Virtualization** (`src/components/ResultsTable.tsx`, `ResultsTableRow.tsx`, `ResultsMobileCard.tsx`, deletion of `PaginationControls.tsx`). Checkpoint: Virtual scroll render tests.
  - **Phase 5: Container Integration & Verification** (`src/components/JackettSearch.tsx`, build and accessibility checks).

### 2. Missing Interface & Prop Contracts Across Component/Hook Boundaries - Severity: Blocker

- **Reviewer Lens:** `egm-implementation-readiness` / `egm-codebase-details`
- **Affected Scope:** Lines 259–296, 324–330 (`ResultsTable.tsx`, `useFilteredResults.ts`, `useResultBatching.ts`, `useJackettSearch.ts`, `JackettSearch.tsx`)
- **Discrepancy Description**:
  The plan establishes cross-cutting reactive data flows between `ResultsTable`, `JackettSearch`, `useJackettSearch`, and `useResultBatching`, but fails to define the TypeScript interface contracts:
  1. `ResultsTableProps` does not declare how `pendingCount: number`, `onFlushPending: () => void`, and `isAtTop` reporting (`onScrollTopChange?: (isAtTop: boolean) => void`) are typed or passed.
  2. `useFilteredResults` removes `itemsPerPage`, `currentPage`, and `paginatedResults`, but does not define the new `UseFilteredResultsProps` interface or specify whether `filter` is replaced with `deferredFilter` or retained as `filter: string`.
  3. `useResultBatching` accepts `isAtTop: boolean`, but does not specify the updated signature of `UseResultBatchingProps` or how `flushPendingBuffer` and `pendingCount` are typed and returned.
  4. `useJackettSearch` states "Wire `isAtTop` state from the results view into `useResultBatching`", but does not specify how `isAtTop` state is instantiated (e.g. `const [isAtTop, setIsAtTop] = useState(true)`) or how `setIsAtTop` is exposed to `JackettSearch.tsx`.
- **Rationale & Recommendation**:
  Under the _Zero-Decision Rule_, an implementer must not guess prop names, callback signatures, or state ownership. Provide explicit TypeScript interface declarations for `ResultsTableProps`, `UseFilteredResultsProps`, and `UseResultBatchingProps` directly in the plan.

### 3. Invalid CSS Token Value Format for Tailwind Variable System - Severity: Major

- **Reviewer Lens:** `egm-codebase-details`
- **Affected Scope:** Lines 253–254 (`src/index.css`)
- **Discrepancy Description**:
  Line 254 specifies:
  `Update :root and .dark variables with verified WCAG AA compliant colors (light mode --primary at hsl(250 65% 42%), --muted-foreground at hsl(220 20% 30%))`.
  In `src/index.css` and `tailwind.config.js`, the color variables are raw HSL channel triplets (e.g. `--primary: 250 50% 60%`), which Tailwind expands via `hsl(var(--primary))`. Providing `hsl(...)` inside the variable value results in invalid CSS `hsl(hsl(250 65% 42%))`, breaking all Tailwind utilities referencing `bg-primary`, `text-primary`, etc.
- **Rationale & Recommendation**:
  Change the specification to omit the `hsl(...)` functional wrapper:
  - `--primary: 250 65% 42%;`
  - `--muted-foreground: 220 20% 30%;`
    Additionally, explicitly list the corresponding `.dark` variables (`--primary: 250 85% 72%;`, `--muted-foreground: 217 15% 70%;`) rather than leaving dark mode unstated in the implementation plan.

### 4. Ambiguous In-Place Copy State Granularity for Multi-Button Rows - Severity: Major

- **Reviewer Lens:** `egm-codebase-details` / `egm-implementation-readiness`
- **Affected Scope:** Lines 306–307, 315 (`ResultsTableRow.tsx`, `ResultsMobileCard.tsx`)
- **Discrepancy Description**:
  The plan specifies that `ResultsTableRow` and `ResultsMobileCard` accept `isCopied: boolean`. However, each row and mobile card has _two_ distinct actionable buttons: "Magnet" and "Source/Details". A single boolean `isCopied` cannot identify which button was activated. If `isCopied` is true, both buttons would either morph simultaneously or the implementer would have to make an undocumented choice about which button to morph.
- **Rationale & Recommendation**:
  Define a granular copy state:
  `copiedButton: "magnet" | "source" | null` (or `copiedId: string | null` where the ID encodes the target, e.g. `${id}:magnet`). Update the component props to accept `copiedAction?: "magnet" | "source" | null` (or separate booleans `isMagnetCopied: boolean`, `isSourceCopied: boolean`).

### 5. Unsafe `requestIdleCallback` Execution in Node / Vitest Environments - Severity: Major

- **Reviewer Lens:** `egm-codebase-details`
- **Affected Scope:** Line 347 (`src/lib/searchUtils.ts`)
- **Discrepancy Description**:
  Line 347 states: _"Schedule full Fuse.js indexing only upon stream completion via `requestIdleCallback`."_
  `requestIdleCallback` is a browser window API that is not implemented in Node.js, causing Vitest unit tests in `searchUtils.test.ts` to throw `ReferenceError: requestIdleCallback is not defined`. Furthermore, `requestIdleCallback` is not universally supported in Safari without a polyfill/fallback.
- **Rationale & Recommendation**:
  Specify a safe scheduling utility fallback:
  ```ts
  const scheduleIdle =
    typeof window !== "undefined" && "requestIdleCallback" in window
      ? window.requestIdleCallback
      : (cb: () => void) => setTimeout(cb, 1);
  ```
  Explicitly specify the function export in `searchUtils.ts` (e.g., `export function rebuildFuseIndex(results: JackettSearchResult[]): void`) so callers and unit tests can invoke or mock it deterministically.

### 6. Architectural and Layout Ambiguity in "Adaptive Bento Grid" and "State Shifting" - Severity: Major

- **Reviewer Lens:** `egm-implementation-readiness`
- **Affected Scope:** Lines 327–329 (`src/components/JackettSearch.tsx`), Lines 255–256 (`src/index.css`)
- **Discrepancy Description**:
  The plan instructs to:
  - "Define Bento container layout utilities (`.bento-grid`, `.bento-tile`)."
  - "Restructure top layout into Bento-grid surfaces separating search input, indexer status, and results canvas."
  - "Implement adaptive state shifting: hero layout on idle, compressed header ribbon on active search."
    None of the CSS rules for `.bento-grid` or `.bento-tile` are provided. No state condition is defined for what constitutes "idle" vs "active search" (`results.length > 0`, `loading`, or `searchQuery.length > 0`). No layout JSX markup or Tailwind grid definitions are supplied. The implementer must invent both the CSS class rules and the layout structure from scratch.
- **Rationale & Recommendation**:
  Provide the concrete CSS definitions for `.bento-grid` and `.bento-tile` in `src/index.css`. In `JackettSearch.tsx`, define the exact boolean trigger (e.g., `const isSearchActive = loading || results.length > 0;`) and describe the explicit layout tree for both states.

### 7. Misaligned Unit Test Scope: Sorter Testing Assigned to `searchUtils.test.ts` - Severity: Major

- **Reviewer Lens:** `egm-codebase-details`
- **Affected Scope:** Lines 349–355 (`src/lib/searchUtils.test.ts`)
- **Discrepancy Description**:
  Line 352 specifies adding tests to `src/lib/searchUtils.test.ts` for _"verifying Seeders descending numeric sort under string and number payloads"_.
  In the codebase, sorting is entirely implemented within the `useFilteredResults` hook (`src/hooks/useFilteredResults.ts`, lines 43–71), not inside `src/lib/searchUtils.ts`. `searchUtils.ts` handles fuzzy relevance scoring, not array sorting. Adding sort tests to `searchUtils.test.ts` requires either exporting a new sorting helper from `searchUtils.ts` or testing the wrong module.
- **Rationale & Recommendation**:
  Either:
  1. Extract the comparator logic into `export function compareSearchResults(a: JackettSearchResult, b: JackettSearchResult, field: keyof JackettSearchResult, direction: "asc" | "desc"): number` in `src/lib/searchUtils.ts`, and test it in `searchUtils.test.ts`, OR
  2. Specify adding a dedicated test file `src/hooks/useFilteredResults.test.ts` to the target file list to test sorting and filtering behavior.

### 8. Undefined Buffer Capping and Eviction Implementation in `useResultBatching.ts` - Severity: Major

- **Reviewer Lens:** `egm-implementation-readiness` / `egm-codebase-details`
- **Affected Scope:** Lines 283–288 (`src/hooks/useResultBatching.ts`)
- **Discrepancy Description**:
  Line 283 states: _"Maintain `pendingBufferRef` capped at 500 items"_. Section 4.1 adds: _"retaining the highest seeded releases and notifying the user when the buffer ceiling is reached"_.
  However, the implementation plan does not define the algorithm for retaining the highest seeded releases when new items arrive beyond 500 (e.g., sorting on insert vs trimming lowest seeders), nor does it specify how "notifying the user when the buffer ceiling is reached" is executed (e.g. `toast.warning()`, an exposed `isBufferFull: boolean` flag, or UI badge text).
- **Rationale & Recommendation**:
  Specify the exact capping behavior:
  - Trimming rule: when `pendingBufferRef.current.length > 500`, sort descending by `Seeders` and slice to the first 500 items.
  - Notification mechanism: detail whether an alert is emitted via `toast.info` or an exposed boolean property `isBufferCapped: boolean`.

### 9. Verification Plan Cites Non-Existent Automated Tooling - Severity: Nit

- **Reviewer Lens:** `egm-style` / `egm-implementation-readiness`
- **Affected Scope:** Lines 364–370 (`### Verification Plan`)
- **Discrepancy Description**:
  Lines 364–370 stipulate verifying INP (< 50ms via synthetic keystrokes across 2,000 mocked results), CLS (0.00 via streaming 500 mocked results), and 4.5:1 text contrast via automated contrast tooling.
  The repository (`package.json`) contains only `vitest`, `eslint`, and `prettier`. There is no Playwright, Cypress, Lighthouse CI, or axe-core automated runner configured. An implementer following this plan literally would have no automated script to execute these verification steps.
- **Rationale & Recommendation**:
  Label Core Web Vitals and contrast checks as "Manual QA / Browser DevTools Verification" with explicit steps (e.g., Chrome DevTools Performance panel, Lighthouse Accessibility audit), or specify adding `@testing-library/react` benchmark / axe-core test scripts to `package.json`.

### 10. Redundant Cleanup Task in `useSearch.ts` - Severity: Nit

- **Reviewer Lens:** `egm-codebase-details`
- **Affected Scope:** Lines 299–300 (`src/hooks/useSearch.ts`)
- **Discrepancy Description**:
  Line 300 instructs: _"Ensure `fetchDataJackett` immediately calls `cleanupBatches()` to purge stale items from previous queries."_
  In `src/hooks/useSearch.ts`, lines 50 and 67 already call `cleanupBatches()` at the start of `fetchDataJackett`.
- **Rationale & Recommendation**:
  Note that `cleanupBatches()` is already invoked in `fetchDataJackett`, and refocus the task on ensuring `cleanupBatches()` is called during manual cancellation in `cancelSearch` and stream completion.

### 11. Unspecified Typography and Token Changes for `Header.tsx` - Severity: Nit

- **Reviewer Lens:** `egm-style` / `egm-codebase-details`
- **Affected Scope:** Lines 331–336 (`src/components/Header.tsx`)
- **Discrepancy Description**:
  The proposed changes state: _"Update typography hierarchy with crisp Bento badge accents"_ and _"Ensure all text meets WCAG AA 4.5:1 contrast standards"_.
  `Header.tsx` is only 49 lines long. The plan does not state which existing classes violate 4.5:1 contrast (e.g. `text-primary/80` on line 24), nor what the "Bento badge accent" markup should be.
- **Rationale & Recommendation**:
  Provide the specific class replacements (e.g. replace `text-primary/80` with `text-muted-foreground font-semibold` and add `<Badge variant="secondary">` next to the title).

---

## Conclusion & Implementation Readiness Verdict

**Verdict:** ❌ **FAIL (Stage 9 Implementation Readiness Standard)**

The plan provides strong architectural intent, but cannot be executed by an unfamiliar engineer or fresh AI session without guessing and making independent design choices. Before starting implementation:

1. Divide the plan into sequential, build-verified phases.
2. Formally declare updated TypeScript prop interfaces for `ResultsTableProps`, `UseFilteredResultsProps`, and `UseResultBatchingProps`.
3. Fix raw HSL channel formatting in `src/index.css`.
4. Disambiguate row-level copy state for Magnet vs Source buttons.
5. Provide Node-safe fallback for `requestIdleCallback`.
