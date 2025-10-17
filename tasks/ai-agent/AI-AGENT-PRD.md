# AI Canvas Agent - Product Requirements Document

## Overview
An AI agent that manipulates the collaborative canvas through natural language using OpenAI function calling. Users can type commands like "Create a blue rectangle in the center" and the AI executes canvas operations in real-time, visible to all users.

## Goals
- Enable natural language canvas manipulation
- Support creation, movement, and querying of shapes
- Maintain real-time sync across all users
- Provide intelligent position parsing (center, coordinates, relative)
- Show AI activity to other users without cluttering chat

## User Experience

### AI Panel
- **Location**: Left side of screen
- **Width**: 380px
- **Height**: Full viewport height
- **Default State**: Collapsed (button visible)
- **Activation**: 
  - Click AI panel button
  - Press `/` keyboard shortcut anywhere on canvas
- **Chat Interface**:
  - User messages (right-aligned)
  - AI responses (left-aligned)
  - Show last 10 messages
  - Clear history button
  - Auto-scroll to latest message

### Dual View System
**User View** (Default):
- Shows only AI's final success message
- Example: "✓ Created 3 rectangles at center"
- Clean, non-technical

**Debug View** (Toggle):
- Shows AI's internal reasoning
- Tool calls with parameters
- Execution steps
- Useful for developers/power users
- Toggle button: "👁️ Show Debug"

### AI Button Integration
- **Location**: Properties Panel (when shape selected)
- **Icon**: ✨ or 🤖 symbol
- **Action**: Opens AI panel with context
- **Pre-filled**: "Move [Shape Name] to..."

### Slash Command
- Press `/` anywhere on canvas (except during text editing)
- Opens AI panel + focuses input field
- User can immediately start typing command

### Activity Notifications
- **Toast Notifications** in bottom-right corner
- **Duration**: 4 seconds
- **Dismiss**: X button or auto-dismiss
- **Content**: "🤖 [UserName] used AI: [Action Summary]"
- **Example**: "🤖 Johnny used AI: Created 3 rectangles"
- **Click Action**: None for MVP (could highlight shapes later)

## Technical Architecture

### OpenAI Integration
- **Model**: GPT-4o Mini (fast, cost-effective)
- **API Key**: Client-side via `VITE_OPENAI_API_KEY`
- **Method**: Function calling (tools)
- **Temperature**: 0.3 (deterministic but flexible)

### Tool Schema

#### 1. createShape
```typescript
{
  name: "createShape",
  description: "Create a new shape on the canvas",
  parameters: {
    type: "rectangle" | "circle" | "text" | "line",
    position: {
      // Option 1: Named position
      preset?: "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right" | "top-center" | "bottom-center",
      // Option 2: Exact coordinates
      x?: number,
      y?: number,
      // Option 3: Relative to another shape
      relativeTo?: string, // shape name
      offset?: number, // default 50px
      direction?: "right" | "left" | "top" | "bottom" // default "right"
    },
    size?: {
      width?: number, // default 100
      height?: number // default 100
    },
    color?: string, // hex code or color name
    text?: string, // for text shapes only
    fontSize?: number // for text shapes, default 16
  }
}
```

#### 2. moveShape
```typescript
{
  name: "moveShape",
  description: "Move an existing shape to a new position",
  parameters: {
    shapeName: string, // e.g. "Rectangle 1" or "AI Rectangle 1"
    position: {
      // Same position options as createShape
      preset?: string,
      x?: number,
      y?: number,
      relativeTo?: string,
      offset?: number,
      direction?: string
    }
  }
}
```

#### 3. getCanvasState
```typescript
{
  name: "getCanvasState",
  description: "Query current canvas state and existing shapes",
  parameters: {
    filter?: "all" | "rectangles" | "circles" | "text" | "lines"
  },
  returns: {
    canvasBounds: { width: 5000, height: 5000 },
    shapes: [
      {
        name: "Rectangle 1",
        type: "rectangle",
        position: { x: 100, y: 200 },
        size: { width: 150, height: 100 },
        color: "#CCCCCC",
        lockedBy: "user123" | null
      }
    ]
  }
}
```

### Position Parsing Logic

#### Preset Positions (relative to canvas bounds)
```typescript
const CANVAS_WIDTH = 5000;  // Constant, configurable
const CANVAS_HEIGHT = 5000; // Constant, configurable

const PRESET_POSITIONS = {
  "center": { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
  "top-left": { x: 100, y: 100 },
  "top-right": { x: CANVAS_WIDTH - 100, y: 100 },
  "top-center": { x: CANVAS_WIDTH / 2, y: 100 },
  "bottom-left": { x: 100, y: CANVAS_HEIGHT - 100 },
  "bottom-right": { x: CANVAS_WIDTH - 100, y: CANVAS_HEIGHT - 100 },
  "bottom-center": { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 100 }
};
```

