# Tasks: Grouping System

## Relevant Files

### New Files to Create
- `src/components/Canvas/GroupShape.tsx` - Group rendering component
- `src/components/Canvas/properties/GroupProperties.tsx` - Group properties panel
- `src/hooks/useGroupOperations.ts` - Group creation/editing logic
- `src/services/grouping.ts` - Group manipulation utilities

### Files to Modify
- `src/types/index.ts` - Add GroupShape interface
- `src/components/Canvas/Canvas.tsx` - Handle group selection and edit mode
- `src/components/Canvas/LayersPanel.tsx` - Show group hierarchy, drag & drop
- `src/components/Canvas/PropertiesPanel.tsx` - Show group properties
- `src/components/Canvas/Shape.tsx` - Handle shapes within groups
- `src/contexts/CanvasContext.tsx` - Add group operations (create, ungroup, etc.)
- `src/services/canvas.ts` - Add group CRUD operations
- `src/services/ai/openai.ts` - Add group awareness to AI
- `src/services/ai/toolExecutor.ts` - Handle AI commands on groups

### Test Files
- `tests/unit/services/grouping.test.ts` - Group utilities tests
- `tests/unit/hooks/useGroupOperations.test.ts` - Group operations tests
- `tests/unit/components/GroupShape.test.tsx` - Group component tests

---

## Tasks

- [ ] **1.0 Group Type Definitions**
  - [ ] 1.1 Add `GroupShape` interface to `src/types/index.ts`
  - [ ] 1.2 Define group-specific properties (childIds, shapesColor, textColor)
  - [ ] 1.3 Update `Shape` union type to include `GroupShape`
  - [ ] 1.4 Add `GroupUpdate` interface for partial updates
  - [ ] 1.5 Add type guards: `isGroup(shape)`, `hasChildren(group)`

- [ ] **2.0 Group Service Functions**
  - [ ] 2.1 Create `src/services/grouping.ts` for group utilities
  - [ ] 2.2 Implement `calculateGroupCenter(children: Shape[])` - finds center point of all children
  - [ ] 2.3 Implement `getGroupBounds(group: GroupShape, shapes: Shape[])` - calculates bounding box
  - [ ] 2.4 Implement `isCircularNesting(groupId, potentialChildId, shapes)` - prevents circular references
  - [ ] 2.5 Implement `flattenGroup(group, shapes)` - returns all descendant shape IDs recursively
  - [ ] 2.6 Implement `applyGroupTransform(child, groupX, groupY, groupRotation)` - applies group transformations
  - [ ] 2.7 Implement `applyColorToChildren(group, shapes)` - applies group colors to children
  - [ ] 2.8 Write unit tests for all utility functions

- [ ] **3.0 Canvas Context Group Operations**
  - [ ] 3.1 Add `createGroup(shapeIds: string[])` to CanvasContext
  - [ ] 3.2 Validate at least 2 shapes selected
  - [ ] 3.3 Calculate group center from selected shapes
  - [ ] 3.4 Generate group name: "Group 1", "Group 2", etc.
  - [ ] 3.5 Create group shape in Firestore with childIds array
  - [ ] 3.6 Add `ungroupShape(groupId: string)` to CanvasContext
  - [ ] 3.7 Delete group and restore children as individual shapes
  - [ ] 3.8 Add `updateGroupChildren(groupId, childIds)` function
  - [ ] 3.9 Handle real-time sync for group operations
  - [ ] 3.10 Test group creation/ungrouping with multiple users

- [ ] **4.0 Group Selection Behavior**
  - [ ] 4.1 Update `src/components/Canvas/Canvas.tsx` selection logic
  - [ ] 4.2 Single click on group shape → select entire group
  - [ ] 4.3 Show Transformer around entire group bounds
  - [ ] 4.4 Add "group edit mode" state to CanvasContext
  - [ ] 4.5 Double click on group → enter edit mode
  - [ ] 4.6 In edit mode, clicks select individual shapes
  - [ ] 4.7 Exit edit mode: click outside or press Escape
  - [ ] 4.8 Show breadcrumb in edit mode: "Group 1 > Rectangle 3"
  - [ ] 4.9 Update keyboard shortcuts to work in both modes
  - [ ] 4.10 Test selection behavior thoroughly

- [ ] **5.0 Group Keyboard Shortcuts**
  - [ ] 5.1 Add global keyboard listener for 'G' key
  - [ ] 5.2 When 'G' pressed with 2+ shapes selected, create group
  - [ ] 5.3 Add Ctrl+Shift+G shortcut for ungrouping
  - [ ] 5.4 Prevent grouping during text editing
  - [ ] 5.5 Show toast notification: "Created Group 1 with 5 shapes"
  - [ ] 5.6 Update tutorial with grouping shortcuts
  - [ ] 5.7 Add tooltips explaining grouping

