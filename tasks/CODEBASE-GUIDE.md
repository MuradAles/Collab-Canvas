# CollabCanvas - Quick File Reference

Simple guide: File path → What it does

---

## 📂 Main Structure

```
src/
├── main.tsx                 # App entry point
├── App.tsx                  # Main app + routing
├── index.css                # Global styles
├── components/              # UI components
├── contexts/                # State management
├── hooks/                   # Custom hooks
├── services/                # Firebase & AI
├── types/                   # TypeScript types
└── utils/                   # Utilities
```

---

## 🎨 Components

```
components/
├── AI/
│   ├── AICanvasIntegration.tsx    # Main AI integration: Handles command sending,
│   │                              # tool execution, conversation history, connects
│   │                              # OpenAI responses to canvas operations
│   │
│   ├── AIPanel.tsx                # AI chat sidebar: Chat UI, message history,
│   │                              # input field wrapper, scroll management
│   │
│   ├── AIInput.tsx                # AI input field: Text input with send button,
│   │                              # handles Enter key, clears after send
│   │
│   ├── AIMessage.tsx              # Chat message bubble: Displays user/AI messages,
│   │                              # different styling for each role
│   │
│   ├── AIToast.tsx                # AI notifications: Toast popups for AI activity,
│   │                              # success/error messages, auto-dismiss
│   │
│   └── AICommandsModal.tsx        # AI help modal: Shows available commands,
│                                  # examples, command categories
│
├── Auth/
│   ├── Login.tsx                  # Login form: Email/password + Google OAuth button,
│   │                              # form validation, error handling
│   │
│   └── Signup.tsx                 # Signup form: Email/password registration,
│                                  # form validation, redirects to canvas
│
├── Canvas/
│   ├── Canvas.tsx                 # **MAIN ORCHESTRATOR**: Manages Konva Stage,
│   │                              # handles mouse events (click/drag/wheel),
│   │                              # pan/zoom logic, tool switching, keyboard shortcuts,
│   │                              # box selection, shape creation, cursor tracking
│   │
│   ├── Shape.tsx                  # Shape wrapper: Routes to specific shape renderer,
│   │                              # handles selection state, applies transforms,
│   │                              # manages Transformer for resize/rotate
│   │
│   ├── ToolSelector.tsx           # Bottom toolbar: Tool buttons (select/rect/circle/
│   │                              # text/line), AI button, tutorial, zoom display,
│   │                              # keyboard shortcuts, active tool highlighting
│   │
│   ├── LayersPanel.tsx            # Left sidebar: Lists all shapes, drag-to-reorder
│   │                              # z-index, shows lock status, visibility toggle,
│   │                              # shape count, selected count
│   │
│   ├── PropertiesPanel.tsx        # Right sidebar: Shows properties for selected shape,
│   │                              # routes to shape-specific property panel,
│   │                              # handles shape updates
│   │
│   ├── CursorsLayer.tsx           # Multiplayer cursors: Renders all online users'
│   │                              # cursors, subscribes to cursor positions from
│   │                              # Realtime DB, applies canvas transformations
│   │
│   ├── TextEditingOverlay.tsx     # Text editing: Positioned textarea overlay for
│   │                              # editing text shapes, handles focus/blur,
│   │                              # real-time text updates
│   │
│   ├── ZIndexControls.tsx         # Layer controls: Floating buttons above selected
│   │                              # shape, bring to front/back, move up/down,
│   │                              # position follows shape
│   │
│   ├── FPSCounter.tsx             # Performance monitor: Calculates and displays FPS,
│   │                              # updates every frame, bottom-right corner
│   │
│   ├── Tutorial.tsx               # Help modal: Keyboard shortcuts reference,
│   │                              # grouped by category, slide-in animation
│   │
│   ├── GridToggle.tsx             # Grid toggle: Show/hide grid button,
│   │                              # bottom-left corner
│   │
│   ├── RecentColors.tsx           # Color picker: 2x6 grid of recent colors,
│   │                              # "Copy Color" button, edit colors, localStorage
│   │                              # persistence, default color palette
│   │
│   ├── ShapeDropdown.tsx          # Shape selector: Dropdown to switch shape type
│   │                              # for selected shape (rect → circle, etc.)
│   │
│   ├── ShapeIndicators.tsx        # Visual indicators: Selection highlights, lock
│   │                              # badges, user editing indicators
│   │
│   ├── shapes/                    # Shape renderers (Konva components)
│   │   ├── RectangleShape.tsx     # Renders Konva Rect: Applies position, size,
│   │   │                          # fill, stroke, corner radius, rotation
│   │   │
│   │   ├── CircleShape.tsx        # Renders Konva Circle: Applies position, radius,
│   │   │                          # fill, stroke
│   │   │
│   │   ├── TextShape.tsx          # Renders Konva Text: Applies position, content,
│   │   │                          # fontSize, fill, rotation
│   │   │
│   │   └── LineShape.tsx          # Renders Konva Line: Applies start/end points,
│   │                              # stroke, line cap style
│   │
│   └── properties/                # Property panels (edit shape attributes)
│       ├── RectangleProperties.tsx # Edit rectangle: Width, height, corner radius,
│       │                           # position, fill, stroke, rotation
│       │
│       ├── CircleProperties.tsx    # Edit circle: Radius, position, fill, stroke
│       │
│       ├── TextProperties.tsx      # Edit text: Content, fontSize, position, fill,
│       │                           # rotation
│       │
│       └── LineProperties.tsx      # Edit line: Start/end points, stroke color,
│                                   # stroke width, line cap (butt/round/square)
│
├── Layout/
│   ├── Navbar.tsx                 # Top navigation: Connection status indicator
│   │                              # (connected/disconnected/reconnecting), export
│   │                              # dropdown (PNG/SVG), settings button, online
│   │                              # users avatars, user menu with logout
│   │
│   └── SettingsPanel.tsx          # Theme settings: Light/dark mode toggle,
│                                  # 7 customizable colors with color pickers,
│                                  # live preview, reset to defaults, save to
│                                  # localStorage + Firebase
│
└── Collaboration/
    └── Cursor.tsx                 # Cursor component: Renders single user's cursor,
                                   # displays user name, applies user color,
                                   # SVG cursor icon
```

