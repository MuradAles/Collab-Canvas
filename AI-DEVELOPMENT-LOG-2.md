# AI Canvas Agent - Development Log

**Date**: October 2025  
**Feature**: Natural Language Canvas Manipulation with OpenAI GPT-4o Mini  
**Time**: ~8 hours (research to production)

---

## My Approach

I started by researching which AI SDK to use, then planned what tools I needed, created a PRD with AI help, and finally implemented everything. The key was starting with bare minimum tools first, then expanding based on what worked.

---

## The Build Process

### Phase 0: Research & SDK Selection (~30 minutes)
**What I did**: Asked AI which framework/SDK to use for canvas agent

**My Questions:**
```
Me: "Should I use LangChain, OpenAI, Agent SDK, or Vercel SDK for this?"

AI: [Explained pros/cons of each]

Me: [After some searching and thinking about answers]
Decision: Go with OpenAI Agent SDK
```

**Why OpenAI SDK:**
- Direct function calling support
- Simple integration
- No extra abstraction layers
- Good for MVP

---

### Phase 1: Tool Planning (~30 minutes)
**What I did**: Figured out which tools to build first

**My Thinking Process:**
```
Me: "How can I create canvas tools for AI?"

AI: [Explained tool structure and function calling]

Me: [Thinking] I need just bare minimum at first:
- createShape
- moveShape  
- resizeShape
- z-index control

I can add more complex tools later once basic ones work.
```

**Decision**: Start simple, expand later based on what works.

---

### Phase 2: PRD Creation & Refinement (~1 hour)
**What I did**: Worked with AI to create and improve PRD

**The Process:**
```
Me: [Pasted canvas app info and requirements to AI]

AI: [Created initial PRD]

Me: "How can I improve this?"

Issue 1: Too much UI complexity - not important for MVP
Issue 2: Position handling unclear - need to think about canvas bounds
Issue 3: Some features too complex for first version

Me: [Refined requirements, focused on essentials]
```

**Final PRD Result:**
- `AI-AGENT-PRD.md` - 500 lines focused on MVP
- Clear tool definitions
- Position parsing strategy (preset, exact, relative)
- Canvas bounds handling (5000x5000px)
- Rate limiting plan

**Then:**
```
Me: "Break this down into implementation tasks"

AI: [Created task checklist]
```

- `AI-AGENT-TASKS.md` - Step-by-step implementation guide

---

### Phase 3: One-Shot Implementation (~2 hours)
**What I did**: Gave Cursor the PRD and let it build

**The Prompt:**
```
Me: "@AI-AGENT-PRD.md @AI-AGENT-TASKS.md Read memory bank, read cursor rules 
and start building. Let's try one shot it."
```

**Result**: 
- 11 new files created (4 services, 5 UI components, 2 docs)
- Core infrastructure working
- Initial 3 tools: createShape, moveShape, getCanvasState
- AI could create and move shapes
- Rate limiting implemented
- Position parsing working

---

### Phase 4: Testing & Iteration (~3 hours)
**What I did**: Tested with real commands, discovered issues, fixed iteratively

This phase had 15+ iterations of finding bugs and fixing them. Here's what actually happened:

---

#### Issue 1: Shape Name Recognition ❌→✅

**What I tested:**
```
Me: "Create in order 10 squares but put them randomly through canvas with 
different colors, different radius"

AI: ✅ Created 10 rectangles (Rectangle 1, Rectangle 2, etc.)

Me: "I'm talking about the squares that we work on"

AI: ❌ "Could you please specify which two shapes you would like to align?"
```

**The Problem:**
- I said "squares" but AI created "rectangles"
- AI was looking for "AI Square 1" but the actual name was "Rectangle 1"
- The canvas auto-names shapes as "Rectangle 1", "Circle 1", etc.
- AI was adding "AI" prefix in its memory but not on actual canvas

