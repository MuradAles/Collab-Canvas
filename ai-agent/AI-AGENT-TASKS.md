# AI Canvas Agent - Implementation Tasks

## Overview
Implementation checklist for building the AI Canvas Agent feature using OpenAI function calling.

---

## Phase 1: Foundation & Setup

### Task 1: Environment & Dependencies Setup
**Estimated Time**: 15 minutes

- [ ] Install OpenAI SDK: `npm install openai`
- [ ] Add `VITE_OPENAI_API_KEY` to environment variables
- [ ] Create `src/services/ai/` directory structure
- [ ] Add canvas bounds constants to `utils/constants.ts`
  - `export const CANVAS_WIDTH = 5000`
  - `export const CANVAS_HEIGHT = 5000`
  - Update any hardcoded 5000 values to use these constants

**Files to Create/Modify:**
- `package.json` (add dependency)
- `.env` (add API key)
- `src/services/ai/` (new directory)
- `src/utils/constants.ts` (add constants)

**Acceptance Criteria:**
- ✅ OpenAI SDK installed and importable
- ✅ API key accessible via `import.meta.env.VITE_OPENAI_API_KEY`
- ✅ Canvas bounds are centralized constants

---

### Task 2: OpenAI Service Integration
**Estimated Time**: 30 minutes

Create the core OpenAI service that handles API communication and function calling.

- [ ] Create `src/services/ai/openai.ts`
- [ ] Initialize OpenAI client with API key
- [ ] Define tool schema for 3 commands:
  - `createShape`
  - `moveShape`
  - `getCanvasState`
- [ ] Implement `sendAICommand(message: string, context: CanvasState)` function
- [ ] Handle OpenAI responses and tool calls
- [ ] Error handling for API failures
- [ ] Type definitions for tool parameters

**Key Functions:**
```typescript
export async function sendAICommand(
  userMessage: string,
  canvasContext: { shapes: Shape[] }
): Promise<AIResponse>

interface AIResponse {
  message: string;        // AI's response to user
  toolCalls: ToolCall[];  // Functions to execute
  debugInfo?: string;     // For debug view
}
```

**Acceptance Criteria:**
- ✅ Can send message to OpenAI and get response
- ✅ Tool calls are properly parsed
- ✅ Handles errors gracefully

---

### Task 3: Position Parser Utility
**Estimated Time**: 45 minutes

Create utility to parse position parameters (presets, coordinates, relative).

- [ ] Create `src/services/ai/positionParser.ts`
- [ ] Implement preset position mapping (center, top-left, etc)
- [ ] Implement relative positioning logic (near, below, right of)
- [ ] Implement coordinate clamping to canvas bounds
- [ ] Handle "near X" with default 50px offset
- [ ] Support custom offsets ("100px to the right of")
- [ ] Error handling for invalid positions

**Key Functions:**
```typescript
export function parsePosition(
  positionParam: PositionParameter,
  shapes: Shape[]
): { x: number; y: number } | null

export function findShapeByName(
  shapeName: string,
  shapes: Shape[]
): Shape | null

export function calculateRelativePosition(
  targetShape: Shape,
  direction: 'right' | 'left' | 'top' | 'bottom',
  offset: number
): { x: number; y: number }

export function clampToCanvas(
  x: number,
  y: number,
  shapeWidth?: number,
  shapeHeight?: number
): { x: number; y: number }
```

**Acceptance Criteria:**
- ✅ "center" returns 2500, 2500
- ✅ "near Rectangle 1" finds shape and offsets by 50px
- ✅ Coordinates clamp to 0-5000 range
- ✅ Returns null for invalid positions with error message

---

### Task 4: Tool Executor Service
**Estimated Time**: 1 hour

Create the service that executes AI tool calls on the canvas.

- [ ] Create `src/services/ai/toolExecutor.ts`
- [ ] Implement `executeCreateShape()` function
- [ ] Implement `executeMoveShape()` function
- [ ] Implement `executeGetCanvasState()` function
- [ ] Add AI prefix to shape names ("AI Rectangle 1")
- [ ] Handle sequential vs instant execution
- [ ] Color parsing (color names → hex codes)
- [ ] Default size handling (100x100)
- [ ] Error handling for each tool
- [ ] Return execution results for user feedback

**Key Functions:**
```typescript
export async function executeToolCalls(
  toolCalls: ToolCall[],
  canvasContext: CanvasContextType,
  currentUser: User
): Promise<ExecutionResult>

interface ExecutionResult {
  success: boolean;
  message: string;        // User-friendly message
  debugLog: string[];     // Debug view logs
  createdShapeIds: string[]; // For activity tracking
  errors: string[];       // Any errors encountered
}
```

