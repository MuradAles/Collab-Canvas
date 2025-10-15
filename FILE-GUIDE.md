# CollabCanvas - File Guide

Quick reference for all important files in the project.

---

## 📁 ENTRY POINTS

### `src/main.tsx`
- React app entry point
- Mounts App component to DOM

### `src/App.tsx`
- Wraps app in AuthProvider
- Shows Login if not authenticated
- Shows Canvas if authenticated

---

## 🧠 CONTEXTS (State Management)

### `src/contexts/AuthContext.tsx`
**Purpose**: Manages authentication state
**Provides**:
- `currentUser` - Current logged in user
- `login()` - Email/password login
- `signup()` - Create new account
- `loginWithGoogle()` - Google OAuth
- `logout()` - Sign out + cleanup

### `src/contexts/CanvasContext.tsx`
**Purpose**: Manages canvas state and coordinates Firebase data
**Provides**:
- `shapes` - All shapes (merged Firestore + RTDB)
- `selectedId` - Currently selected shape
- `onlineUsers` - List of online users with cursors
- `addShape()` - Create new shape
- `updateShape()` - Update shape properties
- `deleteShape()` - Remove shape
- `selectShape()` - Set selected shape
- `reorderShapes()` - Change z-index
**Subscribes to**:
- Firestore shapes (persistent)
- RTDB drag positions (ephemeral)
- RTDB user presence (ephemeral)

---

## 🔌 SERVICES (Firebase Communication)

### `src/services/firebase.ts`
**Purpose**: Initialize Firebase connection
**Exports**:
- `auth` - Firebase Authentication
- `db` - Firestore Database
- `rtdb` - Realtime Database

### `src/services/canvas.ts`
**Purpose**: Shape CRUD operations (uses Firestore)
**Functions**:
- `initializeCanvas()` - Create global canvas document
- `subscribeToShapes()` - Real-time shape listener
- `createShape()` - Add shape to Firestore
- `updateShape()` - Modify shape in Firestore
- `deleteShape()` - Remove shape
- `reorderShapes()` - Update shape order

### `src/services/dragSync.ts`
**Purpose**: Ultra-fast position sync during drag (uses RTDB)
**Functions**:
- `updateDragPosition()` - Send position update (no throttling)
- `clearDragPosition()` - Clear after drag ends
- `subscribeToDragPositions()` - Listen to all drag updates
**Why separate?**: RTDB is faster than Firestore for high-frequency updates

### `src/services/presence.ts`
**Purpose**: User presence + cursor tracking (uses RTDB)
**Functions**:
- `setUserOnline()` - Mark online + auto-offline on disconnect
- `setUserOffline()` - Manual offline
- `updateCursorPosition()` - Update cursor (no throttling)
- `subscribeToPresence()` - Listen to online users
- `generateUserColor()` - Assign color from userId

---

## 💪 HOOKS (Reusable Logic)

### `src/hooks/useCanvasPanZoom.ts`
**Purpose**: Handle pan and zoom viewport
**Returns**:
- `stageScale` - Current zoom level
- `stagePosition` - Current pan position
- `handleWheel()` - Zoom with mouse wheel
- `handlePanStart/Move/End()` - Ctrl+drag panning
- `handleZoomIn/Out()` - Button zoom controls

### `src/hooks/useShapeDrawing.ts`
**Purpose**: Create new shapes
**Returns**:
- `isDrawing` - Currently drawing?
- `newShapePreview` - Preview dimensions
- `handleDrawStart()` - Start creating shape
- `handleDrawMove()` - Update preview
- `handleDrawEnd()` - Finish and save shape
**Creates**: Rectangles (drag), Circles (drag), Text (click)

### `src/hooks/useShapeInteraction.ts`
**Purpose**: Handle drag, resize, rotate
**Returns**:
- `handleShapeDragStart()` - Start dragging
- `handleShapeDragMove()` - Update RTDB position
- `handleShapeDragEnd()` - Save to Firestore
- `handleShapeTransform()` - Real-time resize/rotate
- `handleShapeTransformEnd()` - Save final dimensions
**Also**: Updates cursor position during all interactions