**Debug Info I Saw:**
```
Tool Calls:
1. moveShape { "shapeName": "AI Square 1", "position": {...} }
2. moveShape { "shapeName": "AI Square 2", "position": {...} }

Result: ❌ Shapes not found
```

**How I Fixed It:**
1. Removed "AI" prefix from system prompt
2. Enhanced `buildCanvasContext()` to explicitly list all shape names by type
3. Added synonym understanding: "squares" = "rectangles" 
4. Modified tool executor to retrieve actual names from canvas after creation

**Files Modified:**
- `src/services/ai/openai.ts` - Updated system prompt, improved context building
- `src/services/ai/toolExecutor.ts` - Name retrieval after shape creation

---

#### Issue 2: Canvas Bounds Violation ❌→✅

**What I tested:**
```
Me: "Move all lines to the top of canvas"

AI: ✅ Moved lines
```

**The Problem:**
- Lines moved to y=0 (top)
- But line endpoints extended OUTSIDE the 5000x5000px canvas
- Only the line's center point was clamped, not both endpoints
- Example: Line center at (2500, 0), but if 500px long, y1 = -250 (outside!)

**Visual Issue:**
- On my screen: Line partially visible, half cut off at top edge
- On other users' screens: Same issue

**How I Fixed It:**
1. Updated `toolExecutor.ts` to clamp BOTH x1,y1 and x2,y2 for lines
2. For circles: Account for radius (center must be at least radius away from edge)
3. For rectangles: Center shapes at preset positions (offset by width/height / 2)

**Code Change:**
```typescript
// Before: Only clamped center point
x: Math.max(0, Math.min(CANVAS_WIDTH, x))

// After: Clamp both endpoints for lines
x1: Math.max(0, Math.min(CANVAS_WIDTH, x1))
x2: Math.max(0, Math.min(CANVAS_WIDTH, x2))

// For circles: Account for radius
x: Math.max(radius, Math.min(CANVAS_WIDTH - radius, x))
```

---

#### Issue 3: Position Centering Wrong ❌→✅

**What I tested:**
```
Me: "Move squares to each corner and move their text line, which they are 
related to"

AI: ✅ Moved rectangles to corners
     ❌ Text didn't follow correctly
```

**The Problem:**
- When moving Rectangle 1 to "top-left", it positioned at (50, 50)
- But that's the TOP-LEFT corner of the shape, not the visual center
- A 100x100 rectangle at (50,50) appears partially off-screen
- Text "below Rectangle 1" calculated position from wrong anchor point

**What Should Happen:**
- "top-left" preset should center the shape visually in that quadrant
- For 100x100 rectangle: x = 50 + (100/2) = 100, y = 50 + (100/2) = 100

**How I Fixed It:**
1. Modified `positionParser.ts` to offset by half shape dimensions
2. Changed default relative direction from 'right' to 'bottom' (more intuitive)
3. Updated `calculateRelativePosition()` to horizontally center when direction is 'bottom'

**Result:**
- Shapes now visually centered at preset positions
- Text labels correctly positioned relative to parent shapes

---

#### Issue 4: Conversation Memory Missing ❌→✅

**What I tested:**
```
Me: "Create 3 circles"
AI: ✅ Created Circle 1, Circle 2, Circle 3

Me: "Align them horizontally"
AI: ❌ "Could you please specify which shapes you want to align?"
```

**The Problem:**
- AI forgot I just created 3 circles
- Each command was independent - no context from previous messages
- OpenAI API call didn't include message history

**How I Fixed It:**
1. Added `ConversationHistory` interface in `AIPanel.tsx`
2. Stored last 10 user/AI messages in state
3. Modified `sendAICommand` to accept history parameter
4. Updated `openai.ts` to include history in API call

**Code Change:**
```typescript
// Before: Only current message
const messages = [
  { role: 'system', content: systemPrompt },
  { role: 'user', content: userMessage }
];

// After: Include conversation history
const messages = [
  { role: 'system', content: systemPrompt },
  ...conversationHistory.map(msg => ({
    role: msg.role,
    content: msg.content
  })),
  { role: 'user', content: userMessage }
];
```