**Acceptance Criteria:**
- ✅ Can create shapes with correct AI naming
- ✅ Can move shapes by name
- ✅ Can query canvas state
- ✅ Respects object locks (skips locked shapes)
- ✅ Sequential execution with delays works
- ✅ Returns detailed results

---

## Phase 2: UI Components

### Task 5: AI Panel Component
**Estimated Time**: 1.5 hours

Create the main AI panel UI component.

- [ ] Create `src/components/AI/AIPanel.tsx`
- [ ] Left-side panel, 380px wide, full height
- [ ] Collapsible with smooth animation
- [ ] Message history display (last 10 messages)
- [ ] Separate user and AI message styling
- [ ] Auto-scroll to latest message
- [ ] Clear history button
- [ ] Debug view toggle ("👁️ Show Debug")
- [ ] Conditional rendering: Chat View vs Debug View
- [ ] Responsive to window resize

**Visual Design:**
- User messages: Right-aligned, blue background
- AI messages: Left-aligned, gray background
- Timestamps on hover
- Markdown support for AI responses (optional)

**Acceptance Criteria:**
- ✅ Panel opens/closes smoothly
- ✅ Messages display correctly
- ✅ Debug toggle works
- ✅ Scrolling works properly
- ✅ Matches existing UI style (Tailwind)

---

### Task 6: AI Input Component
**Estimated Time**: 45 minutes

Create the message input field with loading states.

