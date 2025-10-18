# CollabCanvas - System Patterns

## Architecture Overview

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │   Firebase      │    │   Firebase      │
│   (TypeScript)  │◄──►│   Firestore     │    │   Realtime DB   │
│                 │    │   (Shapes)      │    │   (Cursors)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Firebase      │
                    │   Auth          │
                    └─────────────────┘
```

### Component Hierarchy
```
App
├── AuthProvider
│   └── AppContent
│       ├── Login (if not authenticated)
│       └── CanvasProvider (if authenticated)
│           ├── Navbar
│           └── Canvas
│               ├── Shape (for each shape)
│               ├── Cursor (for each user)
│               └── CanvasControls
```

## Key Design Patterns

### 1. Theming Pattern with CSS Variables
**Implementation**: React Context + CSS Custom Properties
**Files**: `src/contexts/ThemeContext.tsx`, `src/index.css`, `src/components/Layout/SettingsPanel.tsx`

**Pattern**:
- ThemeContext manages theme state (mode + colors)
- CSS variables applied to document root
- Components use theme utility classes
- Persistence via localStorage + Firebase sync
- Real-time updates across all components

**7 Theme Colors**:
1. Primary - Main UI elements
2. Accent - Highlights and CTAs
3. Background - Page background
4. Surface - Cards, panels
5. Text - Primary text
6. Text Secondary - Muted text
7. Border - Borders and dividers

**Benefits**:
- Instant theme switching (no re-renders)
- Browser-native CSS variables (performant)
- User customization with color pickers
- Cross-device sync via Firebase
- Separate light/dark color schemes

### 2. AI Service Integration Pattern
**Implementation**: OpenAI function calling with tool executor
**Files**: `src/services/ai/openai.ts`, `src/services/ai/toolExecutor.ts`, `src/services/ai/positionParser.ts`

**Pattern**:
- Natural language → OpenAI API → Structured tool calls → Canvas operations
- Conversation history for context (last 10 messages)
- Rate limiting to prevent abuse (10 cmd/min, 20 shapes/cmd)
- Position parsing (preset/exact/relative)
- Retry logic for Firestore sync timing

**10 AI Tools**:
1. createShape - Create rectangles, circles, lines, text
2. moveShape - Move to positions, arrange in lines
3. deleteShape - Delete single/multiple shapes
4. resizeShape - Change width/height/radius
5. rotateShape - Rotate by angle
6. changeShapeColor - Change fill color
7. alignShapes - Align along axes
8. changeLayer - Control z-index
9. changeShapeStyle - Modify stroke, corners, line caps
10. getCanvasState - Query canvas information

**Benefits**:
- Natural language interface for complex operations
- Batch operations (multiple shapes at once)
- Contextual understanding ("move them all")
- User-friendly error messages

### 3. Context Pattern for State Management
**Implementation**: React Context + useReducer pattern
**Files**: `src/contexts/AuthContext.tsx`, `src/contexts/CanvasContext.tsx`, `src/contexts/ThemeContext.tsx`

**Pattern**:
- Centralized state management
- Provider wraps app components
- Custom hooks expose context values
- TypeScript interfaces for type safety

**Benefits**:
- Avoids prop drilling
- Centralized state logic
- Easy testing and debugging

### 4. Service Layer Pattern
**Implementation**: Separate service files for external dependencies
**Files**: `src/services/firebase.ts`, `src/services/canvas.ts`, `src/services/auth.ts`

**Pattern**:
- Encapsulate Firebase operations
- Abstract away external API details
- Consistent error handling
- Easy to mock for testing

**Benefits**:
- Separation of concerns
- Reusable across components
- Easy to swap implementations

### 5. Real-Time Subscription Pattern
**Implementation**: Firebase onSnapshot for Firestore, onValue for Realtime DB
**Files**: `src/contexts/CanvasContext.tsx`, `src/services/canvas.ts`

**Pattern**:
```typescript
useEffect(() => {
  const unsubscribe = subscribeToShapes((shapes) => {
    setShapes(shapes);
  });
  return unsubscribe; // Cleanup on unmount
}, []);
```

**Benefits**:
- Automatic real-time updates
- Handles reconnection
- Clean subscription management

### 6. Object Locking Pattern
**Implementation**: Lock on drag start, unlock on drag end
**Files**: `src/services/canvas.ts`, `src/components/Canvas/Shape.tsx`

**Pattern**:
1. User starts dragging → lock shape in Firestore
2. Other users see lock indicator
3. User stops dragging → unlock shape
4. Auto-release on disconnect/timeout

**Benefits**:
- Prevents edit conflicts
- Clear visual feedback
- Automatic cleanup

### 7. Coordinate Transformation Pattern
**Implementation**: Screen coordinates → Canvas coordinates
**Files**: `src/components/Canvas/Canvas.tsx`

**Pattern**:
```typescript
const getCanvasCoords = (screenX: number, screenY: number) => {
  const stage = stageRef.current;
  const scale = stage.scaleX();
  const pos = stage.getPointerPosition();
  return {
    x: (pos.x - stage.x()) / scale,
    y: (pos.y - stage.y()) / scale
  };
};
```

**Benefits**:
- Cursors stay in correct position when panning/zooming
- Consistent coordinate system
- Handles viewport transformations

## Data Flow Patterns

### 1. Theme Change Flow
```
User clicks theme toggle → ThemeContext updates mode
                                      ↓
                            CSS variables applied to :root
                                      ↓
                            Save to localStorage (instant)
                                      ↓
                            Save to Firebase (async)
                                      ↓
                            All components re-render with new colors