### `src/hooks/useTextEditing.ts`
**Purpose**: Edit text on shapes
**Returns**:
- `editingTextId` - Which text being edited?
- `textAreaValue` - Current text content
- `handleTextDoubleClick()` - Start editing
- `startEditingNewText()` - Auto-edit newly created text
- `handleTextEditEnd()` - Save or delete if empty
- `getTextEditPosition()` - Calculate textarea overlay position

### `src/hooks/useAuth.ts`
**Purpose**: Convenience re-export
**Exports**: `useAuth` from AuthContext

---

## 🎨 COMPONENTS (UI Layer)

### `src/components/Canvas/Canvas.tsx`
**Purpose**: Main canvas component - orchestrates everything
**Uses hooks**:
- useCanvasPanZoom
- useShapeDrawing
- useShapeInteraction
- useTextEditing
**Key handlers**:
- `handleCursorTracking()` - Track mouse for cursor sync
- `handlePropertyUpdate()` - Update from properties panel
- Keyboard shortcuts (V/R/C/T, Delete, Escape)
**Renders**:
- Konva Stage + Layer
- All shapes (non-selected first, selected last)
- Multiplayer cursors
- Grid, controls, panels

### `src/components/Canvas/Shape.tsx`
**Purpose**: Render individual shape (Rect, Circle, or Text)
**Features**:
- Drag, resize, rotate with Transformer
- "Being dragged by X" indicators
- Visual feedback (opacity, stroke)
**Optimized**: React.memo to prevent re-renders

### `src/components/Canvas/CanvasControls.tsx`
**Purpose**: Zoom in/out/reset buttons

### `src/components/Canvas/ToolSelector.tsx`
**Purpose**: Select tool (Select, Rectangle, Circle, Text)

### `src/components/Canvas/PropertiesPanel.tsx`
**Purpose**: Edit selected shape properties (color, size, etc.)

### `src/components/Canvas/LayersPanel.tsx`
**Purpose**: List all shapes, reorder z-index

### `src/components/Canvas/GridToggle.tsx`
**Purpose**: Show/hide grid button

### `src/components/Canvas/Tutorial.tsx`
**Purpose**: Help modal with keyboard shortcuts

### `src/components/Collaboration/Cursor.tsx`
**Purpose**: Render other users' cursors with labels

### `src/components/Layout/Navbar.tsx`
**Purpose**: Top bar with online users + logout button

### `src/components/Auth/Login.tsx`
**Purpose**: Login form (email/password + Google)

### `src/components/Auth/Signup.tsx`
**Purpose**: Signup form (email/password)

---

## 🛠 UTILITIES

### `src/utils/helpers.ts`
**Functions**:
- `screenToCanvas()` - Convert screen coords to canvas coords
- `canvasToScreen()` - Reverse conversion
- `generateId()` - Unique shape IDs
- `normalizeRectangle()` - Handle negative drag
- `constrainRectangle()` - Keep shapes in bounds
- `generateUserColor()` - Assign user color
- `truncateDisplayName()` - Shorten names
- `throttle()` - Throttle function calls

### `src/utils/constants.ts`
**Defines**:
- Canvas dimensions (5000x5000)
- Zoom limits (0.1 to 3x)
- Shape defaults (colors, sizes)
- Cursor colors palette
- Global canvas ID

### `src/utils/gridRenderer.tsx`
**Purpose**: Render grid lines on canvas

### `src/types/index.ts`
**Purpose**: All TypeScript type definitions
**Defines**:
- Shape types (Rectangle, Circle, Text)
- User types
- Context types
- Utility types (Point, Bounds, etc.)

---

## 🗄 DATA FLOW SUMMARY

```
User Interaction
    ↓
Component (Canvas.tsx)
    ↓
Hook (useShapeInteraction, etc.)
    ↓
Service (canvas.ts, dragSync.ts, presence.ts)
    ↓
Firebase (Firestore + RTDB)
    ↓
Context subscribes to changes
    ↓
Component re-renders
```

---

## 🔑 KEY ARCHITECTURE DECISIONS

1. **Dual Database Strategy**:
   - Firestore = Permanent storage (shapes)
   - RTDB = Temporary fast data (drag positions, cursors)

2. **No Throttling**:
   - Cursor and drag updates send every frame
   - Fire-and-forget for speed

3. **Hook Composition**:
   - Each hook handles one concern
   - Canvas.tsx composes them all

4. **Service Layer**:
   - Only services talk to Firebase
   - Components never touch Firebase directly