**Result:**
- AI now remembers "them", "those circles", "the shapes we just created"

---

#### Issue 5: Firestore Sync Timing ❌→✅

**What I tested:**
```
Me: "Create 5 circles then move them"

AI: ❌ "Warning: Shapes not yet synced from Firestore"
     ❌ "Cannot find Circle 6, Circle 7"
```

**The Problem:**
- After `createShape()`, shapes saved to Firestore
- But Firestore sync is ASYNC - takes 100-500ms to propagate
- Tool executor immediately looked for shapes in local `canvasContext.shapes`
- Shapes not there yet → "Shape not found" error

**What I Tried:**
1. First attempt: Added 100ms delay → ❌ Still failed sometimes
2. Second attempt: Added 500ms delay → ✅ Worked but felt slow
3. Third attempt: Retry mechanism with increasing delays

**Final Solution:**
Implemented smart retry in `toolExecutor.ts`:
```typescript
// After all createShape calls, wait for Firestore sync
let retries = 0;
const maxRetries = 3;
const delays = [500, 800, 1100]; // Increasing delays

while (retries < maxRetries) {
  await new Promise(resolve => setTimeout(resolve, delays[retries]));
  
  // Check if shapes synced by finding highest zIndex
  const newShapes = canvasContext.shapes
    .filter(s => s.zIndex >= highestZIndexBefore)
    .sort((a, b) => b.zIndex - a.zIndex);
    
  if (newShapes.length === createdCount) {
    // All shapes synced!
    return newShapes.map(s => s.name);
  }
  
  retries++;
}
```

**Result:**
- Shapes reliably available after creation
- Success message shows actual shape names: "Created Circle 1, Circle 2, Circle 3"

---

#### Issue 6: Arrangement Spacing ❌→✅

**What I tested:**
```
Me: "Now let's arrange all squares in line and they should be in same rotation"

AI: ✅ Rotated to 90 degrees
     ❌ All shapes at same position (overlapping!)
```

**The Problem:**
- AI calculated positions but didn't account for shape sizes
- Formula: `x = startX + (i * spacing)` with fixed spacing=100
- But circles with radius=150 need spacing > 300 to not overlap!
- AI wasn't reading the actual radius/width values

**What I Told AI:**
```
Me: "For some reason when I'm saying like we need to search horizontally middle, 
actually I mean like in order, right? Currently they're just getting one 
position. They're not too far and they're just touching each other."
```

**How I Fixed It:**
1. Updated system prompt with explicit spacing calculation instructions
2. Added formula: `totalWidth = shapes.length * (averageSize + spacing)`
3. Clarified "horizontally middle" = horizontal line at y=2500
4. Clarified "vertically middle" = vertical line at x=2500

**System Prompt Addition:**
```
When arranging shapes in a line:
1. Get actual dimensions (radius for circles, width for rectangles)
2. Calculate spacing = largestDimension + 50px buffer
3. Calculate positions to fit within canvas
4. Distribute evenly with proper spacing
```

---

#### Issue 7: "Together" vs "In a Line" ❌→✅

**What I tested:**
```
Me: "middle of canvas put all circles together"

AI: ❌ Arranged in a horizontal line with spacing
```

**What I Expected:**
- "Together" = stack at same position (overlapping)
- Not arranged in a line with spacing

**The Problem:**
- "Together" and "arrange in a line" both triggered same logic
- Natural language ambiguity
- AI needed explicit definitions

**How I Fixed It:**
Added "Understanding user intent" section to system prompt:

```
"Put together" / "group" / "stack" / "cluster":
  → Move all shapes to the SAME position
  → Example: All circles at (2500, 2500)
  
"Arrange in a line" / "sort" / "line up":
  → Arrange with spacing between shapes
  → Example: Circle 1 at x=1000, Circle 2 at x=1500, Circle 3 at x=2000
```