---

## 🎛️ Contexts (State Management)

```
contexts/
├── AuthContext.tsx           # Authentication state: Manages currentUser, login(),
│                             # logout(), signup(), onAuthStateChanged listener,
│                             # user display name logic, loading state
│
├── CanvasContext.tsx         # **MAIN CANVAS STATE**: Manages shapes array,
│                             # selectedIds, currentTool, loading state, CRUD
│                             # operations (addShape, updateShape, deleteShape),
│                             # Firestore sync, object locking, connection status
│
├── PresenceContext.tsx       # Multiplayer state: Manages onlineUsers array,
│                             # cursor positions, subscribes to Realtime DB
│                             # presence data, handles user join/leave
│
└── ThemeContext.tsx          # Theme state: Manages theme mode (light/dark),
                              # 7 customizable colors per theme, CSS variable
                              # updates, localStorage + Firebase persistence
```

---

## 🪝 Hooks

```
hooks/
├── useAuth.ts                # Auth helper: Wrapper hook for AuthContext,
│                             # returns currentUser, login, logout, signup
│
├── useCanvasPanZoom.ts       # Pan/zoom logic: Handles mouse wheel zoom,
│                             # Ctrl+drag to pan, zoom in/out/reset functions,
│                             # calculates canvas transformations
│
├── useShapeDrawing.ts        # Shape creation: Click-and-drag to create shapes,
│                             # calculates shape dimensions during drag,
│                             # creates shape on mouse up
│
├── useShapeHandlers.ts       # Shape event handlers: onDragStart (lock shape),
│                             # onDragEnd (unlock, update Firestore), onTransform
│                             # (resize/rotate), boundary constraints
│
├── useShapeInteraction.ts    # Shape interaction: Handles click events, selection,
│                             # hover states, right-click menus
│
├── useTextEditing.ts         # Text editing: Double-click to edit text, shows
│                             # textarea overlay, handles text changes, closes
│                             # on blur/Enter
│
├── useViewportCulling.ts     # Performance optimization: Calculates which shapes
│                             # are visible in viewport, only renders visible
│                             # shapes for 1000+ shape performance
│
├── useDebouncedValue.ts      # Debounce utility: Delays value updates, reduces
│                             # excessive re-renders or API calls
│
└── canvas-context/           # Canvas-specific hooks (extracted from CanvasContext)
    ├── useCanvasInitialization.ts  # Canvas setup: Subscribes to Firestore shapes,
    │                               # initializes loading state, handles real-time
    │                               # updates with onSnapshot
    │
    ├── useDragSync.ts              # Drag synchronization: Updates shape position
    │                               # during drag, syncs to Firestore, handles
    │                               # local optimistic updates
    │
    ├── useShapeLocking.ts          # Object locking: Lock shape on drag start,
    │                               # unlock on drag end, auto-release on timeout,
    │                               # prevents concurrent edits
    │
    ├── useShapeOperations.ts       # CRUD operations: addShape(), updateShape(),
    │                               # deleteShape(), duplicateShapes(), talks to
    │                               # Firestore via canvas service
    │
    ├── useShapeReordering.ts       # Z-index reordering: reorderShapes() to change
    │                               # array order, updates Firestore, manages
    │                               # bring to front/back logic
    │
    └── useShapeSelection.ts        # Selection logic: selectShape(), multi-select
                                    # with Shift, box selection, clear selection
```