- [ ] **6.0 Group Component Rendering**
  - [ ] 6.1 Create `src/components/Canvas/GroupShape.tsx`
  - [ ] 6.2 Use Konva.Group to wrap all child shapes
  - [ ] 6.3 Apply group position (x, y) to Konva.Group
  - [ ] 6.4 Apply group rotation to Konva.Group
  - [ ] 6.5 Render all children recursively (handle nested groups)
  - [ ] 6.6 Add dashed border visual indicator when selected
  - [ ] 6.7 Border: 2px dashed blue, 5px dash/gap pattern
  - [ ] 6.8 Switch to solid border in edit mode
  - [ ] 6.9 Handle group colors (apply to children on render)
  - [ ] 6.10 Optimize rendering with React.memo

- [ ] **7.0 Group Transformations**
  - [ ] 7.1 Handle group dragging (move all children together)
  - [ ] 7.2 Update all child positions relative to group movement
  - [ ] 7.3 Handle group rotation (rotate all children around center)
  - [ ] 7.4 Calculate individual child rotations (combine with group rotation)
  - [ ] 7.5 Update group center when children are added/removed
  - [ ] 7.6 Disable resizing for groups in MVP (future enhancement)
  - [ ] 7.7 Lock group when dragging (prevent conflicts)
  - [ ] 7.8 Sync transformations in real-time to all users
  - [ ] 7.9 Test with nested groups (transformations stack correctly)

- [ ] **8.0 Group Properties Panel**
  - [ ] 8.1 Create `src/components/Canvas/properties/GroupProperties.tsx`
  - [ ] 8.2 Show group name with rename capability
  - [ ] 8.3 Display group position (X, Y center point)
  - [ ] 8.4 Display and edit rotation angle
  - [ ] 8.5 Add "Shapes Color" picker
  - [ ] 8.6 Add "Text Color" picker (separate control)
  - [ ] 8.7 Show child count: "Contains 5 shapes"
  - [ ] 8.8 List children names (collapsible)
  - [ ] 8.9 Add "Ungroup" button
  - [ ] 8.10 Add "Enter Group" button (alternative to double-click)
  - [ ] 8.11 Update properties when group selection changes
  - [ ] 8.12 Apply color changes to all matching children

- [ ] **9.0 Group Color Logic**
  - [ ] 9.1 Implement color application in `src/services/grouping.ts`
  - [ ] 9.2 "Shapes Color" affects: rectangles (fill), circles (fill), lines (stroke)
  - [ ] 9.3 "Text Color" affects: text shapes (fill/text color)
  - [ ] 9.4 Apply colors recursively to nested groups
  - [ ] 9.5 Preserve original colors when ungrouping (store in metadata?)
  - [ ] 9.6 Update colors in real-time when changed
  - [ ] 9.7 Handle mixed shapes gracefully (some have no fill)
  - [ ] 9.8 Show color preview in properties panel
  - [ ] 9.9 Test color changes with various shape combinations

- [ ] **10.0 LayersPanel Hierarchy**
  - [ ] 10.1 Update `src/components/Canvas/LayersPanel.tsx` to show tree structure
  - [ ] 10.2 Add expand/collapse arrows for groups (▶ / ▼)
  - [ ] 10.3 Indent children shapes (20px per nesting level)
  - [ ] 10.4 Show group icon (📁 or custom icon)
  - [ ] 10.5 Display child count when collapsed: "Group 1 (5 shapes)"
  - [ ] 10.6 Clicking group selects entire group (same as canvas)
  - [ ] 10.7 Expand on single click, select on second click (or vice versa)
  - [ ] 10.8 Show all nested groups recursively
  - [ ] 10.9 Highlight selected group and its children
  - [ ] 10.10 Add max nesting visual indicator (warning at 5+ levels)

- [ ] **11.0 LayersPanel Drag & Drop**
  - [ ] 11.1 Enable drag & drop for shapes in LayersPanel
  - [ ] 11.2 Show drop indicator when dragging (blue line or highlight)
  - [ ] 11.3 Allow dragging shape INTO group (adds to childIds)
  - [ ] 11.4 Allow dragging shape OUT of group (removes from childIds)
  - [ ] 11.5 Allow reordering children within group
  - [ ] 11.6 Prevent dropping group into itself (circular nesting)
  - [ ] 11.7 Prevent dropping parent into its own descendant
  - [ ] 11.8 Update Firestore on drop completion
  - [ ] 11.9 Show loading state during drag operation
  - [ ] 11.10 Test drag & drop extensively with nested groups

- [ ] **12.0 Double-Click Navigation**
  - [ ] 12.1 Add double-click listener to LayersPanel shape items
  - [ ] 12.2 When shape double-clicked, get its position
  - [ ] 12.3 Animate canvas pan/zoom to show shape in center
  - [ ] 12.4 Zoom level: fit shape in viewport with 20% padding
  - [ ] 12.5 Highlight shape briefly (1s glow effect)
  - [ ] 12.6 Handle groups: zoom to show entire group bounds
  - [ ] 12.7 Handle nested groups: zoom to selected item specifically
  - [ ] 12.8 Animation duration: 500ms ease-in-out
  - [ ] 12.9 Test with shapes at various positions (far edges)

