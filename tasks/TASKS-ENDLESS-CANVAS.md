# Tasks: Endless Canvas

## Relevant Files

### New Files to Create
- `src/components/Canvas/NavigationHelpers.tsx` - Go to user dropdown and navigation controls
- `src/components/Canvas/PositionIndicator.tsx` - Current viewport position display
- `src/hooks/useViewportCulling.ts` - Calculate visible shapes based on viewport

### Files to Modify
- `src/utils/constants.ts` - Update canvas bounds to -50k to +50k
- `src/components/Canvas/Canvas.tsx` - Remove bounds clamping, add viewport culling
- `src/components/Canvas/LayersPanel.tsx` - Add position indicator and double-click navigation
- `src/services/ai/positionParser.ts` - Update for new canvas bounds
- `src/utils/helpers.ts` - Update bound checking functions

### Test Files
- `tests/unit/hooks/useViewportCulling.test.ts` - Viewport culling tests
- `tests/unit/utils/helpers.test.ts` - Update tests for new bounds

---

## Tasks

- [x] **1.0 Update Canvas Bounds Constants**
  - [x] 1.1 Update `CANVAS_BOUNDS` in `src/utils/constants.ts` to -50,000 → +50,000
  - [x] 1.2 Export `CANVAS_WIDTH = 100,000` and `CANVAS_HEIGHT = 100,000`
  - [x] 1.3 Update all hardcoded bounds references in codebase
  - [x] 1.4 Update grid rendering to work with new bounds (temporary limited area)
  - [x] 1.5 Updated AI position parser for new bounds

- [x] **2.0 Remove Canvas Bounds Clamping**
  - [x] 2.1 Update `src/hooks/useCanvasPanZoom.ts` pan behavior
  - [x] 2.2 Remove viewport position clamping (allow infinite pan)
  - [x] 2.3 Keep shape position clamping (shapes stay within bounds)
  - [x] 2.4 Update `clampToCanvas()` function in `src/services/ai/positionParser.ts`
  - [x] 2.5 Canvas now centers on origin (0, 0) on load
  - [x] 2.6 Pan constraints removed - infinite panning enabled

- [x] **3.0 Viewport Culling Hook**
  - [x] 3.1 Create `src/hooks/useViewportCulling.ts` hook
  - [x] 3.2 Calculate current viewport bounds from stage position and zoom
  - [x] 3.3 Add buffer zone (2x viewport size in each direction)
  - [x] 3.4 Implement `getVisibleShapes(allShapes, viewport, buffer)` function
  - [x] 3.5 Check shape bounds intersection with buffered viewport
  - [x] 3.6 Return visible shapes array
  - [x] 3.7 Memoize calculations to prevent re-renders
  - [x] 3.8 Return culling statistics for performance monitoring
  - [ ] 3.9 Write unit tests for culling logic

