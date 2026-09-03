# Canvas comparison table

The comparison surface uses one viewport-sized Canvas 2D bitmap. The native scroll container has a lightweight spacer representing the logical table. The canvas is positioned above it, so neither its CSS size nor its backing store grows with the dataset. Device-pixel ratio is honored, including browser zoom and movement between displays.

## Boundaries

- `app/page.tsx` owns filtering, sorting, comparison selection, preferences and performance loading.
- `lib/recorder-scoring.ts` precomputes per-field score contributions, ranking each numeric field once. Changing weights computes dot products without sorting numeric values again.
- `lib/comparison-table-model.ts` flattens expanded, non-hidden rows. Cells are formatted on demand with a bounded 4,096-cell LRU cache. Best values and workload-specific performance extremes are prepared once per field per model.
- `lib/canvas-table-layout.ts` provides the shared coordinate system for rendering, hit testing and navigation. Binary search finds visible variable-height rows; arithmetic finds visible columns.
- `lib/canvas-table-motion.ts` retains outgoing rows and columns for a 250ms transition using the existing table easing. Geometry, opacity and group-chevron rotation retarget from the displayed frame, including interrupted reversals. Exits are released on completion. Reduced motion uses a 150ms opacity fade without moving geometry; keyboard navigation finishes motion immediately. Sorting retains its immediate order change.
- `lib/canvas-table-painter.ts` draws the body, frozen labels and frozen headers in that order. Text layout and icon resources are cached; image and text caches are bounded. Long benchmark timelines use min/max bucket reduction to preserve peaks.
- `components/canvas-comparison-table.tsx` connects native scrolling, resize/theme/font/DPR invalidation, pointer handling, keyboard navigation and React state. Multiple invalidations coalesce into one animation frame. There is no idle animation loop and no React state update for each scroll pixel.

The saved full-width layout is applied by a head bootstrap before hydration. CSS and Canvas motion remain disabled while full-width and weight preferences hydrate and their layout is painted. Subsequent user changes retain their normal transitions.

## Mobile layout

At viewport widths of 760px and below, the surface fills the available page width without a frame, outer margin, or cell borders. Each field has a full-width, 40px label strip above its horizontally scrolling values. Label strips are painted in viewport coordinates, so they stay fixed during horizontal scrolling. Category headings without summaries have no empty value strip. Product headers remain fixed vertically; a compact summary/reset strip replaces the desktop corner.

The same model and motion controller drive both layouts. Mobile rows include their label height in the shared coordinate system used for drawing, hit testing and keyboard navigation. Collapsible headers stick below the product headers, stacking active ancestors and sliding out at each group's end. A cached hierarchy keeps scrolling work bounded to the active group chain. Drawing, pointer targets, keyboard reveal and virtual accessibility rows all include these pinned headers. Website links use the full viewport width, and weight popovers anchor below the field label. Crossing the breakpoint settles the layout immediately, while filtering and expansion retain their normal animations.

## Interactions and accessibility

The toolbar and comparison dock keep their existing controls. Click a product header to select it, a group to toggle it, or a value to open selectable full text. Website hit regions are real links, preserving keyboard access, context menus and modified clicks. Hover a weighted field label to open its floating range control. The native non-modal popover stays open while crossing into it or dragging the slider; its position follows the painted row. Touch and keyboard activation open the same popover and focus the slider. Escape or clicking outside closes it.

An ARIA grid exposes only visible rows/columns plus the active cell. Arrow keys, Home/End, Ctrl/Command+Home/End, and Page Up/Down navigate. Enter/Space activates. The copy shortcut copies the active cell's label and value. Tab reaches website links and Escape closes the dialog. The active cell tracks stable field/product IDs across sorting and filtering.

During layout transitions, native website link regions and pointer hit testing use the painted geometry and resolve stable IDs back to the current model. Exiting cells cannot be activated. Collapsed group summaries crossfade, and row contents are clipped at their natural height rather than scaling text. Canvas layout updates bypass document View Transition snapshots so the live frames remain visible.

Chat product links dispatch the shared `recorder-select:focus-recorder` event instead of querying DOM table cells. The viewport scrolls to the product and highlights its column.

Canvas text is not available to browser Find or native drag selection. Use the existing recorder search, copy shortcut, or full-text dialog. Accessibility semantics are virtualized rather than maintaining a hidden full-size HTML table.

## Validation

Run `npm run test:table`, `npx tsc --noEmit`, `npm run lint`, and `npm run build`.

The table tests cover frozen-pane hit testing, row flattening, hidden identical groups, value formatting, score ranking, workload-aware extremes, loading states and peak-preserving downsampling. A synthetic 10,000-row × 10,000-column scene at a 1,440 × 900 CSS-pixel viewport verifies that the painter requests only 130 body cells and does not remeasure text on an unchanged cached redraw. This is a draw-work bound, not a browser FPS benchmark: actual frame times depend on the browser, hardware, DPR, fonts and visible content.

Manual browser regression checklist:

- Scroll both axes with mouse, trackpad and touch; frozen panes and native website links stay aligned.
- Select several products, compare, hide identical rows, clear, filter to no results, sort and change weights. Reverse a collapse halfway through and rapidly alternate filters; both geometry and content should continue smoothly. Click moving row labels and website links to verify hit-region alignment.
- Expand nested groups and performance, including loading failure/retry and different workload labels.
- Open long reviews, copy cells, navigate only with the keyboard, and inspect the grid with a screen reader.
- Change language/theme, resize, toggle full width, zoom, and move between displays with different DPR.
- Follow a chat product link after horizontal scrolling; repeat after sorting and filtering.