- [ ] **13.0 Group Deletion**
  - [ ] 13.1 Handle Delete key when group is selected
  - [ ] 13.2 Show confirmation modal: "Delete group and all 5 shapes?"
  - [ ] 13.3 If confirmed, delete group and all children recursively
  - [ ] 13.4 Handle nested groups (delete entire subtree)
  - [ ] 13.5 Update Firestore (delete all shapes in one batch)
  - [ ] 13.6 Sync deletion to all users immediately
  - [ ] 13.7 Handle edge case: shape is in multiple groups (shouldn't happen, but check)
  - [ ] 13.8 Test deletion with complex nested structures

- [ ] **14.0 Group Duplication**
  - [ ] 14.1 Handle Ctrl+D when group is selected
  - [ ] 14.2 Duplicate group structure recursively
  - [ ] 14.3 Generate new IDs for group and all children
  - [ ] 14.4 Append "-copy" to group name and all child names
  - [ ] 14.5 Offset duplicated group by (20, 20) pixels
  - [ ] 14.6 Maintain parent-child relationships in duplicate
  - [ ] 14.7 Create all shapes in Firestore (batch write)
  - [ ] 14.8 Select duplicated group after creation
  - [ ] 14.9 Test with nested groups (all levels duplicated correctly)

- [ ] **15.0 Nested Groups Support**
  - [ ] 15.1 Allow groups to have other groups as children
  - [ ] 15.2 Prevent circular nesting (use `isCircularNesting` check)
  - [ ] 15.3 Stack transformations: parent rotation + child rotation
  - [ ] 15.4 Stack positions: child position relative to parent
  - [ ] 15.5 Apply colors through all nesting levels
  - [ ] 15.6 Handle deep nesting (5+ levels) with performance checks
  - [ ] 15.7 Show nesting level in LayersPanel (visual depth indicator)
  - [ ] 15.8 Test deeply nested groups (3-4 levels minimum)
  - [ ] 15.9 Warn users at 5+ nesting levels (potential performance issue)

- [ ] **16.0 AI Integration**
  - [ ] 16.1 Update `src/services/ai/openai.ts` to include groups in canvas state
  - [ ] 16.2 AI can query groups: "What groups exist?"
  - [ ] 16.3 AI can move groups: "Move Group 1 to center"
  - [ ] 16.4 AI can change group colors: "Make Group 1 red"
  - [ ] 16.5 AI cannot create groups (explain to user they must select shapes first)
  - [ ] 16.6 Update tool schema to handle group types
  - [ ] 16.7 Test AI commands on groups with multiple users
  - [ ] 16.8 Handle locked groups in AI operations

- [ ] **17.0 Testing & Bug Fixes**
  - [ ] 17.1 Test group creation with 2, 5, 10, 20 shapes
  - [ ] 17.2 Test nested groups (2-3 levels deep)
  - [ ] 17.3 Test group transformations (move, rotate)
  - [ ] 17.4 Test group color changes (shapes vs text)
  - [ ] 17.5 Test ungrouping (shapes restore correctly)
  - [ ] 17.6 Test group deletion (all children deleted)
  - [ ] 17.7 Test group duplication (structure preserved)
  - [ ] 17.8 Test LayersPanel drag & drop (add/remove from group)
  - [ ] 17.9 Test double-click navigation
  - [ ] 17.10 Test multi-user scenarios (locking, real-time sync)
  - [ ] 17.11 Test edge cases (empty group, circular nesting, max depth)
  - [ ] 17.12 Fix any bugs discovered

- [ ] **18.0 Polish & Documentation**
  - [ ] 18.1 Add loading states for group operations
  - [ ] 18.2 Add success/error toast notifications
  - [ ] 18.3 Improve visual indicators (dashed border, breadcrumbs)
  - [ ] 18.4 Add keyboard shortcut tooltips
  - [ ] 18.5 Update tutorial with grouping instructions
  - [ ] 18.6 Add JSDoc comments to all group functions
  - [ ] 18.7 Write user guide for grouping feature
  - [ ] 18.8 Test accessibility (keyboard navigation, screen readers)
  - [ ] 18.9 Optimize performance (profile with 100+ shapes in groups)
  - [ ] 18.10 Final visual polish (colors, spacing, animations)

---

## Estimated Timeline
- **Total Time**: 10-12 hours
- **Phase 1** (Tasks 1-3): Foundation & Types - 2 hours
- **Phase 2** (Tasks 4-9): Core Functionality - 4-5 hours
- **Phase 3** (Tasks 10-15): UI & Advanced Features - 3-4 hours
- **Phase 4** (Tasks 16-18): Integration & Polish - 1-2 hours

## Dependencies
- Requires Projects & Pages system (for per-page groups)
- Tasks 1-3 must be completed first (foundation)
- Tasks 4-9 are core functionality (do in order)
- Tasks 10-15 can be done in parallel after core
- Task 16 depends on all core features
- Tasks 17-18 are final steps

## Notes
- Groups are stored as regular shapes (type: 'group') in Firestore
- Use Konva.Group for efficient rendering
- Real-time sync uses same mechanism as other shapes
- Circular nesting prevention is critical
- Test thoroughly with nested structures