```

**Key Steps**:
1. User: Opens settings panel, clicks Light/Dark or changes colors
2. ThemeContext: Updates mode or colors state
3. useEffect: Applies CSS variables to document.documentElement
4. localStorage: Saves theme for instant reload
5. Firebase: Syncs theme to user's account for cross-device access
6. Components: Automatically use new theme colors via CSS variables

### 2. AI Command Flow
```
User types command → AI Panel → AI Integration → OpenAI API (GPT-4o Mini)
                                                        ↓
                                                   Tool calls (JSON)
                                                        ↓
                                            Tool Executor → Position Parser
                                                        ↓
                                                  Canvas Context
                                                        ↓
                                                    Firestore
                                                        ↓
                                          Real-time sync to all users
```

**Key Steps**:
1. User: "Create 5 blue circles in a row"
2. AI Integration: Add to conversation history, send to OpenAI
3. OpenAI: Parse intent → Return 5 `createShape` tool calls
4. Tool Executor: Execute each tool call sequentially
5. Position Parser: Calculate positions with spacing
6. Canvas Context: Create shapes via `addShape`
7. Firestore: Persist and sync to all users
8. AI Panel: Display success message with created shape names

### 3. Shape Creation Flow
```
User clicks/drags → Canvas component → CanvasContext → CanvasService → Firestore
                                                                    ↓
Other users ← CanvasContext ← Firestore subscription ← Real-time update
```

### 4. Real-Time Sync Flow
```
User A: Create shape → Firestore
User B: Firestore subscription → Update local state → Re-render
User C: Firestore subscription → Update local state → Re-render
```

### 5. Object Locking Flow
```
User A: Start drag → Lock shape in Firestore → Show lock indicator
User B: Try to drag → Check lock status → Show "locked by User A" message
User A: End drag → Unlock shape in Firestore → Remove lock indicator
```

## Error Handling Patterns

### 1. Service-Level Error Handling
**Pattern**: Try-catch with user-friendly error messages
```typescript
try {
  await createShape(shape);
} catch (error) {
  console.error('Failed to create shape:', error);
  throw new Error('Failed to create shape');
}
```

### 2. Component-Level Error Handling
**Pattern**: Error boundaries and graceful degradation
```typescript
if (error) {
  return <div>Something went wrong. Please try again.</div>;
}
```

### 3. Network Error Handling
**Pattern**: Firebase handles reconnection automatically
- Offline persistence enabled
- Automatic retry on reconnection
- Graceful degradation when offline

## Performance Patterns

### 1. React.memo for Expensive Components
**Files**: `src/components/Canvas/Shape.tsx`
```typescript
export default React.memo(Shape);
```

### 2. Throttling for High-Frequency Updates
**Pattern**: Cursor position updates throttled to 20-30 FPS
```typescript
const throttledUpdate = useCallback(
  throttle((x, y) => updateCursorPosition(x, y), 50),
  []
);
```

### 3. Canvas-Based Rendering
**Pattern**: Konva.js for high-performance 2D rendering
- 60 FPS with hundreds of objects
- Hardware acceleration
- Efficient redraws

## Testing Patterns

### 1. Service Testing
**Pattern**: Mock Firebase services, test business logic
```typescript
vi.mock('../services/firebase', () => ({
  createShape: vi.fn(),
  updateShape: vi.fn(),
}));
```

### 2. Context Testing
**Pattern**: Test context providers with custom render
```typescript
const renderWithContext = (component) => {
  return render(
    <CanvasProvider>
      {component}
    </CanvasProvider>
  );
};
```

### 3. Integration Testing
**Pattern**: Test complete user flows
- Authentication flow
- Shape creation and sync
- Multi-user scenarios

## Security Patterns

### 1. Authentication Guards
**Pattern**: Protect routes and operations
```typescript
if (!currentUser) {
  throw new Error('Must be logged in to create shapes');
}
```

### 2. Firestore Security Rules
**Pattern**: Server-side validation
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /canvas/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 3. Input Validation
**Pattern**: Validate data before sending to Firebase
```typescript
const validateShape = (shape: Shape) => {
  if (!shape.id || !shape.type) {
    throw new Error('Invalid shape data');
  }
};
```

## Deployment Patterns

### 1. Environment Configuration
**Pattern**: Environment variables for different stages
```typescript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  // ...
};
```

### 2. Build Optimization
**Pattern**: Vite for fast builds and HMR
- TypeScript compilation
- Tree shaking
- Code splitting

### 3. Firebase Hosting
**Pattern**: Static site deployment
- Automatic builds on push
- CDN distribution
- HTTPS by default
