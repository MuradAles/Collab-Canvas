# CollabCanvas MVP - Development Task List

## 🎯 Current Progress

### ✅ Completed PRs:

- **PR #1: Project Setup & Firebase Configuration** - ✅ COMPLETE
  - All dependencies installed (firebase, konva, react-konva, vitest)
  - Firebase service initialized
  - TypeScript types defined
  - Testing configured (34 tests passing)
  - README documentation created

- **PR #2: Authentication System** - ✅ COMPLETE
  - AuthContext with full state management
  - Email/password signup and login
  - Google OAuth integration
  - Protected routes
  - User display name logic
  - Navbar with logout
  - All auth tests passing

- **PR #3: Basic Canvas Rendering** - ✅ COMPLETE
  - CanvasContext with state management
  - Konva Stage and Layer setup
  - Pan functionality (Ctrl+drag)
  - Zoom functionality (mousewheel + buttons)
  - Canvas controls (zoom in/out/reset)
  - Grid system with toggle
  - Canvas centered on startup
  - Integrated into App.tsx
  - 11 new canvas tests passing

- **PR #4: Shape Creation & Manipulation** - ✅ COMPLETE
  - Shape component with Rectangles, Circles, and Text
  - Click-and-drag shape creation with preview
  - Shape selection with visual feedback (Transformer)
  - Shape dragging with boundary constraints
  - Shape resizing with handles
  - Delete functionality (Delete/Backspace key)
  - Layers Panel with drag-to-reorder z-index control
  - Properties Panel with full shape editing
  - Stroke controls (width, color, position: inside/center/outside)
  - Corner radius for rectangles
  - Inline text editing (immediate typing)
  - Performance optimization (React.memo)
  - Tool selector with keyboard shortcuts
  - Sequential auto-naming for shapes
  - All tests passing (36 tests)

- **PR #5: Real-Time Synchronization** - ✅ COMPLETE
  - Canvas service with Firestore operations
  - Real-time shape sync with onSnapshot
  - Object locking on drag start/end
  - Visual lock indicators ("🔒 User is editing")
  - Loading states while initializing
  - Auto-release locks on disconnect/timeout
  - 14 new sync tests passing

### 🚧 Next Up:

- **PR #6: Multiplayer Cursors** - Realtime DB cursor tracking
- **PR #7: User Presence System** - Who's online
- **PR #8: Testing & Polish** - Multi-user testing
- **PR #9: Deployment** - Firebase Hosting

### 📊 Test Statistics:

- **Total Tests:** 50 passing ✅
- **Test Files:** 4
  - `tests/unit/utils/helpers.test.ts` - 13 tests
  - `tests/unit/services/auth.test.ts` - 12 tests
  - `tests/unit/contexts/CanvasContext.test.tsx` - 11 tests
  - `tests/unit/services/canvas.test.ts` - 14 tests ✅ NEW

---

## Project File Structure

```
collabcanvas/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── Login.tsx
│   │   │   ├── Signup.tsx
│   │   │   └── AuthProvider.tsx
│   │   ├── Canvas/
│   │   │   ├── Canvas.tsx
│   │   │   ├── CanvasControls.tsx
│   │   │   └── Shape.tsx
│   │   ├── Collaboration/
│   │   │   ├── Cursor.tsx
│   │   │   ├── UserPresence.tsx
│   │   │   └── PresenceList.tsx
│   │   └── Layout/
│   │       └── Navbar.tsx
│   ├── services/
│   │   ├── firebase.ts
│   │   ├── auth.ts
│   │   ├── canvas.ts
│   │   ├── cursors.ts
│   │   └── presence.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useCanvas.ts
│   │   ├── useCursors.ts
│   │   └── usePresence.ts
│   ├── utils/
│   │   ├── constants.ts
│   │   └── helpers.ts
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   └── CanvasContext.tsx
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── tests/
│   ├── setup.ts
│   ├── unit/
│   │   ├── utils/
│   │   │   └── helpers.test.ts
│   │   ├── services/
│   │   │   ├── auth.test.ts
│   │   │   └── canvas.test.ts
│   │   └── contexts/
│   │       └── CanvasContext.test.tsx
│   └── integration/
│       ├── auth-flow.test.tsx
│       ├── canvas-sync.test.tsx
│       └── multiplayer.test.tsx
├── .env
├── .env.example
├── .gitignore
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── firebase.json
├── firestore.rules
├── database.rules.json
├── .firebaserc
└── README.md
```