---

#### Issue 8: Z-Index vs Position Confusion ❌→✅

**What I tested:**
```
Me: "arrange them by size z index (small at top and bigger at bottom)"

AI: ❌ Used moveShape to change Y positions
     ❌ Moved shapes vertically instead of changing z-index
```

**The Problem:**
- AI confused "z-index" with "vertical position"
- "top" and "bottom" triggered position movement
- AI didn't understand z-index = layering (which shape appears in front)

**How I Fixed It:**
Added dedicated "Z-Index / Layering commands" section:

```
Z-index controls LAYERING (which shape is in front), NOT position:
- "bring to front" → use changeLayer tool
- "send to back" → use changeLayer tool  
- "arrange by size z-index" → changeLayer tool, NOT moveShape
- Higher z-index = appears on top
- Lower z-index = appears behind
```

---

#### Final Working Examples:

After all fixes, these commands work perfectly:

**1. Batch Creation:**
```
Me: "Create 100 circles in line. It should be in the middle, horizontally."
Result: ✅ 49 circles (rate limited) at y=2500, proper spacing, random colors
```

**2. Multi-Step Complex:**
```
Me: "Create five circles with different radius and colors. Also create seven 
squares, different size and colors. Create four lines at least 200 pixels long. 
Create two texts: apple and bubble."

Result: ✅ All shapes with exact specs
```

**3. Contextual Memory:**
```
Me: "Create 3 circles"
Me: "arrange all circles vertically from middle"
Result: ✅ AI remembered context, arranged them
```

**4. Batch Operations:**
```
Me: "Delete all squares and rectangles"
Result: ✅ 7 shapes deleted

Me: "Resize all circles to be same radius"
Result: ✅ All circles now radius 50
```

**5. Styling & Layering:**
```
Me: "all rectangles need to have radius of 50"
Result: ✅ Corner radius changed

Me: "arrange them by size z index"
Result: ✅ Z-index reordered (small=top, big=bottom)
```

---

### Phase 5: Feature Expansion (~2 hours)
**What I did**: Realized core tools weren't enough, added 7 more

After getting the basic 3 tools working, I started testing more complex scenarios and realized I needed more tools.

---

#### Realizing the Need for More Tools

**What happened:**
```
Me: "Resize all circles to be same radius"

AI: ❌ "I don't have a tool to resize shapes yet. I can only create, 
move, and query shapes."
```

**My reaction:**
```
Me: "Well, we cannot change their radius or stroke or anything?"

AI: "Currently I have these tools:
- createShape
- moveShape  
- getCanvasState

Would you like me to add resize, delete, and styling tools?"

Me: "lets add them"
```

---

#### Adding Delete Tool

**Why:** Need to remove shapes without manually selecting them

**Implementation:**
- Tool name: `deleteShape`
- Parameters: `shapeNames: string[]` (can delete multiple at once)
- Logic: Find shapes by name, call `canvasContext.deleteShapes()`

**Testing:**
```
Me: "delete all squares and rectangles"
Result: ✅ Deleted 7 shapes

Debug: 
- Found 7 shapes matching "rectangle" type
- Called deleteShapes with array of IDs
- Success message: "Deleted 7 shapes"
```

---

#### Adding Resize Tool

**Why:** Need to change shape dimensions

**Implementation:**
- Tool name: `resizeShape`
- Parameters: `shapeName`, `width?`, `height?`, `radius?`
- Type-specific: width/height for rectangles, radius for circles

**Testing:**
```
Me: "Resize all circles to be same radius"
Result: ✅ All circles now radius 50

Me: "Make Rectangle 1 200x300"
Result: ✅ Rectangle 1 resized to 200x300
```

**Issue I Hit:**
```
First attempt: AI generated malformed tool call:
{
  "parameters": {
    "shapeName": "Circle 1",
    "radius": 50
  }
}

Problem: Extra "parameters" wrapper
Fix: Updated tool schema to be clearer about structure
```

