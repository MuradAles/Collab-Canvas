# CollabCanvas - Advanced Collaboration Features PRD

## Document Information
**Version**: 1.0  
**Status**: Ready for Implementation  
**Priority**: High  
**Estimated Time**: 6-8 weeks total

---

## Table of Contents
1. [Overview](#overview)
2. [Feature 1: Projects & Pages System](#feature-1-projects--pages-system)
3. [Feature 2: Grouping System](#feature-2-grouping-system)
4. [Feature 3: Endless Canvas](#feature-3-endless-canvas)
5. [Cross-Feature Integration](#cross-feature-integration)
6. [Technical Architecture](#technical-architecture)
7. [Success Metrics](#success-metrics)

---

## Overview

This PRD encompasses three major features that transform CollabCanvas from a single-canvas tool into a comprehensive collaborative design platform:

1. **Projects & Pages System**: Multi-project workspace with permission-based collaboration
2. **Grouping System**: Advanced shape organization with hierarchical grouping
3. **Endless Canvas**: Virtually unlimited canvas space with performance optimization

### Combined Goals
- Enable teams to organize work across multiple projects and pages
- Provide advanced shape manipulation through grouping
- Remove canvas size limitations while maintaining 60 FPS performance
- Maintain real-time collaboration across all features
- Preserve existing AI integration and extend it to new features

---

## Feature 1: Projects & Pages System

### Problem Statement
Currently, all users share a single global canvas (5000x5000px). Users cannot:
- Organize work into separate projects
- Control who can access specific work
- Create multiple pages within a project
- Invite collaborators with different permission levels

### Goals
1. Enable users to create unlimited projects with multiple pages
2. Implement invite system with shareable links and codes
3. Provide role-based permissions (View, Edit, Admin)
4. Maintain a special "Global Canvas" accessible to all users
5. Ensure AI context is scoped to current page

### User Stories

**As a project creator:**
- I want to create a new project with a name and description
- I want to invite team members via shareable link or code
- I want to set permissions for each member (View/Edit/Admin)
- I want to see who's working in my project
- I want to kick members if needed

**As a project member:**
- I want to see all projects I have access to
- I want to create multiple pages within a project
- I want to navigate between pages easily
- I want to rename and delete pages
- I want my AI commands to only affect the current page

**As a casual user:**
- I want access to a Global Canvas for quick sketches
- I want to see project thumbnails before opening them
- I want to know my permission level in each project

### Functional Requirements

#### FR1.1: Project Management
- System MUST allow users to create unlimited projects
- Each project MUST have:
  - Unique ID (auto-generated)
  - Name (required, max 100 chars, default "Untitled Project")
  - Description (optional, max 500 chars)
  - Creation date (auto-generated)
  - Thumbnail (auto-generated from first page)
  - Owner (creator's user ID)
  - Members array with roles

#### FR1.2: Project Creation Flow
- When user clicks "New Project", modal appears
- Modal asks for project name (optional)
- If no name provided, default to "Untitled Project"
- System creates project with default first page named "Page 1"
- User is redirected to new project

#### FR1.3: Homepage
- Display grid of project cards (3-4 per row)
- Each card shows: thumbnail, name, member count, last updated date
- Special "Global Canvas" card always visible (different styling)
- "New Project" button prominently displayed
- Search/filter projects (future enhancement)

#### FR1.4: Invitation System
- Admin can generate invite link with 10-character code
- Example: `collab-canvas.app/join/ABC123XYZ0`
- Default expiration: 24 hours
- Admin can customize expiration (1h, 12h, 24h, 7d, 30d, never)
- Invite code can be used by multiple users
- Clicking link auto-joins project (after login if needed)
- If user not logged in, redirect to login → auto-join after signup

#### FR1.5: Permission Roles

**View Only:**
- Can see all shapes on all pages
- Can pan and zoom canvas
- Can see other users' cursors
- CANNOT create, edit, delete shapes
- CANNOT invite others
- CANNOT change project settings

**Can Edit:**
- All View permissions
- Can create, edit, delete shapes
- Can create, rename, delete pages
- Can use AI commands
- CANNOT invite others
- CANNOT change project settings
- CANNOT kick members

**Admin:**
- All Edit permissions
- Can invite members
- Can change member permissions
- Can kick members
- Can change project settings (name, description)
- Can delete project

**Project Owner:**
- Special Admin role (cannot be removed)
- Transfer ownership to another Admin (future)

#### FR1.6: Member Management
- Project settings show member list
- Display: avatar, name, email, role, last seen
- Admin can change roles via dropdown
- Admin can kick members (shows confirmation dialog)
- Kicked members lose immediate access
- Owner cannot be kicked

#### FR1.7: Page Management
- Each project has unlimited pages
- Default first page named "Page 1"
- Page selector in navbar (dropdown menu)
- Dropdown shows page list with scrolling
- "Add Page" button in dropdown
- Right-click page → Rename or Delete
- Deleting page shows confirmation
- Cannot delete if only one page remains
- AI context is per-page (conversation doesn't carry over)

#### FR1.8: Global Canvas
- Special project accessible to all authenticated users
- Shows as first card on homepage
- Users have Edit permissions (no Admin)
- Cannot invite to Global Canvas
- Cannot delete Global Canvas
- Fresh start (existing canvas data ignored)

#### FR1.9: Navigation UI
- Top navbar structure:
  ```
  [CollabCanvas Logo] [Project Dropdown ▾] [Page Dropdown ▾] [...] [User Icon ▾]
  ```
- Project dropdown shows:
  - List of user's projects
  - Global Canvas option
  - "New Project" button
- Page dropdown shows:
  - List of pages in current project
  - "Add Page" button
- Both dropdowns have search if many items

### Non-Goals (Out of Scope)
- Email invitations (link/code only)
- Project templates
- Project duplication
- Folder organization for projects
- Project sharing settings (public/unlisted/private)
- Version history
- Comments and annotations
- Project analytics

### Design Considerations

#### UI Layout
```
┌────────────────────────────────────────────────────┐
│ [CB] [My Project ▾] [Page 1 ▾]  ...  [User ▾]    │ ← Navbar
├────────────────────────────────────────────────────┤
│                                                    │
│                   Canvas Area                      │
│                                                    │
└────────────────────────────────────────────────────┘
```

#### Project Card Design
```
┌─────────────────────┐
│   [Thumbnail]       │
│                     │
├─────────────────────┤
│ Project Name        │
│ 👥 3 members        │
│ 🕐 Updated 2h ago   │
└─────────────────────┘
```

#### Invite Modal
```
┌──────────────────────────────────┐
│ Invite to "My Project"           │
├──────────────────────────────────┤
│ Permission:                      │
│ ○ View Only                      │
│ ● Can Edit                       │
│ ○ Admin                          │
│                                  │
│ Expires in:                      │
│ ● 24 hours                       │
│ ○ 7 days                         │
│ ○ Never                          │
│                                  │
│ [Generate Link]                  │
│                                  │
│ Link: https://collab...XYZ0      │
│ [Copy Link] [Copy Code]          │
└──────────────────────────────────┘
```

### Technical Considerations

#### Firestore Schema
```
projects/
  {projectId}/
    metadata:
      - name: string
      - description: string
      - createdAt: timestamp
      - ownerId: string
      - thumbnail: string (data URL or storage path)
    members:
      {userId}: { role: 'view' | 'edit' | 'admin', joinedAt: timestamp }
    
    pages/
      {pageId}/
        metadata:
          - name: string
          - createdAt: timestamp
          - order: number
        shapes: Shape[] (same structure as current canvas)

invites/
  {inviteCode}/
    - projectId: string
    - createdBy: string
    - permission: 'view' | 'edit' | 'admin'
    - expiresAt: timestamp
    - usedBy: string[] (optional tracking)

globalCanvas/ (special project)
  pages/
    global-page/
      shapes: Shape[]
```

#### Security Rules
```javascript
// Projects - only members can access
match /projects/{projectId} {
  allow read: if request.auth != null && 
    get(/databases/$(database)/documents/projects/$(projectId)).data.members[request.auth.uid] != null;
  allow write: if request.auth != null && 
    get(/databases/$(database)/documents/projects/$(projectId)).data.members[request.auth.uid].role in ['edit', 'admin'];
}

// Invites - anyone can read (to join)
match /invites/{inviteCode} {
  allow read: if request.auth != null;
  allow create: if request.auth != null;
}
```

### Success Criteria
- ✅ User can create project and invite members via link
- ✅ Invited members can join with correct permissions
- ✅ View-only members cannot edit canvas
- ✅ Admin can manage members and permissions
- ✅ Multiple pages within project work correctly
- ✅ AI commands are scoped to current page
- ✅ Global Canvas accessible to all users
- ✅ Project navigation is smooth and intuitive
- ✅ Invite links expire after set duration

---

## Feature 2: Grouping System

### Problem Statement
Users cannot organize multiple shapes together. To move 10 related shapes, users must:
- Select all 10 individually
- Move them together (multi-select exists)
- But selection is lost on canvas click

Figma-style persistent groups solve this.

### Goals
1. Enable users to group shapes with keyboard shortcut (G)
2. Support nested groups (groups within groups)
3. Provide group-level transformations (move, rotate)
4. Allow entering groups to edit individual shapes
5. Support ungrouping (Ctrl+Shift+G)
6. Show groups in LayersPanel hierarchy

### User Stories

**As a designer:**
- I want to press G to group selected shapes
- I want to move grouped shapes as one unit
- I want to double-click a group to edit individual shapes inside
- I want to drag shapes into/out of groups in LayersPanel
- I want to change colors of all shapes in a group at once
- I want to ungroup with Ctrl+Shift+G

**As a collaborator:**
- I want to see groups created by others in real-time
- I want to duplicate groups with all children
- I want to delete groups and all contents

### Functional Requirements

#### FR2.1: Group Creation
- User selects 2+ shapes on canvas
- User presses 'G' key
- System creates group containing selected shapes
- Group appears in LayersPanel hierarchy
- Group is auto-named: "Group 1", "Group 2", etc.
- Selected shapes become children of group

#### FR2.2: Group Data Structure
```typescript
interface GroupShape extends BaseShape {
  type: 'group';
  childIds: string[];  // Array of child shape IDs
  
  // Group-specific properties
  x: number;           // Center point of all children
  y: number;           // Center point of all children
  rotation: number;    // Applied to all children
  
  // Color properties (separate for shapes and text)
  shapesColor?: string;  // Fill color for rectangles, circles, lines
  textColor?: string;    // Color for text shapes
}
```

#### FR2.3: Group Selection Behavior
**Single Click on Group:**
- Selects entire group
- Shows dashed border around all group contents
- Transformer shows bounding box of entire group
- PropertiesPanel shows group properties

**Double Click on Group:**
- Enters "group edit mode"
- Dashed border turns solid
- Can now click individual shapes inside
- Breadcrumb shows: "Group 1 > Rectangle 3"
- Exit mode: Click outside group or press Esc

#### FR2.4: Group Transformations
**Moving Group:**
- Dragging group moves all children
- Children maintain relative positions
- Real-time sync to all users

**Rotating Group:**
- Rotate handle on group transformer
- All children rotate around group center
- Individual shape rotations combine with group rotation

**Resizing Group:**
- NOT supported in MVP (complex to implement correctly)
- Future enhancement

#### FR2.5: Group Properties Panel
```
Group Properties
─────────────────
Name: [Group 1        ]

Position
  X: [2500] Y: [2500]

Rotation
  [45°]

Colors
─────────────────
Shapes Color: [🎨 #3B82F6]
  ↪ Affects: Rectangles, Circles, Lines

Text Color: [🎨 #000000]
  ↪ Affects: Text shapes

Children: 5 shapes
```

**Color Behavior:**
- **Shapes Color**: Changes fill of all rectangles, circles; stroke of all lines
- **Text Color**: Changes fill (text color) of all text shapes
- Colors are applied to all matching children recursively (including nested groups)

#### FR2.6: Nested Groups
- Groups can contain other groups
- No depth limit (but UI shows warning at 5+ levels)
- When moving parent group, all nested children move
- When rotating parent group, rotations stack

**Example Hierarchy:**
```
└── Group 1
    ├── Group 2
    │   ├── Rectangle 1
    │   └── Circle 2
    ├── Rectangle 3
    └── Text 4
```

#### FR2.7: Ungrouping
- User selects group
- User presses Ctrl+Shift+G (or "Ungroup" button)
- Group is deleted
- All children become individual shapes at their current positions
- Children maintain current transformations (position, rotation, color)

#### FR2.8: Deleting Groups
- User selects group and presses Delete
- Confirmation dialog: "Delete group and all contents?"
- If confirmed, group and ALL children are deleted recursively
- If group is nested, only selected group subtree is deleted

#### FR2.9: Duplicating Groups
- User selects group and presses Ctrl+D
- System creates duplicate of group and all children
- New group named "Group 1 copy"
- All children duplicated with "-copy" suffix
- Duplicate offset 20px down and right

#### FR2.10: LayersPanel Integration
**Visual Hierarchy:**
```
▼ Group 1                    [👁️] [🔒]
  ├── Rectangle 1            [👁️] [🔒]
  ├── ▼ Group 2              [👁️] [🔒]
  │   ├── Circle 2           [👁️] [🔒]
  │   └── Text 3             [👁️] [🔒]
  └── Line 4                 [👁️] [🔒]
```

**Drag & Drop:**
- User can drag Rectangle 1 OUT of Group 1 → becomes individual shape
- User can drag Circle 5 INTO Group 1 → becomes group child
- User can reorder children within group
- Visual indicator shows drop zone while dragging

**Collapse/Expand:**
- Click arrow to collapse/expand group
- Collapsed groups show "▶ Group 1 (5 shapes)"
- Expanded groups show all children with indentation

#### FR2.11: Visual Indicators
**Dashed Border:**
- When group is selected (not in edit mode)
- Dashed blue border around bounding box
- Border color matches selection color
- Border width: 2px
- Dash pattern: 5px dash, 5px gap

**Edit Mode:**
- Solid border when in edit mode
- Individual shapes show selection as normal

#### FR2.12: AI Integration
AI should understand groups:
- "Move Group 1 to center" → moves entire group
- "Change Group 1 color to red" → changes shapes color
- "Create a group" → AI explains it can't group, user must select shapes first
- AI can create shapes and immediately group them (future)

### Non-Goals (Out of Scope)
- Group resizing (complex scaling logic)
- Group styling (border, background, padding)
- Auto-grouping based on proximity
- Group templates or components
- Group constraints and layout rules
- Boolean operations (union, subtract, intersect)

### Design Considerations

#### Performance
- Groups are regular shapes in Firestore (type: 'group')
- Rendering uses Konva Group node (efficient)
- Large groups (100+ children) may need optimization
- Consider lazy loading children if group is collapsed

#### Edge Cases
- Empty group (0 children) → auto-delete
- Group with 1 child → allow (don't auto-ungroup)
- Circular nesting → prevent (check on group creation)
- Group locked by another user → show lock indicator on group border

### Success Criteria
- ✅ User can press G to group selected shapes
- ✅ Grouped shapes move together as one unit
- ✅ Double-click enters group edit mode
- ✅ Single click selects entire group
- ✅ Ungrouping works correctly
- ✅ Nested groups work without bugs
- ✅ LayersPanel shows correct hierarchy
- ✅ Drag & drop in LayersPanel works
- ✅ Group colors affect correct shapes
- ✅ Real-time sync works for groups
- ✅ Deleting group deletes all children
- ✅ Duplicating group duplicates all children

---

## Feature 3: Endless Canvas

### Problem Statement
Current canvas is limited to 5000x5000px. Users run out of space when:
- Working on large projects with many artboards
- Collaborating with many team members on different areas
- Creating detailed designs that need zoom-in work

### Goals
1. Expand canvas to 100,000 x 100,000 pixels (-50k to +50k)
2. Maintain 60 FPS performance regardless of total shape count
3. Only render shapes visible in current viewport + buffer
4. Provide navigation helpers to jump between users
5. Enable double-click on shape in LayersPanel to navigate to it

### User Stories

**As a designer working on large projects:**
- I want unlimited canvas space for my work
- I want smooth performance even with 1000+ shapes
- I want to pan anywhere without hitting edges
- I want to zoom to see other users' work areas
- I want to double-click a shape in layers to jump to it

**As a team member:**
- I want to see where other users are working
- I want to quickly jump to another user's viewport
- I want to know if I'm far from origin

### Functional Requirements

#### FR3.1: Canvas Bounds
- Canvas bounds: -50,000 to +50,000 (both X and Y)
- Total area: 100,000 x 100,000 pixels
- 400x larger than current canvas (5000x5000)
- Origin (0, 0) remains at center of bounds

#### FR3.2: Viewport Culling
**Implementation:**
- Calculate visible viewport rectangle
- Add buffer zone (2x viewport size in each direction)
- Only render shapes whose bounds intersect with buffered viewport
- Store all shapes in memory (load from Firestore as usual)
- Use Konva's built-in culling or manual visibility calculation

**Algorithm:**
```typescript
function isShapeVisible(shape: Shape, viewport: Viewport, buffer: number): boolean {
  const viewportWithBuffer = {
    x: viewport.x - viewport.width * buffer,
    y: viewport.y - viewport.height * buffer,
    width: viewport.width * (1 + 2 * buffer),
    height: viewport.height * (1 + 2 * buffer)
  };
  
  return shapeBounds.intersects(viewportWithBuffer);
}
```

**Buffer Multiplier:** 2x (renders 5x5 viewport grid)

#### FR3.3: Performance Target
- **60 FPS** when panning and zooming
- Render all shapes in viewport (no hard limit)
- Typical viewport: 1920x1080 @ 100% zoom = ~50-200 shapes
- If FPS drops below 40, show performance warning

#### FR3.4: Navigation Helpers

**"Go to User" Dropdown:**
- Button in toolbar or navbar
- Opens dropdown showing all online users
- Format: "[User Name] (Area: 1234, 5678)"
- Click user → animate pan/zoom to their cursor position
- Animation duration: 500ms ease-in-out

**LayersPanel Navigation:**
- Double-click any shape/group in LayersPanel
- Canvas pans/zooms to show that shape in center
- Highlight shape briefly (1s glow effect)
- Zoom level: fit shape in viewport with 20% padding

#### FR3.5: Current Position Indicator
- Show current viewport center in LayersPanel header
- Format: "(X: 1234, Y: 5678)"
- Or relative: "1500px from origin"
- Click coordinates → open "Go to Position" modal

#### FR3.6: Zoom and Pan
- No changes to zoom behavior (mousewheel, buttons)
- No changes to pan behavior (space + drag, middle mouse)
- Remove canvas bounds clamping for pan
- User can pan infinitely in any direction

#### FR3.7: Shape Position Limits
- Shapes can be created anywhere within bounds (-50k to +50k)
- Attempting to create/move shape outside bounds:
  - Clamp to nearest edge
  - Show warning toast: "Shape moved to canvas edge"
  - Log to console for debugging

#### FR3.8: AI Integration
- AI position parsing updated for new bounds
- "center" still means (0, 0)
- "top-left" means (-49900, -49900)
- AI can place shapes anywhere in bounds
- AI respects viewport when user says "here" or "nearby"

#### FR3.9: Initial Load Optimization
- On first load, fetch all shapes from Firestore
- Display loading progress: "Loading shapes... 237/1043"
- Once loaded, keep in memory for entire session
- Real-time updates work as normal (Firestore listeners)

#### FR3.10: Empty Canvas Handling
- If no shapes exist, show helpful message at origin
- "Start creating shapes or invite team members"
- Show coordinate grid for orientation
- Prevent user from getting "lost" (snap to origin on first load)

### Non-Goals (Out of Scope)
- Minimap (removed per user request)
- Chunking system (use viewport culling instead)
- Lazy loading shapes from Firestore (load all on init)
- Spatial indexing (not needed for expected shape count)
- Infinite canvas (use large bounds instead)
- Canvas sections or artboards
- Ruler measurements

### Design Considerations

#### Performance Optimizations
1. **React.memo for Shape components** (already exists)
2. **Konva layer caching** (evaluate if needed)
3. **Throttle pan/zoom updates** (already exists)
4. **Batch shape updates** (already exists)
5. **Virtual scrolling in LayersPanel** (if 1000+ shapes)

#### User Experience
- Show loading skeleton during initial shape fetch
- Display shape count and visible count: "Showing 47 of 1,230 shapes"
- Performance mode toggle (if FPS drops, reduce visual effects)

### Technical Considerations

#### Coordinate System
- Keep Konva's default coordinate system
- No changes needed to existing shape rendering
- Update canvas boundary checks

#### Firestore Queries
- Keep current query: fetch all shapes for current page
- No spatial queries needed (load all, render selectively)
- If page has 10,000+ shapes, consider pagination (future)

#### Real-Time Updates
- No changes to Firestore listeners
- Shape updates outside viewport still received (stored in memory)
- When viewport moves, newly visible shapes render immediately

### Success Criteria
- ✅ Canvas bounds are 100,000 x 100,000
- ✅ Maintain 60 FPS with 1000+ shapes total
- ✅ Only visible shapes are rendered
- ✅ Pan and zoom work smoothly without bounds
- ✅ "Go to User" navigation works
- ✅ Double-click shape in LayersPanel navigates to it
- ✅ AI commands work with new bounds
- ✅ No performance degradation from current version
- ✅ Loading states are clear and helpful

---

## Cross-Feature Integration

### Projects + Grouping
- Groups are stored per page (within project/page structure)
- Group IDs must be unique within page
- Moving shapes between pages breaks groups (ungroups automatically)

### Projects + Endless Canvas
- Each page has endless canvas (-50k to +50k)
- Page thumbnail shows viewport of first shapes created
- Global Canvas also has endless canvas

### Grouping + Endless Canvas
- Groups work identically on endless canvas
- Group center calculation works with any coordinates
- LayersPanel navigation to groups works on endless canvas

### AI + All Features
- AI commands scoped to current project page
- AI can create groups (manual grouping only in MVP)
- AI understands new canvas bounds
- AI can reference groups: "Move Group 1 to center"

---

## Technical Architecture

### Updated Firestore Schema
```
projects/
  {projectId}/
    metadata: { name, description, createdAt, ownerId, thumbnail }
    members: { userId: { role, joinedAt } }
    
    pages/
      {pageId}/
        metadata: { name, createdAt, order }
        shapes: Shape[]  // Includes groups (type: 'group')

invites/
  {inviteCode}/
    { projectId, createdBy, permission, expiresAt }

globalCanvas/
  pages/
    global-page/
      shapes: Shape[]  // Includes groups

users/
  {userId}/
    projects: string[]  // Quick access to user's projects
```

### Updated TypeScript Types
```typescript
// New Types
interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  ownerId: string;
  thumbnail: string;
  members: Record<string, ProjectMember>;
}

interface ProjectMember {
  role: 'view' | 'edit' | 'admin';
  joinedAt: number;
}

interface Page {
  id: string;
  name: string;
  createdAt: number;
  order: number;
}

interface InviteCode {
  id: string;  // 10-char code
  projectId: string;
  createdBy: string;
  permission: 'view' | 'edit' | 'admin';
  expiresAt: number;
  usedBy?: string[];
}

// Updated Shape Type
type Shape = RectangleShape | CircleShape | TextShape | LineShape | GroupShape;

interface GroupShape extends BaseShape {
  type: 'group';
  childIds: string[];
  shapesColor?: string;
  textColor?: string;
}

// Canvas Bounds
const CANVAS_BOUNDS = {
  MIN: -50000,
  MAX: 50000,
  WIDTH: 100000,
  HEIGHT: 100000
};
```

### Component Architecture Updates
```
src/
├── components/
│   ├── Projects/
│   │   ├── ProjectsHome.tsx       # NEW: Homepage with project cards
│   │   ├── ProjectCard.tsx        # NEW: Individual project card
│   │   ├── ProjectModal.tsx       # NEW: Create/edit project
│   │   ├── InviteModal.tsx        # NEW: Generate invite links
│   │   ├── MembersList.tsx        # NEW: Project members management
│   │   └── PageSelector.tsx       # NEW: Page dropdown in navbar
│   ├── Canvas/
│   │   ├── Canvas.tsx             # UPDATED: Viewport culling
│   │   ├── LayersPanel.tsx        # UPDATED: Group hierarchy, navigation
│   │   ├── PropertiesPanel.tsx    # UPDATED: Group properties
│   │   ├── GroupShape.tsx         # NEW: Group rendering
│   │   └── NavigationHelpers.tsx  # NEW: Go to user, go to shape
│   └── Layout/
│       └── Navbar.tsx              # UPDATED: Project/page dropdowns
├── contexts/
│   ├── ProjectContext.tsx         # NEW: Project state management
│   ├── CanvasContext.tsx          # UPDATED: Group operations
│   └── AuthContext.tsx            # UPDATED: User projects list
├── services/
│   ├── projects.ts                # NEW: Project CRUD operations
│   ├── invites.ts                 # NEW: Invite code generation/validation
│   ├── canvas.ts                  # UPDATED: Group operations
│   └── ai/
│       ├── openai.ts              # UPDATED: Group awareness, new bounds
│       └── positionParser.ts      # UPDATED: New canvas bounds
└── hooks/
    ├── useProjectPermissions.ts   # NEW: Check user permissions
    ├── useViewportCulling.ts      # NEW: Calculate visible shapes
    └── useGroupOperations.ts      # NEW: Group creation/editing
```

---

## Success Metrics

### Projects & Pages
- **Adoption**: 80% of active users create at least 1 project
- **Collaboration**: Average 2.5 members per project
- **Usage**: 60% of users work in projects vs Global Canvas
- **Performance**: Project creation < 500ms
- **Reliability**: 99.9% successful invite joins

### Grouping
- **Adoption**: 50% of users create at least 1 group
- **Usage**: Average 3 shapes per group
- **Performance**: Group operations maintain 60 FPS
- **Reliability**: 0 data loss incidents with nested groups

### Endless Canvas
- **Performance**: 60 FPS maintained with 1000+ shapes
- **Scale**: Support projects with 5000+ shapes
- **Navigation**: 80% of users use navigation helpers
- **Reliability**: No coordinate precision issues reported

### Overall
- **Performance**: No regression from current version
- **Stability**: < 0.1% error rate across all features
- **User Satisfaction**: 4.5+ star rating (if collected)
- **Real-Time Sync**: < 100ms latency maintained

---

## Implementation Timeline

### Phase 1: Projects & Pages (Weeks 1-3)
- Week 1: Schema, basic CRUD, homepage
- Week 2: Invite system, permissions, navigation
- Week 3: Polish, testing, bug fixes

### Phase 2: Grouping (Weeks 4-5)
- Week 4: Core grouping, LayersPanel hierarchy
- Week 5: Group properties, colors, testing

### Phase 3: Endless Canvas (Weeks 6-7)
- Week 6: Viewport culling, navigation helpers
- Week 7: Performance optimization, testing

### Phase 4: Integration & Launch (Week 8)
- Week 8: Cross-feature testing, documentation, deployment

---

## Open Questions
None - all questions answered during planning phase.

---

## Appendices

### Security Considerations
- All Firestore operations require authentication
- Permission checks on every canvas operation
- Invite codes are single-use or time-limited
- Rate limiting on project creation (10/hour per user)

### Accessibility
- Keyboard shortcuts documented in tutorial
- ARIA labels on all interactive elements
- Screen reader support for LayersPanel hierarchy
- High contrast mode support

### Browser Support
- Chrome 90+
- Firefox 88+
- Edge 90+
- Safari 14+

---

**Document End**