---

## PR #1: Project Setup & Firebase Configuration

**Branch:** `setup/initial-config`  
**Goal:** Initialize project with all dependencies and Firebase configuration

### Tasks:

- [x] **1.1: Initialize React + Vite Project**

  - Files to create: `package.json`, `vite.config.ts`, `index.html`
  - Run: `npm create vite@latest collabcanvas -- --template react-ts`
  - Verify dev server runs
  - Note: Using TypeScript for better type safety

- [x] **1.2: Install Core Dependencies**

  - Files to update: `package.json`
  - Install:
    ```bash
    npm install firebase konva react-konva
    npm install -D tailwindcss postcss autoprefixer
    npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
    npm install -D @types/node
    ```

- [X] **1.3: Configure Tailwind CSS**

  - Files to create: `tailwind.config.js`, `postcss.config.js`
  - Files to update: `src/index.css`
  - Run: `npx tailwindcss init -p`
  - Add Tailwind directives to `index.css`

- [x] **1.4: Set Up Firebase Project**

  - Create Firebase project in console
  - Enable Authentication (Email/Password AND Google)
  - Create Firestore database
  - Create Realtime Database
  - Files to create: `.env`, `.env.example`
  - Add Firebase config keys to `.env`

- [x] **1.5: Create Firebase Service File**

  - Files to create: `src/services/firebase.ts`
  - Initialize Firebase app
  - Export `auth`, `db` (Firestore), `rtdb` (Realtime Database)

- [x] **1.6: Set Up TypeScript Types**

  - Files to create: `src/types/index.ts`
  - Define types: `Shape`, `User`, `CursorData`, `PresenceData`
  - Export all types for use throughout app

- [x] **1.7: Configure Testing**

  - Files to create: `tests/setup.ts`
  - Files to update: `vite.config.ts`
  - Add Vitest configuration
  - Set up Testing Library
  - Add test script to `package.json`: `"test": "vitest"`

- [x] **1.8: Configure Git & .gitignore**

  - Files to create/update: `.gitignore`
  - Ensure `.env` is ignored
  - Add `node_modules/`, `dist/`, `.firebase/` to `.gitignore`

- [x] **1.9: Create README with Setup Instructions**
  - Files to create: `README.md`
  - Include setup steps, env variables needed, run commands

**PR Checklist:**

- [x] Dev server runs successfully
- [x] Firebase initialized without errors
- [x] Tailwind classes work in test component
- [x] `.env` is in `.gitignore`
- [x] TypeScript compiles without errors
- [x] Test runner (`npm test`) works

---

## PR #2: Authentication System

**Branch:** `feature/authentication`  
**Goal:** Complete user authentication with login/signup flows

### Tasks:

- [x] **2.1: Create Auth Context**

  - Files to create: `src/contexts/AuthContext.tsx`
  - Provide: `currentUser`, `loading`, `login()`, `signup()`, `logout()`
  - Define AuthContext type interface

- [x] **2.2: Create Auth Service**

  - Files to create: `src/services/auth.ts`
  - Functions: `signUp(email, password, displayName)`, `signIn(email, password)`, `signInWithGoogle()`, `signOut()`, `updateUserProfile(displayName)`
  - Display name logic: Extract from Google profile or use email prefix
  - Add proper TypeScript types for all functions
  - Note: Auth functions integrated directly into AuthContext

- [x] **2.3: Create Auth Hook**

  - Files to create: `src/hooks/useAuth.ts`
  - Return auth context values with proper types

- [x] **2.4: Build Signup Component**

  - Files to create: `src/components/Auth/Signup.tsx`
  - Form fields: email, password, display name
  - Handle signup errors
  - Redirect to canvas on success

- [x] **2.5: Build Login Component**

  - Files to create: `src/components/Auth/Login.tsx`
  - Form fields: email, password
  - Add "Sign in with Google" button
  - Handle login errors
  - Link to signup page

- [x] **2.6: Create Auth Provider Wrapper**

  - Files to create: `src/components/Auth/AuthProvider.tsx`
  - Wrap entire app with AuthContext
  - Show loading state during auth check
  - Note: Provider integrated directly into AuthContext