---

#### Adding Rotate Tool

**Why:** Need to rotate rectangles and lines

**Implementation:**
- Tool name: `rotateShape`
- Parameters: `shapeName`, `angle` (in degrees)
- Normalizes angle to 0-360 range

**Testing:**
```
Me: "Rotate all rectangles to 45 degrees"
Result: ✅ All rectangles rotated to 45°

Me: "Rotate Line 1 by 90" (relative rotation)
Result: ✅ Line 1 rotated additional 90°
```

---

#### Adding Color Tool

**Why:** Need to change fill colors

**Implementation:**
- Tool name: `changeShapeColor`
- Parameters: `shapeNames: string[]`, `color: string`
- Supports color names ("red", "blue") and hex codes ("#FF5733")

**Testing:**
```
Me: "Make all circles blue"
Result: ✅ 5 circles changed to blue

Me: "Change Rectangle 1 to #FF5733"
Result: ✅ Rectangle 1 changed to orange-red
```

---

#### Adding Align Tool

**Why:** Need to align multiple shapes

**Implementation:**
- Tool name: `alignShapes`
- Parameters: `shapeNames: string[]`, `alignment: string`
- Types: left, right, top, bottom, center-horizontal, center-vertical
- Calculates common coordinate (min/max/average)

**Testing:**
```
Me: "Align all rectangles to the left"
Result: ✅ All rectangles aligned, x = leftmost shape's x

Me: "Center all circles vertically"
Result: ✅ All circles centered, y = average of all y positions
```

---

#### Adding Layer Tool

**Why:** Control which shapes appear in front/back

**Implementation:**
- Tool name: `changeLayer`
- Parameters: `shapeNames: string[]`, `action: string`
- Actions: bring-to-front, send-to-back, bring-forward, send-backward
- Gets current z-index range, calculates new z-index

**Testing:**
```
Me: "Bring Rectangle 1 to front"
Result: ✅ Rectangle 1 z-index = highest + 1

Me: "arrange them by size z index (small at top and bigger at bottom)"
Result: ✅ Z-index ordered by size
```

---

#### Adding Style Tool

**Why:** Need to modify stroke, corners, line caps

**Implementation:**
- Tool name: `changeShapeStyle`
- Parameters: `shapeNames`, `strokeColor?`, `strokeWidth?`, `cornerRadius?`, `lineCap?`
- Type-specific: cornerRadius only for rectangles, lineCap only for lines

**Testing:**
```
Me: "all rectangles need to have radius of 50"
Result: ✅ Corner radius = 50 on all rectangles

Me: "Add 5px red stroke to Rectangle 1"
Result: ✅ Rectangle 1 stroke: 5px red

Me: "Set corner radius to 20"
Result: ✅ All rectangles corner radius = 20
```

---

**Summary of Expansion:**
- Started with 3 tools (create, move, query)
- Added 7 more tools based on real usage needs
- Total: 10 comprehensive tools for complete canvas control
- Each tool tested individually before moving to next
- Took ~2 hours to implement and test all 7 new tools

---

### Phase 6: Polish & Help UI (~30 min)
**What I did**: Realized users won't know what commands they can use

After building all 10 tools, I realized a problem: **How will users know what they can ask the AI to do?**

---

#### The Problem

**User Experience Issue:**
- User opens AI panel
- Sees empty chat interface
- Thinks: "What can I even say to this?"
- Has to guess commands or read documentation

**What I wanted:**
- Quick way to see all available commands
- Examples for each tool
- In-app reference (no need to read PRD)

---

#### The Solution

**My Request:**
```
Me: "let's also include what we can do with chat. Maybe like some small question 
mark and showing like, I can do this, I can do that, I can do that. Just show 
like all function in UI."
```

**What AI Built:**