- [x] **4.0 Integrate Viewport Culling**
  - [x] 4.1 Use `useViewportCulling` hook in Canvas component
  - [x] 4.2 Filter shapes to only render visible ones
  - [x] 4.3 Keep all shapes in memory (don't unload offscreen shapes)
  - [x] 4.4 Update visible shapes on pan, zoom, or shape changes (automatic via useMemo)
  - [x] 4.5 Selected shapes always render (even if off-screen)
  - [x] 4.6 Box selection works with all shapes (not just visible)
  - [ ] 4.7 Measure FPS with varying shape counts
  - [ ] 4.8 Optimize if FPS drops below 60

- [x] **5.0 Performance Monitoring**
  - [x] 5.1 Add shape count display to LayersPanel header
  - [x] 5.2 Show "Visible X of Y shapes" where X = rendered, Y = total
  - [x] 5.3 Pass culling statistics to LayersPanel
  - [ ] 5.4 Add performance warning if FPS < 40 for extended period
  - [ ] 5.5 Log culling performance metrics to console (dev mode)
  - [ ] 5.6 Test with 100, 500, 1000, 2000 shapes

- [ ] **6.0 Position Indicator**
  - [ ] 6.1 Create `src/components/Canvas/PositionIndicator.tsx` component
  - [ ] 6.2 Calculate current viewport center (x, y coordinates)
  - [ ] 6.3 Display in LayersPanel header: "(X: 1234, Y: 5678)"
  - [ ] 6.4 Or show distance from origin: "1500px from origin"
  - [ ] 6.5 Update position in real-time as user pans
  - [ ] 6.6 Click coordinates → open "Go to Position" modal (optional)
  - [ ] 6.7 Style consistently with existing UI

- [x] **7.0 Go to User Navigation**
  - [x] 7.1 Implemented in Navbar (no separate component needed)
  - [x] 7.2 User avatars in Navbar are now double-clickable
  - [x] 7.3 User list already shows in Navbar dropdown
  - [x] 7.4 Gets users from PresenceContext ✓
  - [x] 7.5 Shows user name with hint "Double-click to follow"
  - [x] 7.6 Double-click user → pans to their cursor position
  - [ ] 7.7 Animation: Currently instant (TODO: add smooth animation)
  - [x] 7.8 Centers user's cursor in viewport ✓
  - [x] 7.9 Console logs navigation (can add toast later)
  - [x] 7.10 Dropdown closes after double-click

- [x] **8.0 LayersPanel Double-Click Navigation**
  - [x] 8.1 Add double-click listener to shape items in LayersPanel
  - [x] 8.2 Get shape position from canvas context
  - [x] 8.3 Calculate viewport to center shape with 20% padding
  - [x] 8.4 Pan and zoom to show shape (immediate for now)
  - [ ] 8.5 Animation duration: 500ms ease-in-out (TODO: add smooth animation)
  - [ ] 8.6 Highlight shape briefly after navigation (1s glow)
  - [x] 8.7 Handle all shape types (rectangle, circle, line, text)
  - [x] 8.8 Auto-select shape after navigation
  - [x] 8.9 Added tooltip for double-click hint

- [x] **9.0 AI Position Updates**
  - [x] 9.1 Update `src/services/ai/positionParser.ts` with new bounds
  - [x] 9.2 Update PRESET_POSITIONS for new canvas size
  - [x] 9.3 "center" now at (0, 0)
  - [x] 9.4 "top-left" → (-49900, -49900)
  - [x] 9.5 "bottom-right" → (49900, 49900)
  - [x] 9.6 Update coordinate clamping to use new bounds
  - [ ] 9.7 Test AI commands at various canvas positions
  - [ ] 9.8 Handle "nearby" relative to current viewport (if user says "create here")

- [ ] **10.0 Initial Load Optimization**
  - [ ] 10.1 Add loading progress indicator for shape loading
  - [ ] 10.2 Display: "Loading shapes... 237/1043"
  - [ ] 10.3 Use loading skeleton in LayersPanel during load
  - [ ] 10.4 Center viewport on first shape (or origin if no shapes)
  - [ ] 10.5 Zoom to fit all shapes on first load (or default zoom)
  - [ ] 10.6 Cache loaded shapes in memory for session
  - [ ] 10.7 Don't reload shapes on page navigation (keep in context)
  - [ ] 10.8 Test with empty canvas (no shapes)
  - [ ] 10.9 Test with 1000+ shapes on initial load

- [x] **11.0 Grid System Updates**
  - [x] 11.1 Update `src/utils/gridRenderer.tsx` for new bounds
  - [x] 11.2 Render grid only in visible viewport (viewport-based rendering)
  - [x] 11.3 Grid renders with 1.5x buffer for smooth panning
  - [x] 11.4 Origin (0,0) shown with blue color, thick lines every 5 grid units
  - [x] 11.5 Grid snaps to grid boundaries for clean rendering
  - [ ] 11.6 Test grid rendering at various zoom levels
  - [ ] 11.7 Ensure grid doesn't impact FPS

- [ ] **12.0 Empty Canvas Handling**
  - [ ] 12.1 Detect when canvas has no shapes
  - [ ] 12.2 Show helpful message at origin (0, 0)
  - [ ] 12.3 Message: "Start creating shapes or invite team members"
  - [ ] 12.4 Show coordinate axes for orientation
  - [ ] 12.5 Snap viewport to origin on first load if empty
  - [ ] 12.6 Hide message when first shape is created
  - [ ] 12.7 Test empty canvas UX

- [ ] **13.0 Real-Time Sync Testing**
  - [ ] 13.1 Test shape creation at extreme positions (-50k, +50k)
  - [ ] 13.2 Test that shapes sync correctly across users
  - [ ] 13.3 Test when users are viewing different areas
  - [ ] 13.4 User A at (0, 0), User B at (40000, 40000)
  - [ ] 13.5 User B creates shape → User A receives update (in memory, not rendered)
  - [ ] 13.6 User A pans to User B's area → shape renders correctly
  - [ ] 13.7 Test cursor sync with new bounds
  - [ ] 13.8 Test object locking with users in different areas

- [x] **14.0 Shape Position Validation**
  - [x] 14.1 Add position validation on shape creation
  - [x] 14.2 Clamp shapes to bounds (-50k to +50k)
  - [x] 14.3 Log warning to console when clamping occurs
  - [x] 14.4 Created helper functions: `validateShapePosition`, `clampToCanvasBounds`
  - [x] 14.5 Prevent shapes from being created outside bounds
  - [x] 14.6 Handle all shape types (rectangle, circle, line, text)
  - [ ] 14.7 Test validation with AI-created shapes
  - [ ] 14.8 Test validation with manually dragged shapes

- [ ] **15.0 Coordinate System Consistency**
  - [ ] 15.1 Audit all coordinate transformations in codebase
  - [ ] 15.2 Ensure cursor positions work with new bounds
  - [ ] 15.3 Ensure transformer handles work at extreme positions
  - [ ] 15.4 Test zoom in/out at various canvas positions
  - [ ] 15.5 Test pan with mousewheel at edges
  - [ ] 15.6 Verify no precision issues at large coordinates
  - [ ] 15.7 Test with shapes at (49999, 49999) - near max bounds

- [ ] **16.0 Performance Optimization**
  - [ ] 16.1 Profile canvas rendering with 500, 1000, 2000 shapes
  - [ ] 16.2 Measure FPS during pan, zoom, and shape creation
  - [ ] 16.3 Optimize culling algorithm if needed
  - [ ] 16.4 Consider Konva layer caching for static shapes
  - [ ] 16.5 Memoize expensive calculations (bounds, intersections)
  - [ ] 16.6 Throttle viewport updates (100ms)
  - [ ] 16.7 Use requestAnimationFrame for smooth animations
  - [ ] 16.8 Ensure 60 FPS target is met
  - [ ] 16.9 Add performance mode toggle (reduces effects if FPS drops)

- [ ] **17.0 User Experience Polish**
  - [ ] 17.1 Add smooth animations for navigation helpers
  - [ ] 17.2 Show loading states for async operations
  - [ ] 17.3 Add tooltips for navigation buttons
  - [ ] 17.4 Show temporary highlight when jumping to shape/user
  - [ ] 17.5 Add "Return to Origin" quick action (future enhancement)
  - [ ] 17.6 Consider adding "Fit All Shapes" button (zoom to show all)
  - [ ] 17.7 Test UX with users unfamiliar with endless canvas
  - [ ] 17.8 Gather feedback and iterate

- [ ] **18.0 Edge Cases & Bug Fixes**
  - [ ] 18.1 Test with very large zoom levels (10000%)
  - [ ] 18.2 Test with very small zoom levels (1%)
  - [ ] 18.3 Test rapid panning and zooming
  - [ ] 18.4 Test with 10,000+ shapes (stress test)
  - [ ] 18.5 Test memory usage over extended session
  - [ ] 18.6 Test shape creation spam (100 shapes/second)
  - [ ] 18.7 Handle floating point precision edge cases
  - [ ] 18.8 Test across different screen resolutions
  - [ ] 18.9 Fix any bugs discovered during testing

- [ ] **19.0 Documentation & Tutorial**
  - [ ] 19.1 Update tutorial with endless canvas navigation
  - [ ] 19.2 Explain canvas bounds in user guide
  - [ ] 19.3 Document keyboard shortcuts for navigation
  - [ ] 19.4 Add tooltips for position indicator
  - [ ] 19.5 Document performance characteristics
  - [ ] 19.6 Add JSDoc comments to all new functions
  - [ ] 19.7 Create developer guide for viewport culling
  - [ ] 19.8 Update README with endless canvas feature

- [ ] **20.0 Final Testing & Launch**
  - [ ] 20.1 Multi-user testing with 3-5 concurrent users
  - [ ] 20.2 Test all features together (projects, groups, endless canvas)
  - [ ] 20.3 Load test with 1000+ shapes across large area
  - [ ] 20.4 Performance benchmark before and after
  - [ ] 20.5 Cross-browser testing (Chrome, Firefox, Safari, Edge)
  - [ ] 20.6 Accessibility testing
  - [ ] 20.7 Collect beta user feedback
  - [ ] 20.8 Fix critical bugs before launch
  - [ ] 20.9 Prepare deployment checklist
  - [ ] 20.10 Deploy to production

---

## Estimated Timeline
- **Total Time**: 12-15 hours
- **Phase 1** (Tasks 1-5): Core Implementation - 4-5 hours
- **Phase 2** (Tasks 6-10): Navigation & UX - 3-4 hours
- **Phase 3** (Tasks 11-16): Optimization & Testing - 3-4 hours
- **Phase 4** (Tasks 17-20): Polish & Launch - 2-3 hours

## Dependencies
- Should be implemented after Projects & Pages (for per-page canvas)
- Can be done in parallel with Grouping (independent features)
- Tasks 1-4 must be completed first (foundation)
- Tasks 5-10 are core features (do in order)
- Tasks 11-20 are optimization and polish

## Performance Targets
- **60 FPS** maintained during pan/zoom with 1000+ shapes
- **< 100ms** to calculate visible shapes (viewport culling)
- **< 500ms** initial load time for 1000 shapes
- **< 16MB** memory increase per 1000 shapes
- **100,000 x 100,000** total canvas area (400x larger than current)

## Notes
- Viewport culling is key to performance
- Load all shapes but only render visible ones
- Real-time sync unchanged (Firestore listeners)
- No spatial indexing needed for expected shape counts
- Buffer zone ensures smooth panning (no pop-in)
- Test extensively with large shape counts