---

## 🔧 Services

```
services/
├── firebase.ts               # Firebase initialization: Configures Firebase app,
│                             # Auth, Firestore, Realtime Database from env vars,
│                             # enables offline persistence
│
├── canvas.ts                 # Shape operations (Firestore): CRUD functions
│                             # (createShape, updateShape, deleteShape), locking
│                             # (lockShape, unlockShape), Firestore queries,
│                             # subscribes to /canvas/global-canvas-v1
│
├── presence.ts               # Cursors & presence (Realtime DB): Updates cursor
│                             # position, manages user presence (online/offline),
│                             # subscribes to /cursors/{userId}, onDisconnect
│                             # cleanup, ultra-fast updates (<50ms)
│
├── dragSync.ts               # Drag synchronization: Optimistic local updates
│                             # during drag, batches Firestore writes, handles
│                             # network delays
│
├── aiNotifications.ts        # AI activity broadcasting: Broadcasts AI command
│                             # execution to other users via Realtime DB,
│                             # /ai-activity node, toast notifications
│
└── ai/                       # AI services (OpenAI integration)
    ├── openai.ts             # **MAIN AI ENGINE**: Sends messages to GPT-4o Mini,
    │                         # function calling setup, system prompt with canvas
    │                         # context, conversation history (last 10 messages),
    │                         # viewport-aware positioning, tool schemas
    │
    ├── toolExecutor.ts       # Tool execution dispatcher: Receives tool calls from
    │                         # OpenAI, routes to individual tool functions,
    │                         # executes sequentially, handles errors, returns
    │                         # results to AI
    │
    ├── positionParser.ts     # Position calculation: Parses position parameters
    │                         # (preset like "center", exact x/y coords, relative
    │                         # to other shapes), calculates absolute positions,
    │                         # handles viewport anchoring
    │
    ├── rateLimiter.ts        # Rate limiting: Client-side limits (10 commands/min,
    │                         # 20 shapes/command), uses localStorage, calculates
    │                         # wait time, prevents API abuse
    │
    ├── tools/                # Individual AI command implementations
    │   ├── createShape.ts    # Create shapes: Creates rectangle/circle/text/line,
    │   │                     # parses position, applies defaults, adds to canvas
    │   │                     # via CanvasContext
    │   │
    │   ├── moveShape.ts      # Move shapes: Finds shape by name, calculates new
    │   │                     # position (preset/exact/relative), updates shape,
    │   │                     # supports batch moves
    │   │
    │   ├── deleteShape.ts    # Delete shapes: Finds shapes by name array, calls
    │   │                     # deleteShape for each, handles not found errors
    │   │
    │   ├── transformShape.ts # Resize/rotate: Changes width/height/radius for
    │   │                     # resize, applies rotation angle, updates Firestore
    │   │
    │   ├── styleShape.ts     # Change styles: Modifies stroke color/width,
    │   │                     # corner radius, line caps, doesn't change fill
    │   │                     # color (use changeShapeColor)
    │   │
    │   ├── alignShapes.ts    # Align shapes: Aligns multiple shapes along axis
    │   │                     # (left/right/center/top/bottom), calculates
    │   │                     # alignment positions, batch updates
    │   │
    │   ├── layerShape.ts     # Z-index management: Reorders shapes array for
    │   │                     # bring-to-front/send-to-back/move-up/move-down,
    │   │                     # calls reorderShapes
    │   │
    │   └── queryCanvas.ts    # Query canvas: Returns canvas state info (shape
    │                         # count, shape list, filtered by type), helps AI
    │                         # plan complex operations
    │
    ├── types/
    │   └── toolTypes.ts      # TypeScript interfaces: Tool parameter types,
    │                         # ToolResult interface, position types
    │
    └── utils/
        ├── colorParser.ts    # Color parsing: Converts color names ("red", "blue")
        │                     # to hex codes, handles hex input, default colors
        │
        └── messageGenerator.ts # AI response messages: Generates user-friendly
                                # success messages ("Created 3 shapes at center"),
                                # formats tool results for display
```