1. **Help Button (❓)**
   - Added to AI panel header (next to close button)
   - Click to toggle help section
   - Visual indication of where to find help

2. **Collapsible Help Section**
   - Appears below header when help button clicked
   - Scrollable (max height 300px)
   - Blue background to distinguish from chat
   - Can dismiss by clicking ❓ again

3. **Tool Categories**
   - Each tool has its own card
   - Color-coded by function:
     - 🎨 Create Shapes (blue)
     - ↔️ Move Shapes (green)
     - ↔️ Resize Shapes (purple)
     - ↻ Rotate Shapes (orange)
     - 🎨 Change Color (red)
     - ⫼ Align Shapes (teal)
     - 📚 Change Layer (indigo)
     - ✏️ Change Style (pink)
     - 🗑️ Delete Shapes (red)
     - ❓ Query Canvas (gray)

4. **Each Card Contains:**
   - Icon and title
   - Brief description
   - Example command in italics
   
   Example:
   ```
   🎨 Create Shapes
   Create rectangles, circles, lines, and text
   Ex: "Create 3 red circles", "Create a blue rectangle at center"
   ```

5. **Empty State Hint**
   - When no messages yet, shows: "Click the ❓ icon above to see all available commands"
   - Guides users to discover help

---

#### Testing the Help UI

**User Flow:**
```
1. User opens AI panel (Cmd/Ctrl+K)
2. Sees empty state with hint about ❓ button
3. Clicks ❓ button
4. Help section expands, shows all 10 tools
5. User reads: "Create rectangles, circles, lines, and text"
6. User tries: "Create 3 red circles"
7. ✅ Works! User understands the pattern
```

**Result:**
- Users can discover capabilities without documentation
- Examples show the natural language style expected
- Quick reference always available
- No need to remember exact command syntax

---

#### Code Structure

**Files Modified:**
- `src/components/AI/AIPanel.tsx`:
  - Added `showHelp` state
  - Added help button to header
  - Added help section JSX
  - Help section styled with Tailwind classes

**Implementation Details:**
```typescript
const [showHelp, setShowHelp] = useState(false);

// In header
<button onClick={() => setShowHelp(!showHelp)}>
  <QuestionMarkIcon />
</button>

// Help section
{showHelp && (
  <div className="help-section">
    {tools.map(tool => (
      <ToolCard 
        icon={tool.icon}
        title={tool.title}
        description={tool.description}
        example={tool.example}
      />
    ))}
  </div>
)}
```

**Styling:**
- Cards: White background with rounded corners
- Section: Blue background (distinguishes from chat)
- Scrollable: Uses `overflow-y-auto` for long lists
- Responsive: Adapts to panel width

---

**Time Breakdown for This Phase:**
- Design decision: 5 minutes
- Implementation: 20 minutes
- Testing & tweaks: 5 minutes
- **Total: ~30 minutes**

**Final Polish:**
- Help UI provides self-service discovery
- Users can start using AI without reading docs
- Examples guide users to correct command style
- Always accessible via ❓ button

---

## Technical Decisions

### 1. SDK Choice: OpenAI Agent SDK
**Why**: Direct function calling, no extra layers, simple for MVP

### 2. Start with Minimal Tools
**Strategy**: Build 3 tools first, expand after validation
**Benefit**: Faster to iterate, easier to debug

### 3. Position Strategy
**Three types**: 
- Preset (center, top-left, etc.)
- Exact (x, y coordinates)
- Relative (near, below another shape)

### 4. Canvas Bounds Handling
**Problem**: Shapes going outside 5000x5000px
**Solution**: Clamp all coordinates, account for shape dimensions

### 5. Conversation Memory
**Implementation**: Last 10 messages sent to OpenAI for context
**Benefit**: AI understands "them", "those circles", etc.

### 6. Rate Limiting
**Limits**: 10 commands/min, 20 shapes per command
**Benefit**: Prevent abuse, control API costs

---

## Architecture