#### Relative Positioning
- "Near Rectangle 1" → Find Rectangle 1, offset by 50px to the right
- "Below Circle 1" → Find Circle 1, offset by 50px downward
- User can specify: "100px to the right of Rectangle 1"
- If target shape not found, AI should notify user and continue with other operations

#### Coordinate Clamping
- All positions must stay within canvas bounds (0-5000, 0-5000)
- Auto-clamp if AI generates out-of-bounds coordinates
- Center shapes on edges (consider shape dimensions)

### Naming Convention
- **AI-Created Shapes**: Prefix with "AI"
  - "AI Rectangle 1", "AI Rectangle 2", ...
  - "AI Circle 1", "AI Circle 2", ...
  - Uses existing shape counter system
- **Easy Identification**: Users know which shapes were AI-generated
- **Same Behavior**: AI shapes are regular shapes (movable, deletable, syncable)

### Color Parsing
AI should intelligently parse color requests:

**Common Color Names** (AI knows these):
- red → #EF4444
- blue → #3B82F6
- green → #10B981
- yellow → #FBBF24
- purple → #A855F7
- orange → #F97316
- pink → #EC4899
- gray/grey → #6B7280

**Default Color**: #94A3B8 (slate-400)

AI can also generate specific hex codes for unusual requests.

### Execution Strategy

#### Sequential vs Instant
AI decides based on complexity:
- **1-3 shapes**: Instant (all at once)
- **4-10 shapes**: Sequential with 100ms delay
- **11+ shapes**: Sequential with 50ms delay (very fast)

#### Multi-Step Commands
Example: "Create a login form"
```
AI Planning:
1. getCanvasState() → check available space
2. createShape(text, "Username", top-center)
3. createShape(rectangle, input field below text)
4. createShape(text, "Password", below previous)
5. createShape(rectangle, input field)
6. createShape(rectangle, "Submit" button)

Execution: Sequential with visual feedback
```

### Rate Limiting & Security

#### Client-Side Rate Limits
- **10 commands per minute** (1 every 6 seconds)
- **20 shapes maximum** per single command
- **Cooldown Display**: "⏱️ Wait 3s before next command"
- **Bypass for Debug**: No limit in development mode

#### API Key Security
⚠️ **MVP Limitation**: Client-side API key
- Exposed in browser (acceptable for demo/learning)
- Monitor OpenAI usage dashboard
- Future: Move to Firebase Functions backend

#### Storage
```typescript
localStorage.setItem('lastAIRequest', Date.now());
localStorage.setItem('aiRequestCount', count);
```

### Error Handling

#### Shape Not Found
```
User: "Move Rectangle 99 to center"
AI Response: "⚠️ I couldn't find 'Rectangle 99' on the canvas. 
             Current shapes: Rectangle 1, Circle 1, AI Rectangle 1"
Action: Continue with other operations if multiple commands
```

#### Out of Bounds
```
AI tries to create at x: 10000
Action: Auto-clamp to x: 5000, notify in debug view
User sees: "✓ Created rectangle at canvas edge"
```

#### Rate Limit Hit
```
User: Tries 11th command in a minute
Action: Show cooldown timer, queue request
Message: "⏱️ Slow down! Wait 5 seconds..."
```

#### Canvas Locked Shapes
```
AI tries to move a shape locked by another user
Action: Skip that shape, notify user
Message: "⚠️ Couldn't move Rectangle 1 (locked by Sarah)"
```

### Real-Time Sync

#### All Users See AI Changes
- AI operations use existing `CanvasContext` methods
- Changes sync via Firestore immediately
- Other users see shapes appear in real-time
- Object locking rules apply (AI respects locks)

#### Activity Broadcasting
Optional (Phase 2):
```typescript
// New Firestore collection
interface AIActivity {
  userId: string;
  userName: string;
  command: string; // User's natural language command
  summary: string; // "Created 3 rectangles"
  timestamp: number;
  shapeIds: string[]; // Created/modified shapes
}
```

Toast shows to all users when anyone uses AI.

### Loading States

#### AI Thinking
- Show spinner in chat
- Message: "✨ AI is thinking..."
- Disable input field temporarily
- Typical duration: 1-3 seconds

#### Executing Commands
- Show progress for sequential operations
- "Creating shape 2 of 5..."
- Keep panel responsive

### Success Feedback

#### User View
```
✓ Created 3 rectangles at center
✓ Moved Rectangle 1 to top-left
✓ Found 15 shapes on canvas
```

#### Debug View
```
[Tool Call] getCanvasState()
→ Found 12 shapes, center is clear

[Tool Call] createShape(rectangle, x:2500, y:2500, color:#EF4444)
→ Created AI Rectangle 1

[Tool Call] createShape(rectangle, x:2500, y:2600, color:#EF4444)
→ Created AI Rectangle 2

[Complete] Successfully created 3 rectangles
```