---

## 📦 Types & Utils

```
types/
└── index.ts                  # **ALL TYPESCRIPT TYPES**: Shape union type
                              # (BaseShape, Rectangle, Circle, Text, Line),
                              # ShapeType enum, Tool type, User type,
                              # SelectionRect, all interfaces

utils/
├── constants.ts              # Global constants: CANVAS_WIDTH (5000),
│                             # CANVAS_HEIGHT (5000), MIN_ZOOM (0.1),
│                             # MAX_ZOOM (3), LOCK_TIMEOUT (5000ms),
│                             # DEFAULT_SHAPE_FILL, cursor colors
│
├── helpers.ts                # Helper functions: screenToCanvas() coordinate
│                             # transformation, normalizeRectangle() for box
│                             # selection, rectanglesIntersect() collision
│                             # detection, generateShapeName() auto-naming
│
├── gridRenderer.tsx          # Grid rendering: Draws grid lines on canvas,
│                             # calculates grid spacing, renders with Konva Line
│
└── export.ts                 # PNG/SVG export: exportCanvasAsPNG() captures
                              # entire canvas, exportSelectedShapesAsPNG()
                              # exports selection, exportCanvasAsSVG() vector
                              # export, uses Konva toDataURL/toSVG
```

---

## 📚 Documentation