```
User Command (Natural Language)
    ↓
AI Panel (Chat UI)
    ↓
AI Integration Layer
    ↓
OpenAI API (GPT-4o Mini)
    ↓
Function Calling (Structured JSON)
    ↓
Tool Executor
    ├─→ Position Parser
    ├─→ Rate Limiter
    └─→ Canvas Context
         ↓
    Firestore (Real-time sync)
```

**10 Tools:**
1. createShape
2. moveShape
3. deleteShape
4. resizeShape
5. rotateShape
6. changeShapeColor
7. alignShapes
8. changeLayer
9. changeShapeStyle
10. getCanvasState

---

## Files Created

**Planning Docs (2):**
- `ai-agent/AI-AGENT-PRD.md` - 500 lines
- `ai-agent/AI-AGENT-TASKS.md` - Implementation checklist

**Services (4):**
- `src/services/ai/openai.ts` - OpenAI integration (570 lines)
- `src/services/ai/positionParser.ts` - Position parsing (271 lines)
- `src/services/ai/toolExecutor.ts` - Tool execution (1265 lines)
- `src/services/ai/rateLimiter.ts` - Rate limiting (161 lines)

**UI Components (5):**
- `src/components/AI/AIPanel.tsx` - Chat panel
- `src/components/AI/AIInput.tsx` - Input field
- `src/components/AI/AIMessage.tsx` - Message display
- `src/components/AI/AIToast.tsx` - Toast notifications
- `src/components/AI/AICanvasIntegration.tsx` - Integration layer

**Modified (4):**
- `package.json` - Added `openai` dependency
- `src/components/Canvas/Canvas.tsx` - Integrated AI panel
- `src/components/Canvas/PropertiesPanel.tsx` - Added "Ask AI" button
- `src/types/index.ts` - Added `zIndex` to `ShapeUpdate`

**Total**: ~2,500 lines of new code

---

## Time Breakdown

- **Phase 0 - Research & SDK selection**: 30 minutes
- **Phase 1 - Tool planning**: 30 minutes
- **Phase 2 - PRD creation & refinement**: 1 hour
- **Phase 3 - One-shot implementation**: 2 hours
- **Phase 4 - Testing & fixing issues**: 3 hours (15+ iterations)
- **Phase 5 - Feature expansion**: 2 hours
- **Phase 6 - Polish & help UI**: 30 minutes
- **Total**: ~8 hours (research to production)

---

## What I Learned

### What Worked Well:
1. **Start with research**: Choosing right SDK saved time later
2. **Minimal viable toolset**: 3 tools first, expand after validation
3. **PRD-first approach**: Clear docs enabled one-shot implementation
4. **Real-time testing**: Immediate feedback revealed issues
5. **Iterative refinement**: 15+ small fixes better than one perfect attempt

### Key Insights:
1. **OpenAI needs explicit instructions**: Ambiguous commands need clear definitions
2. **Async state is tricky**: Account for Firestore sync delays
3. **Start simple, expand**: Don't build all features upfront
4. **Natural language is hard**: "together" vs "in a line" needs examples
5. **Debug mode essential**: Seeing tool calls helps troubleshoot

### My Strategy:
1. Research options thoroughly
2. Plan minimum viable tools
3. Create detailed PRD with AI help
4. Refine PRD based on complexity
5. One-shot implementation from docs
6. Test with real commands
7. Fix what breaks, iterate quickly
8. Expand features once core works

---

## Stack

- **AI**: OpenAI GPT-4o Mini (function calling)
- **Frontend**: React + TypeScript + Vite
- **Canvas**: Konva.js
- **Backend**: Firebase Firestore
- **Styling**: Tailwind CSS v4

---

## Result

Production-ready AI canvas agent with 10 tools that understands natural language. Users type conversational commands like "Create 5 blue circles in a row" or "Align all rectangles to the left" and AI executes correctly with real-time sync across all users.

**Success**: From concept to working feature in 8 hours.