- [ ] Create `src/components/AI/AIInput.tsx`
- [ ] Text input with submit button
- [ ] Enter key to send (Shift+Enter for new line)
- [ ] Loading state (disable input while AI thinking)
- [ ] Character counter (optional)
- [ ] Auto-focus when panel opens
- [ ] Clear input after sending
- [ ] Handle empty messages (don't send)

**Features:**
- Placeholder: "Ask AI to create or move shapes..."
- Loading indicator: Spinner + "AI is thinking..."
- Disabled state during execution

**Acceptance Criteria:**
- ✅ Can type and send messages
- ✅ Enter key works
- ✅ Loading state displays correctly
- ✅ Input clears after send

---

### Task 7: AI Message Components
**Estimated Time**: 30 minutes

Create message display components for chat and debug views.

- [ ] Create `src/components/AI/AIMessage.tsx`
- [ ] User message component (right-aligned)
- [ ] AI message component (left-aligned)
- [ ] Success/error message styling
- [ ] Timestamp display
- [ ] Copy message button (optional)

- [ ] Create `src/components/AI/AIDebugView.tsx`
- [ ] Show tool calls with parameters
- [ ] Show execution steps
- [ ] Color-coded logs (info, success, error)
- [ ] Collapsible tool call details
- [ ] JSON viewer for complex data

**Acceptance Criteria:**
- ✅ Messages render with correct styling
- ✅ Debug view shows technical details
- ✅ Timestamps are readable
- ✅ Success/error states are clear

---

### Task 8: Slash Command Handler
**Estimated Time**: 30 minutes

Implement the "/" keyboard shortcut to open AI panel.

- [ ] Add global keyboard listener in `App.tsx` or `Canvas.tsx`
- [ ] Detect "/" key press
- [ ] Ignore if user is editing text (text input active)
- [ ] Open AI panel and focus input field
- [ ] Prevent "/" from being typed in input
- [ ] Cleanup listener on unmount

**Implementation:**
```typescript
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === '/' && !isTextEditing) {
      e.preventDefault();
      openAIPanel();
      focusAIInput();
    }
  };
  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [isTextEditing]);
```

**Acceptance Criteria:**
- ✅ "/" opens AI panel
- ✅ Input field is focused
- ✅ Doesn't interfere with text editing
- ✅ Works from anywhere on canvas

---

### Task 9: AI Button in Properties Panel
**Estimated Time**: 20 minutes

Add AI button to Properties Panel when shape is selected.

- [ ] Add button to `src/components/Canvas/PropertiesPanel.tsx`
- [ ] Icon: ✨ or 🤖
- [ ] Label: "Ask AI" or "AI Helper"
- [ ] Click opens AI panel
- [ ] Pre-fill input with context: "Move [Shape Name] to..."
- [ ] Only show when shape is selected

**Styling:**
- Match existing button styles
- Secondary/outline button style
- Tooltip: "Ask AI to help with this shape"

**Acceptance Criteria:**
- ✅ Button appears when shape selected
- ✅ Opens panel with pre-filled context
- ✅ Visually consistent with existing buttons

---

## Phase 3: Integration & Polish

### Task 10: Rate Limiter Service
**Estimated Time**: 30 minutes

Implement client-side rate limiting to prevent abuse.

- [ ] Create `src/services/ai/rateLimiter.ts`
- [ ] Track requests in localStorage
- [ ] 10 commands per minute limit
- [ ] Cooldown timer display
- [ ] 20 shapes per command limit
- [ ] Warning messages for approaching limits
- [ ] Reset counter after timeout

**Key Functions:**
```typescript
export function canMakeRequest(): { allowed: boolean; waitTime?: number }
export function recordRequest(): void
export function getRemainingRequests(): number
```

**Acceptance Criteria:**
- ✅ Blocks requests when limit hit
- ✅ Shows cooldown timer
- ✅ Resets after 1 minute
- ✅ Doesn't block in development mode

---

### Task 11: Activity Notifications (Toast)
**Estimated Time**: 45 minutes

Create toast notifications for AI activity.

- [ ] Create `src/components/AI/AIToast.tsx`
- [ ] Bottom-right corner positioning
- [ ] 4 second auto-dismiss
- [ ] Dismiss button (X)
- [ ] Slide-in animation
- [ ] Queue multiple toasts
- [ ] Icon: 🤖
- [ ] Format: "[UserName] used AI: [Summary]"

**Use existing notification system if available, or create new:**
```typescript
export function showAIActivityToast(
  userName: string,
  summary: string
): void
```

**Acceptance Criteria:**
- ✅ Toasts appear in corner
- ✅ Auto-dismiss after 4s
- ✅ Can manually dismiss
- ✅ Multiple toasts stack properly
- ✅ Smooth animations

---

### Task 12: AI Context/State Management
**Estimated Time**: 45 minutes

Create context for AI panel state (optional but recommended).

- [ ] Create `src/contexts/AIContext.tsx` (optional)
- [ ] Manage panel open/closed state
- [ ] Message history
- [ ] Loading state
- [ ] Debug mode toggle
- [ ] Rate limit state
- [ ] Hook: `useAI()`

**Alternative:** Use local state in AIPanel component if context feels like overkill.

**Acceptance Criteria:**
- ✅ State persists across re-renders
- ✅ Multiple components can access AI state
- ✅ Loading states work correctly

---

### Task 13: Integration with CanvasContext
**Estimated Time**: 30 minutes

Connect AI tool executor with existing canvas operations.

- [ ] Import `useCanvas()` in tool executor
- [ ] Use `addShape()` for creating shapes
- [ ] Use `updateShape()` for moving shapes
- [ ] Pass canvas state to `getCanvasState()`
- [ ] Respect object locking
- [ ] Handle errors from canvas operations
- [ ] Test real-time sync with multiple users

**Key Integration Points:**
```typescript
const { shapes, addShape, updateShape, selectShape } = useCanvas();

// In tool executor
await canvasContext.addShape({
  type: 'rectangle',
  x: 2500,
  y: 2500,
  // ... other properties
});
```

**Acceptance Criteria:**
- ✅ AI-created shapes appear on canvas
- ✅ Other users see shapes in real-time
- ✅ Object locking is respected
- ✅ Shape naming works correctly

---

## Phase 4: Testing & Refinement

### Task 14: Manual Testing Checklist
**Estimated Time**: 1 hour

Comprehensive testing of all AI features.

**Basic Commands:**
- [ ] "Create a red rectangle at center"
- [ ] "Create a blue circle at 100, 200"
- [ ] "Move Rectangle 1 to top-left"
- [ ] "What shapes are on the canvas?"

**Position Variants:**
- [ ] "Create a rectangle at center"
- [ ] "Create a circle at top-left"
- [ ] "Create a shape near Rectangle 1"
- [ ] "Create a circle 100px below Rectangle 1"

**Multi-Shape Commands:**
- [ ] "Create 3 red rectangles at center"
- [ ] "Create 10 circles in a row"
- [ ] Sequential animation works

**Error Handling:**
- [ ] "Move Rectangle 99 to center" (shape not found)
- [ ] Create shape at 10000, 10000 (out of bounds)
- [ ] Try 11 commands in 1 minute (rate limit)
- [ ] Move locked shape (locked by another user)

**UI/UX Testing:**
- [ ] Slash command opens panel
- [ ] AI button in properties panel works
- [ ] Debug view toggle works
- [ ] Chat history scrolls correctly
- [ ] Loading states display
- [ ] Toasts appear and dismiss

**Multi-User Testing:**
- [ ] Open 2 browser windows
- [ ] User A creates shape with AI
- [ ] User B sees shape appear
- [ ] Toast notification appears for User B
- [ ] Both can use AI simultaneously

**Acceptance Criteria:**
- ✅ All test cases pass
- ✅ No console errors
- ✅ Performance is smooth (60 FPS)
- ✅ Real-time sync works

---

### Task 15: Error Handling & Edge Cases
**Estimated Time**: 45 minutes

Improve error handling and edge case behavior.

- [ ] Graceful handling of OpenAI API errors
- [ ] Network timeout handling
- [ ] Invalid tool parameters handling
- [ ] Empty canvas handling
- [ ] Crowded canvas handling (500+ shapes)
- [ ] Very long user messages
- [ ] Ambiguous commands handling
- [ ] Shape name conflicts
- [ ] User disconnects mid-execution

**Error Messages:**
- User-friendly in chat view
- Technical details in debug view
- Actionable suggestions when possible

**Acceptance Criteria:**
- ✅ No unhandled errors crash the app
- ✅ Error messages are helpful
- ✅ AI can recover from errors
- ✅ Edge cases don't break functionality

---

### Task 16: Performance Optimization
**Estimated Time**: 30 minutes

Ensure AI features don't impact canvas performance.

- [ ] Debounce rapid AI requests
- [ ] Memoize position calculations
- [ ] Optimize re-renders in AI panel
- [ ] Lazy load AI panel component
- [ ] Test with 500+ shapes on canvas
- [ ] Test sequential creation of 20 shapes
- [ ] Monitor FPS during AI operations
- [ ] Profile memory usage

**Tools:**
- React DevTools Profiler
- Chrome Performance tab
- FPS counter component (already exists)

**Acceptance Criteria:**
- ✅ Canvas maintains 60 FPS during AI operations
- ✅ No memory leaks from AI panel
- ✅ Panel animations are smooth
- ✅ No lag when typing in AI input

---

### Task 17: Documentation & Polish
**Estimated Time**: 30 minutes

Add documentation and final polish.

- [ ] Add JSDoc comments to all AI services
- [ ] Update main README with AI features
- [ ] Create user guide for AI commands
- [ ] Add tooltips to UI elements
- [ ] Improve error messages
- [ ] Add loading skeletons
- [ ] Accessibility improvements (ARIA labels)
- [ ] Keyboard navigation in AI panel

**Documentation Files:**
- `ai-agent/USER-GUIDE.md` (how to use AI)
- Update `README.md` (mention AI feature)
- Code comments for complex logic

**Acceptance Criteria:**
- ✅ All functions have JSDoc comments
- ✅ User guide is clear and helpful
- ✅ UI has proper ARIA labels
- ✅ Tooltips explain features

---

## Phase 5: Future Enhancements (Optional)

### Task 18: Additional Commands (Phase 2)
**Future Tasks:**
- [ ] `deleteShape` command
- [ ] `updateShapeProperties` command
- [ ] `selectShapes` command
- [ ] `arrangeShapes` (grid, row, column)
- [ ] `duplicateShape` command

### Task 19: Advanced Features (Phase 3)
**Future Tasks:**
- [ ] Complex templates (login form, navbar, card)
- [ ] Undo AI actions
- [ ] Save command history persistently
- [ ] AI suggests improvements
- [ ] Voice command input
- [ ] Multi-step workflow builder

### Task 20: Backend Migration (Phase 4)
**Future Tasks:**
- [ ] Firebase Functions for OpenAI proxy
- [ ] Server-side rate limiting
- [ ] Secure API key storage
- [ ] Usage tracking per user
- [ ] Admin dashboard for monitoring

---

## Summary

**Total Tasks**: 17 (MVP) + 3 (Future)  
**Estimated Time**: 12-15 hours total

**Priority Order:**
1. Foundation (Tasks 1-4): Core AI functionality
2. UI (Tasks 5-9): User interface
3. Integration (Tasks 10-13): Connect everything
4. Testing (Tasks 14-17): Ensure quality

**Dependencies:**
- Tasks 1-4 must be completed first (foundation)
- Tasks 5-9 can be done in parallel after foundation
- Tasks 10-13 integrate everything together
- Tasks 14-17 are final polish

**Risk Areas:**
- OpenAI API reliability (have fallback messages)
- Position parsing complexity (test extensively)
- Multi-user synchronization (use existing canvas sync)
- Rate limiting effectiveness (monitor closely)

---

**Status**: Ready to Start  
**Next Step**: Begin with Task 1 (Dependencies Setup)