```
memory-bank/                  # AI development context (read by AI between sessions)
├── projectbrief.md           # Project foundation: Core requirements, goals,
│                             # success criteria, source of truth for scope
│
├── productContext.md         # Product vision: Why project exists, problems it
│                             # solves, user experience goals, target users
│
├── systemPatterns.md         # Architecture documentation: Design patterns used
│                             # (Context, Service Layer, Real-time Subscription),
│                             # data flow diagrams, error handling strategies
│
├── techContext.md            # Tech stack: Technologies used (React, Firebase,
│                             # Konva), development setup, dependencies explained
│
├── activeContext.md          # Current state: Recent changes, what's being worked
│                             # on now, next steps, active decisions
│
└── progress.md               # Progress tracking: What works, what's left to build,
                              # test coverage (78 tests), performance metrics,
                              # known issues, MVP checklist

ai-development/               # AI development logs (for rubric)
├── AI-DEVELOPMENT-SUMMARY.md # **MAIN LOG**: Complete AI development story, tools
│                             # used, prompting strategies (5 strategies), code
│                             # analysis (85% AI / 15% hand-written), strengths/
│                             # limitations, key learnings (7 insights)
│
├── AI-DEVELOPMENT-LOG.md     # Detailed chronological log: Day-by-day development
│                             # notes, debugging sessions, iterations
│
├── AI-DEVELOPMENT-LOG-2.md   # Additional development notes: Extended testing,
│                             # refinements, edge cases discovered
│
└── DEMO-SCRIPT.md            # Demo script: Step-by-step demo walkthrough for
                              # presentations, features to highlight

tasks/                        # Planning documents (PRDs and task lists)
├── ai-agent/
│   ├── AI-AGENT-PRD.md       # AI Canvas Agent PRD: Requirements, user experience,
│   │                         # commands, position parsing, rate limiting
│   │
│   └── AI-AGENT-TASKS.md     # AI task list: Broken down implementation tasks,
│                             # 7 parent tasks, 32 sub-tasks
│
├── PRD-COLLABORATION-FEATURES.md   # Future: Advanced collaboration features PRD
├── TASKS-ENDLESS-CANVAS.md         # Future: Endless canvas task breakdown
├── TASKS-GROUPING.md               # Future: Grouping system tasks
├── TASKS-PROJECTS-PAGES.md         # Future: Multi-project system tasks
└── tasks.md                        # General task tracking across all features
```

---

## ⚙️ Config Files

```
root/
├── README.md                 # **MAIN SETUP GUIDE**: Features list, tech stack,
│                             # step-by-step Firebase setup, environment variables,
│                             # running locally, testing, deployment, project
│                             # structure, troubleshooting (290+ lines)
│
├── package.json              # Dependencies & scripts: All npm packages with
│                             # versions, scripts (dev/build/test/lint), project
│                             # metadata
│
├── vite.config.ts            # Vite build config: Dev server settings, build
│                             # optimizations, plugin configuration, port 5173
│
├── tsconfig.json             # TypeScript config: Compiler options, strict mode,
│                             # path aliases, included/excluded files
│
├── eslint.config.js          # ESLint linting rules: Code quality rules, formatting
│                             # standards, React/TypeScript specific rules
│
├── firebase.json             # Firebase Hosting config: Public directory (dist),
│                             # SPA rewrites to index.html, links to security rules
│
├── firestore.rules           # Firestore security rules: Read/write permissions,
│                             # auth checks (must be logged in), /canvas/global-
│                             # canvas-v1 access rules
│
├── firestore.indexes.json    # Firestore indexes: Database indexes for efficient
│                             # queries (currently default config)
│
└── database.rules.json       # Realtime DB security: Rules for /cursors and
                              # /presence nodes, auth checks, read/write permissions
```

---

## 🎯 Quick Find

**Want to modify...**
- **Canvas behavior?** → `Canvas.tsx` or `CanvasContext.tsx`
- **A shape?** → `components/Canvas/shapes/`
- **Shape properties?** → `components/Canvas/properties/`
- **AI commands?** → `services/ai/tools/`
- **Theme/styling?** → `index.css` or `ThemeContext.tsx`
- **Authentication?** → `AuthContext.tsx`
- **Types?** → `types/index.ts`

**Most important files:**
1. `Canvas.tsx` - Canvas orchestrator (1443 lines)
2. `CanvasContext.tsx` - Main state management
3. `services/ai/openai.ts` - AI system (648 lines)
4. `types/index.ts` - All TypeScript types