## Component Architecture

```
components/
└── AI/
    ├── AIPanel.tsx              # Main panel container
    ├── AIChatView.tsx           # User-friendly chat view
    ├── AIDebugView.tsx          # Debug/developer view
    ├── AIInput.tsx              # Message input field
    ├── AIMessage.tsx            # Single message component
    ├── AIButton.tsx             # Trigger button in properties panel
    └── AILoadingIndicator.tsx   # Thinking/loading state

services/
└── ai/
    ├── openai.ts                # OpenAI SDK integration
    ├── toolExecutor.ts          # Execute tool calls on canvas
    ├── positionParser.ts        # Parse position parameters
    └── rateLimiter.ts           # Rate limiting logic

contexts/
└── AIContext.tsx                # AI state management (optional)

utils/
└── constants.ts                 # Add CANVAS_WIDTH, CANVAS_HEIGHT
```

## Data Flow

```
User types command in AI Panel
         ↓
Send to OpenAI API (with tools schema + canvas context)
         ↓
OpenAI returns tool calls (function calling)
         ↓
Tool Executor validates & executes
         ↓
Calls CanvasContext methods (addShape, updateShape, etc)
         ↓
Firestore sync → All users see changes
         ↓
Show success message + activity notification
```

## Success Criteria

### Functional Requirements
- ✅ User can open AI panel with `/` command
- ✅ AI understands natural language commands
- ✅ Creates shapes at correct positions (named, coordinates, relative)
- ✅ Moves shapes accurately
- ✅ Queries canvas state and responds intelligently
- ✅ All users see AI-created shapes in real-time
- ✅ AI-created shapes prefixed with "AI"
- ✅ Rate limiting works (10 commands/min)
- ✅ Error messages are helpful
- ✅ Debug view shows tool calls

### Performance Requirements
- ⚡ OpenAI response < 3 seconds
- ⚡ Shape creation appears immediately after response
- ⚡ No FPS drops during sequential creation
- ⚡ Toast notifications don't block UI

### User Experience Requirements
- 🎨 Panel is visually consistent with existing UI
- 🎨 Loading states are clear
- 🎨 Success/error feedback is immediate
- 🎨 Debug view helps understand AI behavior

## Future Enhancements (Out of Scope for MVP)

### Phase 2
- Delete shapes command
- Update shape properties (color, size, rotation)
- Select multiple shapes command
- Arrange shapes in layouts (grid, row, column)
- Smart overlap detection and auto-adjustment

### Phase 3
- Complex templates (login form, nav bar, card layout)
- Undo AI actions
- Save AI command history
- AI suggests improvements to canvas
- Voice commands

### Phase 4
- Backend API key management (Firebase Functions)
- User-specific AI contexts and preferences
- AI learns from user's canvas style
- Collaborative AI (multiple users can contribute to same AI task)

## Technical Constraints

### OpenAI Limits
- Rate limits depend on API tier
- Token limits: ~8k tokens for context (plenty for canvas state)
- Cost: ~$0.0001 per request (gpt-4o-mini)

### Firebase Limits
- Existing Firestore/RTDB limits apply
- AI operations count toward write quotas
- No additional Firebase changes needed

### Browser Support
- Same as existing app (desktop-focused)
- localStorage for rate limiting
- No mobile optimization needed

## Security Considerations

### Current Implementation
⚠️ Client-side API key (acceptable for MVP/learning)
- Users can extract key from browser
- Potential for abuse/cost overruns
- Monitor usage closely

### Mitigation Strategies
1. Client-side rate limiting
2. Max shapes per command limit
3. Monitor OpenAI dashboard for unusual activity
4. Set spending alerts on OpenAI account
5. Rotate keys if abuse detected

### Future: Backend Implementation
- Firebase Functions proxy for OpenAI calls
- Server-side rate limiting per user
- Secure API key storage
- Usage tracking and quotas

## Testing Strategy

### Manual Testing
- [ ] Test all position types (center, coordinates, relative)
- [ ] Test with 1, 5, 10, 20 shapes
- [ ] Test error cases (shape not found, out of bounds)
- [ ] Test rate limiting
- [ ] Test multi-user scenarios (2+ users using AI simultaneously)
- [ ] Test slash command activation
- [ ] Test debug view toggle

### Edge Cases
- Empty canvas
- Crowded canvas (500+ shapes)
- Very long commands
- Ambiguous commands
- Locked shapes
- User disconnects mid-execution

## Documentation

### User Guide
- How to open AI panel
- Example commands
- Position syntax explanation
- Troubleshooting common errors

### Developer Guide
- Tool schema reference
- Adding new commands
- Debugging AI behavior
- Customizing position presets

---

**Version**: 1.0  
**Status**: Ready for Implementation  
**Priority**: High (Gauntlet requirement)