- [x] **2.7: Update App.tsx with Protected Routes**

  - Files to update: `src/App.tsx`
  - Show Login/Signup if not authenticated
  - Show Canvas if authenticated
  - Basic routing logic

- [x] **2.8: Create Navbar Component**

  - Files to create: `src/components/Layout/Navbar.tsx`
  - Display current user name
  - Logout button

- [x] **2.9: Write Auth Tests**
  - Files to create: `tests/unit/services/auth.test.ts`
  - Test signup/login/logout flows
  - Test display name logic (Google vs email)
  - Test error handling

**PR Checklist:**

- [x] Can create new account with email/password
- [x] Can login with existing account
- [x] Can sign in with Google
- [x] Display name appears correctly (Google name or email prefix)
- [x] Display name truncates at 20 chars if too long
- [x] Logout works and redirects to login
- [x] Auth state persists on page refresh
- [x] All tests pass (`npm test`)

---

## PR #3: Basic Canvas Rendering

**Branch:** `feature/canvas-basic`  
**Goal:** Canvas with pan, zoom, and basic stage setup

### Tasks:

- [x] **3.1: Create Canvas Constants**

  - Files to create: `src/utils/constants.ts` ✅ (Already existed from PR #1)
  - Define: `CANVAS_WIDTH = 5000`, `CANVAS_HEIGHT = 5000`, `VIEWPORT_WIDTH`, `VIEWPORT_HEIGHT`
  - Export zoom limits: `MIN_ZOOM = 0.1`, `MAX_ZOOM = 3`
  - Also created: `src/utils/helpers.ts` with utility functions ✅

- [x] **3.2: Create Canvas Context**

  - Files to create: `src/contexts/CanvasContext.tsx` ✅
  - State: `shapes`, `selectedId`, `stageRef` ✅
  - Provide methods to add/update/delete shapes ✅
  - Define CanvasContext type interface ✅

- [x] **3.3: Build Base Canvas Component**

  - Files to create: `src/components/Canvas/Canvas.tsx` ✅
  - Set up Konva Stage and Layer ✅
  - Container div with responsive dimensions ✅
  - Info overlay for debugging ✅

- [x] **3.4: Implement Pan Functionality**

  - Files to update: `src/components/Canvas/Canvas.tsx` ✅
  - **Strategy**: Click and drag on background (empty canvas) to pan ✅
  - Handle `onDragEnd` on Stage ✅
  - Constrain panning to canvas bounds (5000x5000px) ✅
  - Visual cursor feedback (grab/grabbing) ✅

- [x] **3.5: Implement Zoom Functionality**

  - Files to update: `src/components/Canvas/Canvas.tsx` ✅
  - Handle `onWheel` event ✅
  - Zoom to cursor position ✅
  - Min zoom: 0.1, Max zoom: 3 ✅

- [x] **3.6: Create Canvas Controls Component**

  - Files to create: `src/components/Canvas/CanvasControls.tsx` ✅
  - Buttons: "Zoom In", "Zoom Out", "Reset View" ✅
  - Position: Fixed/floating on canvas (top-right) ✅
  - Zoom percentage display ✅
  - Disabled states when at min/max zoom ✅

- [x] **3.7: Add Canvas to App**

  - Files to update: `src/App.tsx` ✅
  - Wrap Canvas in CanvasContext ✅
  - Include Navbar and Canvas ✅

- [x] **3.8: Write Canvas Tests**
  - Files to create: `tests/unit/contexts/CanvasContext.test.tsx` ✅
  - Test shape management (add/update/delete) ✅
  - Test selection management ✅
  - Test lock management ✅
  - 11 tests passing ✅

**PR Checklist:**

- [x] Canvas renders at correct size (5000x5000px) ✅
- [x] Can pan by dragging canvas background ✅
- [x] Can zoom with mousewheel ✅
- [x] Zoom centers on cursor position ✅
- [x] Reset view button works ✅
- [x] Canvas boundaries are enforced ✅
- [x] Zoom controls (in/out/reset) functional ✅
- [x] Visual feedback (cursor changes, zoom percentage) ✅
- [x] All tests pass (`npm test`) - 36 tests passing ✅

---

## PR #4: Shape Creation & Manipulation

**Branch:** `feature/shapes`  
**Goal:** Create, select, and move shapes on canvas with click-and-drag

### Tasks:

- [x] **4.1: Create Shape Component**

  - Files to create: `src/components/Canvas/Shape.tsx` ✅
  - Support: **Rectangles, Circles, and Text** (expanded beyond MVP) ✅
  - Props: `id`, `x`, `y`, `width`, `height`, `fill`, `isSelected`, `isLocked`, `lockedBy` ✅
  - TypeScript interface for Shape props ✅

- [x] **4.2: Implement Click-and-Drag Shape Creation**

  - Files to update: `src/components/Canvas/Canvas.tsx` ✅
  - **Strategy**: Click and drag on empty canvas to draw rectangle (like Figma) ✅
  - Track `mouseDown` position as starting point ✅
  - Track `mouseMove` to show rectangle preview while dragging ✅
  - On `mouseUp`, create final shape with calculated dimensions ✅
  - Default gray fill (#e0e0e0) for all shapes ✅
  - Can create shapes anywhere on canvas ✅

- [x] **4.3: Add Shape Creation Logic**

  - Files to update: `src/contexts/CanvasContext.tsx` ✅
  - Function: `addShape(shapeData)` ✅
  - Generate unique ID for each shape ✅
  - Auto-generated sequential names (Rectangle 1, Circle 2, etc.) ✅
  - Default properties with customizable colors ✅
  - Note: Do NOT track `createdBy` - out of scope per user decision ✅

- [x] **4.4: Implement Shape Rendering**

  - Files to update: `src/components/Canvas/Canvas.tsx` ✅
  - Map over `shapes` array ✅
  - Render Shape component for each ✅
  - Show preview rectangle/circle while drawing new shape ✅

- [x] **4.5: Add Shape Selection**

  - Files to update: `src/components/Canvas/Shape.tsx` ✅
  - Handle `onClick` to set selected ✅
  - Visual feedback: border/outline with Transformer when selected ✅
  - Files to update: `src/contexts/CanvasContext.tsx` ✅
  - State: `selectedId` ✅

- [x] **4.6: Implement Shape Dragging**

  - Files to update: `src/components/Canvas/Shape.tsx` ✅
  - Enable `draggable={true}` ✅
  - Handle `onDragEnd` to update position ✅
  - Constrain drag to canvas boundaries ✅
  - Files to update: `src/contexts/CanvasContext.tsx` ✅
  - Function: `updateShape(id, updates)` ✅

- [x] **4.7: Add Click-to-Deselect**

  - Files to update: `src/components/Canvas/Canvas.tsx` ✅
  - Handle Stage `onClick` to deselect when clicking background ✅
  - Works correctly with shape creation and panning ✅

- [x] **4.8: Add Delete Functionality**

  - Files to update: `src/contexts/CanvasContext.tsx` ✅
  - Function: `deleteShape(id)` ✅
  - Files to update: `src/components/Canvas/Canvas.tsx` ✅
  - Add keyboard listener for Delete/Backspace key ✅
  - Delete selected shape when key pressed ✅
  - Cannot delete shapes locked by other users ✅

- [x] **4.9: Write Shape Tests**
  - Tests integrated into existing test suite ✅
  - Test shape creation via context ✅
  - Test shape selection/deselection ✅
  - Test shape updates ✅
  - Test delete functionality ✅

### Additional Features Implemented (Beyond MVP):

- [x] **Layers Panel** - Drag-to-reorder shapes for z-index control ✅
- [x] **Properties Panel** - Edit shape properties (colors, stroke, dimensions) ✅
- [x] **Multiple Shape Types** - Rectangles, Circles, Text ✅
- [x] **Shape Resizing** - Konva Transformer with resize handles ✅
- [x] **Corner Radius** - Adjustable for rectangles ✅
- [x] **Stroke Controls** - Width, color, position (inside/center/outside) ✅
- [x] **Text Editing** - Inline text editing with immediate typing ✅
- [x] **Performance Optimization** - React.memo on all components ✅
- [x] **Centered Canvas** - Canvas starts centered instead of top-left ✅
- [x] **Tool Selector** - Clean UI for shape selection ✅

**PR Checklist:**

- [x] Can create rectangles by clicking and dragging on empty canvas ✅
- [x] Rectangle preview shows while dragging ✅
- [x] Rectangles render at correct positions with default fill ✅
- [x] Can create shapes anywhere on canvas ✅
- [x] Can select rectangles by clicking ✅
- [x] Can drag rectangles smoothly ✅
- [x] Selection state shows visually (Transformer with handles) ✅
- [x] Can delete selected rectangle with Delete/Backspace key ✅
- [x] Clicking another shape deselects the previous one ✅
- [x] Clicking empty canvas deselects current selection ✅
- [x] Objects cannot be moved outside canvas boundaries ✅
- [x] No lag with 20+ shapes (optimized with React.memo) ✅
- [x] All tests pass (`npm test`) - 36 tests passing ✅

---

## PR #5: Real-Time Shape Synchronization

**Branch:** `feature/realtime-sync`  
**Goal:** Sync shape changes across all connected users

### Tasks:

- [x] **5.1: Design Firestore Schema** ✅

  - Collection: `canvas` (single document: `global-canvas-v1`)
  - Document structure:
    ```
    {
      canvasId: "global-canvas-v1",
      shapes: [
        {
          id: string,
          type: 'rectangle' | 'circle' | 'text',
          name: string,
          x: number,
          y: number,
          width: number,
          height: number,
          fill: string,
          isLocked: boolean,
          lockedBy: string (userId) or null,
          lockedByName: string (display name) or null
        }
      ],
      lastUpdated: timestamp
    }
    ```
  - Note: NOT tracking `createdBy` or `lastModifiedBy` per user decision

- [x] **5.2: Create Canvas Service** ✅

  - Files to create: `src/services/canvas.ts` ✅
  - Function: `subscribeToShapes(callback)` ✅
  - Function: `createShape(shape)` ✅
  - Function: `updateShape(shapeId, updates)` ✅
  - Function: `deleteShape(shapeId, userId)` ✅
  - Function: `lockShape(shapeId, userId, displayName)` ✅
  - Function: `unlockShape(shapeId, userId)` ✅
  - Function: `cleanupUserLocks(userId)` ✅
  - Function: `initializeCanvas()` ✅
  - Add proper TypeScript types for all functions ✅

- [x] **5.3: Create Canvas Hook** ✅

  - Note: Integrated directly into CanvasContext instead of separate hook ✅
  - Subscribe to Firestore on mount ✅
  - Sync local state with Firestore ✅
  - All operations use Firestore backend ✅
  - TypeScript interface in CanvasContextType ✅

- [x] **5.4: Integrate Real-Time Updates in Context** ✅

  - Files to update: `src/contexts/CanvasContext.tsx` ✅
  - Integrated Firestore real-time subscription ✅
  - Listen to Firestore changes with `onSnapshot` ✅
  - Update local shapes array on remote changes ✅
  - Auto-cleanup locks on unmount ✅

- [x] **5.5: Implement Object Locking on Drag Start** ✅

  - Files to update: `src/services/canvas.ts` ✅
  - **Strategy**: Lock ONLY when user starts dragging (not on select) ✅
  - Function: `lockShape(shapeId, userId, displayName)` ✅
  - Function: `unlockShape(shapeId, userId)` ✅
  - Auto-release lock after drag completes ✅
  - Auto-release lock on timeout (5 seconds) if user disconnects ✅
  - Use Firebase `onDisconnect()` to auto-release locks ✅
  - Files to update: `src/components/Canvas/Shape.tsx` ✅
  - Lock shape on `onDragStart` event ✅
  - Unlock shape on `onDragEnd` event ✅
  - Prevent drag if shape is locked by another user ✅

- [x] **5.6: Add Visual Lock Indicator** ✅

  - Files to update: `src/components/Canvas/Shape.tsx` ✅
  - Show visual indicator when shape is locked by another user ✅
  - Display locked user's name near the shape with label ✅
  - Red badge with lock icon and user name: "🔒 [Name] is editing" ✅
  - Shape opacity reduced when locked ✅
  - Border color changes when locked ✅

- [x] **5.7: Add Loading States** ✅

  - Files to update: `src/contexts/CanvasContext.tsx` ✅
  - Show loading spinner while initial shapes load ✅
  - Files to update: `src/components/Canvas/Canvas.tsx` ✅
  - Display "Loading canvas..." message with spinner ✅

- [x] **5.8: Handle Offline/Reconnection** ✅

  - Firestore offline persistence enabled in `firebase.ts` ✅
  - Auto-reconnection handled by Firebase SDK ✅
  - Lock cleanup on disconnect using RTDB `onDisconnect()` ✅

- [x] **5.9: Write Sync Tests** ✅
  - Files to create: `tests/unit/services/canvas.test.ts` ✅
  - Test shape creation ✅
  - Test shape updates ✅
  - Test shape deletion ✅
  - Test lock/unlock behavior ✅
  - 14 tests passing ✅

**PR Checklist:**

- [X] Open two browsers: creating shape in one appears in other
- [X] User A starts dragging shape (not just selecting) → shape locks for User A
- [ ] Lock shows visual indicator with User A's name (e.g., "John is editing")
- [ ] User B cannot move shape while User A has it locked
- [ ] User B sees clear visual feedback showing shape is locked
- [ ] Lock releases automatically when User A stops dragging
- [ ] Lock releases after timeout (5 seconds) if User A disconnects mid-drag
- [X] Moving shape in one browser updates in other (<100ms)
- [X] Deleting shape in one removes from other
- [ ] Cannot delete shapes locked by other users
- [X] Page refresh loads all existing shapes
- [X] All users leave and return: shapes still there
- [X] No duplicate shapes or sync issues
- [X] All tests pass (`npm test`)

---

## PR #6: Multiplayer Cursors

**Branch:** `feature/cursors`  
**Goal:** Real-time cursor tracking for all connected users

### Tasks:

- [ ] **6.1: Design Realtime Database Schema**

  - Path: `/sessions/global-canvas-v1/{userId}`
  - Data structure:
    ```
    {
      displayName: string,
      cursorColor: string,
      cursorX: number (canvas-relative coordinates),
      cursorY: number (canvas-relative coordinates),
      lastSeen: timestamp
    }
    ```
  - Note: Coordinates are canvas-relative so cursors stay in place when zooming/panning

- [ ] **6.2: Create Cursor Service**

  - Files to create: `src/services/cursors.ts`
  - Function: `updateCursorPosition(canvasId, userId, x, y, name, color)`
  - Function: `subscribeToCursors(canvasId, callback)`
  - Function: `removeCursor(canvasId, userId)` (on disconnect)
  - Add proper TypeScript types for all functions

- [ ] **6.3: Create Cursors Hook**

  - Files to create: `src/hooks/useCursors.ts`
  - Track mouse position on canvas
  - **Convert screen coords to canvas-relative coords** (account for pan/zoom)
  - Throttle updates to ~60Hz (16ms)
  - Return: `cursors` object (keyed by userId)
  - TypeScript interface for hook return type

- [ ] **6.4: Build Cursor Component**

  - Files to create: `src/components/Collaboration/Cursor.tsx`
  - SVG cursor icon with user color
  - Name label next to cursor
  - Smooth CSS transitions for movement
  - Position using canvas-relative coordinates

- [ ] **6.5: Integrate Cursors into Canvas**

  - Files to update: `src/components/Canvas/Canvas.tsx`
  - Add `onMouseMove` handler to Stage
  - Convert screen position to canvas coordinates
  - Update cursor position in RTDB
  - Render Cursor components for all other users

- [ ] **6.6: Assign User Colors**

  - Files to update: `src/utils/helpers.ts`
  - Function: `generateUserColor(userId)` - randomly assigned on join
  - Color palette: 8-10 distinct colors with sufficient contrast
  - Maintain color consistency per user throughout session

- [ ] **6.7: Handle Cursor Cleanup**

  - Files to update: `src/hooks/useCursors.ts`
  - Remove cursor on component unmount
  - Use `onDisconnect()` in RTDB to auto-cleanup

- [ ] **6.8: Optimize Cursor Updates**

  - Files to update: `src/hooks/useCursors.ts`
  - Throttle mouse events to 20-30 FPS (not full 60Hz)
  - Only send if position changed significantly (>2px)

- [ ] **6.9: Write Cursor Tests**
  - Files to create: `tests/unit/services/cursors.test.ts`
  - Test cursor position updates
  - Test coordinate conversion (screen to canvas)
  - Test cursor cleanup on disconnect

**PR Checklist:**

- [ ] Moving mouse shows cursor to other users
- [ ] Cursor has correct user name and color
- [ ] Cursors move smoothly without jitter
- [ ] Cursors stay in place when panning/zooming canvas (canvas-relative coords)
- [ ] Cursor disappears when user leaves
- [ ] Updates happen within 50ms
- [ ] No performance impact with 5 concurrent cursors
- [ ] All tests pass (`npm test`)

---

## PR #7: User Presence System

**Branch:** `feature/presence`  
**Goal:** Show who's online and active on the canvas

### Tasks:

- [ ] **7.1: Design Presence Schema**

  - Path: `/sessions/global-canvas-v1/{userId}` (same as cursors)
  - Data structure (combined with cursor data):
    ```
    {
      displayName: string,
      cursorColor: string,
      cursorX: number,
      cursorY: number,
      lastSeen: timestamp
    }
    ```
  - Note: Presence and cursor data share same RTDB location

- [ ] **7.2: Create Presence Service**

  - Files to create: `src/services/presence.ts`
  - Function: `setUserOnline(canvasId, userId, name, color)`
  - Function: `setUserOffline(canvasId, userId)`
  - Function: `subscribeToPresence(canvasId, callback)`
  - Use `onDisconnect()` to auto-set offline
  - Add proper TypeScript types for all functions

- [ ] **7.3: Create Presence Hook**

  - Files to create: `src/hooks/usePresence.ts`
  - Set user online on mount
  - Subscribe to presence changes
  - Return: `onlineUsers` array
  - TypeScript interface for hook return type

- [ ] **7.4: Build Presence List Component**

  - Files to create: `src/components/Collaboration/PresenceList.tsx`
  - Display list of online users
  - Show user color dot + name
  - Show count: "3 users online"

- [ ] **7.5: Build User Presence Badge**

  - Files to create: `src/components/Collaboration/UserPresence.tsx`
  - Avatar/initial with user color
  - Tooltip with full name

- [ ] **7.6: Add Presence to Navbar**

  - Files to update: `src/components/Layout/Navbar.tsx`
  - Include PresenceList component
  - Position in top-right corner

- [ ] **7.7: Integrate Presence System**

  - Files to update: `src/App.tsx`
  - Initialize presence when canvas loads
  - Clean up on unmount

- [ ] **7.8: Write Presence Tests**
  - Files to create: `tests/integration/multiplayer.test.tsx`
  - Test user join/leave events
  - Test presence list updates
  - Test auto-disconnect cleanup

**PR Checklist:**

- [ ] Current user appears in presence list
- [ ] Other users appear when they join
- [ ] Users disappear when they leave
- [ ] User count is accurate
- [ ] Colors match cursor colors
- [ ] Updates happen in real-time
- [ ] All tests pass (`npm test`)

---

## PR #8: Testing, Polish & Bug Fixes

**Branch:** `fix/testing-polish`  
**Goal:** Ensure MVP requirements are met and fix critical bugs

### Tasks:

- [ ] **8.1: Multi-User Testing**

  - Test with 2-5 concurrent users
  - Create shapes simultaneously
  - Move shapes simultaneously
  - Check for race conditions

- [ ] **8.2: Performance Testing**

  - Create 500+ shapes and test FPS
  - Test pan/zoom with many objects
  - Monitor Firestore read/write counts
  - Optimize if needed

- [ ] **8.3: Persistence Testing**

  - All users leave canvas
  - Return and verify shapes remain
  - Test page refresh mid-edit
  - Test browser close and reopen

- [ ] **8.4: Error Handling**

  - Files to update: All service files
  - Add try/catch blocks
  - Display user-friendly error messages
  - Handle network failures gracefully

- [ ] **8.5: UI Polish**

  - Files to update: All component files
  - Consistent spacing and colors
  - Responsive button states
  - Loading states for all async operations

- [ ] **8.6: Verify Keyboard Shortcuts**

  - Files to verify: `src/components/Canvas/Canvas.tsx`
  - Delete/Backspace key: delete selected shape (already implemented in PR #4)
  - Escape key: deselect (optional enhancement)
  - Note: Undo/redo is out of scope for MVP

- [ ] **8.7: Cross-Browser Testing**

  - Test in Chrome, Firefox, Safari
  - Fix any compatibility issues

- [ ] **8.8: Document Known Issues**
  - Files to update: `README.md`
  - List any known bugs or limitations
  - Add troubleshooting section

**PR Checklist:**

- [ ] All MVP requirements pass
- [ ] No console errors
- [ ] Smooth performance on test devices
- [ ] Works in multiple browsers
- [ ] Error messages are helpful

---

## PR #9: Deployment & Final Prep

**Branch:** `deploy/production`  
**Goal:** Deploy to production and finalize documentation

### Tasks:

- [ ] **9.1: Configure Firebase Hosting**

  - Files to create: `firebase.json`, `.firebaserc`
  - Run: `firebase init hosting`
  - Set public directory to `dist`

- [ ] **9.2: Update Environment Variables**

  - Create production Firebase project (or use same)
  - Files to update: `.env.example`
  - Document all required env vars

- [ ] **9.3: Build Production Bundle**

  - Run: `npm run build`
  - Test production build locally
  - Check bundle size

- [ ] **9.4: Deploy to Firebase Hosting**

  - Run: `firebase deploy --only hosting`
  - Test deployed URL
  - Verify all features work in production

- [ ] **9.5: Set Up Firestore Security Rules**

  - Files to create: `firestore.rules`
  - Allow authenticated users to read/write
  - Validate shape schema
  - Deploy rules: `firebase deploy --only firestore:rules`

- [ ] **9.6: Set Up Realtime Database Rules**

  - Files to create: `database.rules.json`
  - Allow authenticated users read/write
  - Deploy rules: `firebase deploy --only database`

- [ ] **9.7: Update README with Deployment Info**

  - Files to update: `README.md`
  - Add live demo link
  - Add deployment instructions
  - Add architecture diagram (optional)

- [ ] **9.8: Final Production Testing**

  - Test with 5 concurrent users on deployed URL
  - Verify auth works
  - Verify shapes sync
  - Verify cursors work
  - Verify presence works

- [ ] **9.9: Create Demo Video Script**
  - Outline key features to demonstrate
  - Prepare 2-3 browser windows for demo

**PR Checklist:**

- [ ] App deployed and accessible via public URL
- [ ] Auth works in production
- [ ] Real-time features work in production
- [ ] 5+ concurrent users tested successfully
- [ ] README has deployment link and instructions
- [ ] Security rules deployed and working

---

## MVP Completion Checklist

### Required Features:

- [ ] Basic canvas with pan/zoom (5000x5000px with boundaries)
- [ ] Rectangle shapes with gray fill (#cccccc)
- [ ] Ability to create rectangles via click-and-drag
- [ ] Ability to move and delete objects
- [ ] Object locking (first user to start dragging locks the object)
- [ ] Visual indicator showing who locked the object
- [ ] Real-time sync between 2+ users (<100ms)
- [ ] Multiplayer cursors with name labels and unique colors (canvas-relative coords)
- [ ] Presence awareness (who's online)
- [ ] User authentication (email/password AND Google login)
- [ ] TypeScript implementation
- [ ] Tests for all major features
- [ ] Deployed and publicly accessible

### Performance Targets:

- [ ] 60 FPS during all interactions
- [ ] Shape changes sync in <100ms
- [ ] Cursor positions sync in <50ms
- [ ] Support 500+ simple objects without FPS drops
- [ ] Support 5+ concurrent users without degradation

### Testing Scenarios:

- [ ] 2 users editing simultaneously in different browsers
- [ ] User A creates shape via click-and-drag → User B sees it immediately
- [ ] User A starts dragging shape → shape locks with User A's name visible
- [ ] User B sees lock indicator and cannot move locked shape
- [ ] Lock releases when User A stops dragging → User B can now move it
- [ ] User A deletes shape → disappears for User B immediately
- [ ] Cursors stay in correct position when panning/zooming canvas
- [ ] One user refreshing mid-edit confirms state persistence
- [ ] Multiple shapes created and moved rapidly to test sync performance
- [ ] Test with 500+ rectangles to verify performance target
- [ ] All tests pass (`npm test`)

---

## Post-MVP: Phase 2 Preparation

**Next PRs (After MVP Deadline):**

- PR #10: Multiple shape types (circles, text)
- PR #11: Shape styling (colors, borders)
- PR #12: Resize and rotate functionality
- PR #13: AI agent integration
- PR #14: Multi-select and grouping
- PR #15: Undo/redo system
