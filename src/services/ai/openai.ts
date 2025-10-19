/**
 * OpenAI Service
 * Handles communication with OpenAI API and function calling
 */

import OpenAI from 'openai';
import type { Shape } from '../../types';

// ============================================================================
// Configuration
// ============================================================================

// AI Model Configuration - Change via env or per-call override
const DEFAULT_AI_MODEL = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o'; // gpt-4o is faster than mini for function calling
const DEFAULT_AI_TEMPERATURE = import.meta.env.VITE_DEFAULT_AI_TEMPERATURE || 0.7; // Higher for creativity while maintaining consistency

// Non-authoritative suggestions; actual availability depends on your API access
export const SUGGESTED_MODELS = [
  'gpt-5',
  'gpt-5-mini',
  'gpt-4.1',
  'gpt-4.1-mini',
  'gpt-4o',
  'gpt-4o-mini',
];

// OpenAI client for development only (production uses server-side /api/ai-command.js)
// Only instantiate in development to avoid "Missing credentials" error in production
let openai: OpenAI | null = null;

if (import.meta.env.DEV && import.meta.env.VITE_OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true, // Required for client-side use
  });
}

// ============================================================================
// Type Definitions
// ============================================================================

export interface ToolCall {
  id: string;
  function: {
    name: string;
    arguments: string;
  };
}

export interface AIResponse {
  message: string;
  toolCalls: ToolCall[];
  debugInfo: string[];
}

// PositionParameter interface removed - defined in positionParser.ts

// ============================================================================
// Tool Schema Definitions
// ============================================================================

const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'createShape',
      description: 'Create a new shape on the canvas. Supports rectangles, circles, text, and lines. Use preset positions like "center", exact coordinates, or relative positioning to other shapes.',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['rectangle', 'circle', 'text', 'line'],
            description: 'Type of shape to create',
          },
          position: {
            type: 'object',
            description: 'Position where the shape should be created. Use preset names (canvas positions), exact coordinates, or relative positioning. If omitted, uses viewport center.',
            properties: {
              preset: {
                type: 'string',
                enum: ['center', 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'top-center', 'bottom-center'],
                description: 'Named position on the CANVAS (not viewport). "center" = canvas center or shape cluster center.',
              },
              x: {
                type: 'number',
                description: 'Exact X coordinate (0-5000)',
              },
              y: {
                type: 'number',
                description: 'Exact Y coordinate (0-5000)',
              },
              relativeTo: {
                type: 'string',
                description: 'Name of the shape to position relative to (e.g., "Rectangle 1")',
              },
              offset: {
                type: 'number',
                description: 'Distance in pixels from the relative shape (default: 50)',
              },
              direction: {
                type: 'string',
                enum: ['right', 'left', 'top', 'bottom'],
                description: 'Direction to offset from the relative shape',
              },
            },
          },
          size: {
            type: 'object',
            description: 'Size of the shape (default: 100x100)',
            properties: {
              width: {
                type: 'number',
                description: 'Width in pixels',
              },
              height: {
                type: 'number',
                description: 'Height in pixels',
              },
            },
          },
          color: { type: 'string', description: 'Fill color (hex or common name)' },
          strokeColor: { type: 'string', description: 'Stroke color (hex or common name)' },
          strokeWidth: { type: 'number', description: 'Stroke width 0-20' },
          cornerRadius: { type: 'number', description: 'Corner radius for rectangles 0-50' },
          text: {
            type: 'string',
            description: 'Text content (required for text shapes)',
          },
          fontSize: {
            type: 'number',
            description: 'Font size for text shapes (default: 16)',
          },
        },
        required: ['type', 'position'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'moveShape',
      description: 'Move an existing shape to a new position. Can use preset positions, exact coordinates, or position relative to other shapes.',
      parameters: {
        type: 'object',
        properties: {
          shapeName: {
            type: 'string',
            description: 'Name of the shape to move (e.g., "Rectangle 1", "AI Circle 2")',
          },
          position: {
            type: 'object',
            description: 'New position for the shape',
            properties: {
              preset: {
                type: 'string',
                enum: ['center', 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'top-center', 'bottom-center'],
                description: 'Named position on the canvas',
              },
              x: {
                type: 'number',
                description: 'Exact X coordinate (0-5000)',
              },
              y: {
                type: 'number',
                description: 'Exact Y coordinate (0-5000)',
              },
              relativeTo: {
                type: 'string',
                description: 'Name of the shape to position relative to',
              },
              offset: {
                type: 'number',
                description: 'Distance in pixels from the relative shape (default: 50)',
              },
              direction: {
                type: 'string',
                enum: ['right', 'left', 'top', 'bottom'],
                description: 'Direction to offset from the relative shape',
              },
            },
          },
        },
        required: ['shapeName', 'position'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getCanvasState',
      description: 'Query the current state of the canvas, including all shapes and their properties. Useful for planning where to place new shapes or finding existing shapes.',
      parameters: {
        type: 'object',
        properties: {
          filter: {
            type: 'string',
            enum: ['all', 'rectangles', 'circles', 'text', 'lines'],
            description: 'Filter shapes by type (default: all)',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'deleteShape',
      description: 'Delete one or multiple shapes from the canvas.',
      parameters: {
        type: 'object',
        properties: {
          shapeNames: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Array of shape names to delete (e.g., ["Rectangle 1", "Circle 2"])',
          },
        },
        required: ['shapeNames'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'resizeShape',
      description: 'Resize a shape by changing its dimensions. For rectangles: width and height. For circles: radius. Lines cannot be resized.',
      parameters: {
        type: 'object',
        properties: {
          shapeName: {
            type: 'string',
            description: 'Name of the shape to resize',
          },
          width: {
            type: 'number',
            description: 'New width in pixels (for rectangles)',
          },
          height: {
            type: 'number',
            description: 'New height in pixels (for rectangles)',
          },
          radius: {
            type: 'number',
            description: 'New radius in pixels (for circles)',
          },
        },
        required: ['shapeName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'rotateShape',
      description: 'Rotate a shape by a specified angle in degrees. Works for rectangles, lines, and text.',
      parameters: {
        type: 'object',
        properties: {
          shapeName: {
            type: 'string',
            description: 'Name of the shape to rotate',
          },
          angle: {
            type: 'number',
            description: 'Rotation angle in degrees (0-360)',
          },
        },
        required: ['shapeName', 'angle'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'changeShapeColor',
      description: 'Change the color of one or multiple shapes without moving them.',
      parameters: {
        type: 'object',
        properties: {
          shapeNames: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Array of shape names to recolor (e.g., ["Rectangle 1", "Circle 2"])',
          },
          color: {
            type: 'string',
            description: 'New color (hex code or color name like "red", "blue", "green")',
          },
        },
        required: ['shapeNames', 'color'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'alignShapes',
      description: 'Align multiple shapes along a common axis. Useful for organizing shapes.',
      parameters: {
        type: 'object',
        properties: {
          shapeNames: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Array of shape names to align (e.g., ["Rectangle 1", "Circle 2"])',
          },
          alignment: {
            type: 'string',
            enum: ['left', 'right', 'center-horizontal', 'top', 'bottom', 'center-vertical'],
            description: 'How to align the shapes',
          },
        },
        required: ['shapeNames', 'alignment'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'changeLayer',
      description: 'Change the layering (z-index) of shapes. Controls which shapes appear on top of others.',
      parameters: {
        type: 'object',
        properties: {
          shapeNames: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Array of shape names to change layer for (e.g., ["Rectangle 1", "Circle 2"])',
          },
          action: {
            type: 'string',
            enum: ['bring-to-front', 'send-to-back', 'bring-forward', 'send-backward'],
            description: 'Layer action: bring-to-front (move to top), send-to-back (move to bottom), bring-forward (up one layer), send-backward (down one layer)',
          },
        },
        required: ['shapeNames', 'action'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'changeShapeStyle',
      description: 'Change styling properties of shapes like border (stroke), corner radius, line caps. Does not change fill color (use changeShapeColor for that).',
      parameters: {
        type: 'object',
        properties: {
          shapeNames: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Array of shape names to style (e.g., ["Rectangle 1", "Circle 2"])',
          },
          strokeColor: {
            type: 'string',
            description: 'Border/outline color (hex code or color name like "red", "blue")',
          },
          strokeWidth: {
            type: 'number',
            description: 'Border/outline thickness in pixels (0-20)',
          },
          cornerRadius: {
            type: 'number',
            description: 'Corner roundness for rectangles in pixels (0-50)',
          },
          lineCap: {
            type: 'string',
            enum: ['butt', 'round', 'square'],
            description: 'Line end style (only for lines): butt (flat), round (rounded), square (extended flat)',
          },
        },
        required: ['shapeNames'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'createMultipleShapes',
      description: 'Create LARGE numbers of shapes at once (bulk creation). ONLY use this for 50+ shapes. For smaller amounts (less than 50), use multiple createShape calls instead. Perfect for creating large patterns, stress testing, or filling the canvas. Can create up to 5000 shapes in one command.',
      parameters: {
        type: 'object',
        properties: {
          count: {
            type: 'number',
            description: 'Number of shapes to create (1-5000)',
          },
          shapeType: {
            type: 'string',
            enum: ['rectangle', 'circle', 'text', 'line', 'random', 'mixed'],
            description: 'Type of shapes to create. "random" or "mixed" creates variety of all types.',
          },
          layout: {
            type: 'string',
            enum: ['grid', 'random', 'circular', 'horizontal', 'vertical', 'wave'],
            description: 'How to arrange the shapes: grid (organized rows/columns), random (scattered), circular (spiral pattern), horizontal (line), vertical (column), wave (wave pattern)',
          },
          colorScheme: {
            type: 'string',
            description: 'Color scheme: "random" (variety), "gradient" (rainbow), "monochrome" (single color gradient), "warm" (reds/oranges/yellows), "cool" (blues/greens), or specific color like "#FF0000"',
          },
          sizeVariation: {
            type: 'string',
            enum: ['uniform', 'random', 'gradual'],
            description: 'Size variation: uniform (all same size), random (varied sizes), gradual (gradually changing)',
          },
          area: {
            type: 'string',
            enum: ['viewport', 'canvas'],
            description: 'Where to create shapes: viewport (current view), canvas (entire canvas)',
          },
          minSize: {
            type: 'number',
            description: 'Minimum size in pixels (default: 30)',
          },
          maxSize: {
            type: 'number',
            description: 'Maximum size in pixels (default: 100)',
          },
          spacing: {
            type: 'number',
            description: 'Spacing between shapes in pixels (default: 20)',
          },
          rows: {
            type: 'number',
            description: 'Number of rows for grid layout (optional, only used with layout: "grid")',
          },
          columns: {
            type: 'number',
            description: 'Number of columns for grid layout (optional, only used with layout: "grid")',
          },
        },
        required: ['count'],
      },
    },
  },
];

// ============================================================================
// Main AI Command Function
// ============================================================================

/**
 * Send a command to OpenAI and get back tool calls to execute
 */
export async function sendAICommand(
  userMessage: string,
  shapes: Shape[],
  extras?: {
    viewport?: {
      center: { x: number; y: number };
      bounds: { minX: number; maxX: number; minY: number; maxY: number };
    };
    // Optional per-call model override
    model?: string;
  }
): Promise<AIResponse> {
  const debugInfo: string[] = [];

  try {
    debugInfo.push(`[OpenAI] Sending message: "${userMessage}"`);

    // Build context about current canvas state
    const canvasContext = buildCanvasContext(shapes);
    debugInfo.push(`[Context] Canvas has ${shapes.length} shapes`);

    // Build messages array with conversation history
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `Canvas AI. You can make MULTIPLE tool calls in ONE response.

⚠️ CRITICAL - UI ELEMENTS NEED MULTIPLE SHAPES:
Each UI element is built from multiple createShape calls. Examples:
- Button = 2 shapes (rectangle + centered text)
- Input field = 2-3 shapes (label above + input rectangle + optional placeholder inside)
- Form = many shapes (container + N fields + button)
You MUST make ALL the createShape calls together - do NOT make just 1 call!

POSITIONING (IMPORTANT):
Viewport center: (${extras?.viewport?.center.x || 0}, ${extras?.viewport?.center.y || 0})

DEFAULT RULE: If user doesn't specify position → create at viewport center!
- Single shape: center it at viewport (x = vcx - width/2, y = vcy - height/2)
- Container/form: center it at viewport (containerX = vcx - width/2, containerY = vcy - height/2)
- Then position elements inside: startX = containerX + 32, startY = containerY + 32

ALWAYS use explicit {x: NUM, y: NUM} coordinates, NOT presets.
NEVER ask where to place something - just use viewport center if not specified!

For text in buttons: textX = buttonX + (width/2), textY = buttonY + (height/2)

UNIVERSAL LAYOUT RULES (CSS-like):

Input Field Pattern:
  1. Label text (optional): position ABOVE input, labelY = inputY - 20
  2. Input rectangle: main field
  3. Placeholder text (optional): INSIDE input, textX = inputX + 12, textY = inputY + (height/2)
  Gap between label and input: 8-12px

Button Pattern:
  1. Button rectangle
  2. Button text: CENTERED at buttonX + (width/2), buttonY + (height/2)

Form Pattern (universal for ANY fields):
  1. Container rectangle (sized to fit all content)
  2. For EACH field user requests:
     - Label text (if field has a name)
     - Input rectangle
     - Placeholder text (optional)
  3. Button at bottom
  4. Button text centered in button
  
Vertical spacing: currentY starts at containerY + 32, increment by elementHeight + 16-24 after each element
Apply modern defaults: rounded corners, subtle borders, good contrast, clean colors.

PROCESS (universal for any UI):
1. Parse user request: What elements do they want? (fields, buttons, text, etc.)
2. Calculate sizes: container must fit all elements + spacing + padding
3. Position container: centered at viewport using formula
4. Loop through each element:
   - Calculate its Y position (currentY)
   - Create element shape(s) (rectangle, text, etc.)
   - Increment currentY by element height + spacing
5. Apply patterns: labels above inputs, text centered in buttons, etc.

Standard spacing: 16-24px between elements, 32px padding inside containers

Shapes: rectangle, circle, text, line. Only manipulate existing shapes by name.
Current canvas: ${canvasContext}`,
      },
    ];

    // No conversation history - each command is fresh and independent
    // This prevents the AI from repeating previous mistakes

    // Add current user message
    messages.push({
      role: 'user',
      content: userMessage,
    });

    // Create the chat completion - use client-side in development, server-side in production
    type ChatCompletionLike = {
      choices: Array<{
        message: {
          content?: string | null;
          tool_calls?: Array<{ id: string; function?: { name: string; arguments: string } }>;
        };
      }>;
    };
    let response: ChatCompletionLike;
    // Force gpt-4o for speed testing (bypassing DEFAULT_AI_MODEL)
    const chosenModel = extras?.model || DEFAULT_AI_MODEL || 'gpt-4o';
    debugInfo.push(`[OpenAI] Model: ${chosenModel}`);
    
    // Log model being used
    console.log(`🤖 Using AI Model: ${chosenModel} (forced for speed)`);
    console.time('⏱️ OpenAI API Call');
    
    if (import.meta.env.DEV) {
      // Development: Use client-side OpenAI (API key exposed but only locally)
      if (!openai) {
        throw new Error('OpenAI client not initialized. Please set VITE_OPENAI_API_KEY in your .env file.');
      }
      debugInfo.push(`[OpenAI] Using client-side call (development mode)`);
      response = await openai.chat.completions.create({
        model: chosenModel,
        temperature: DEFAULT_AI_TEMPERATURE,
        messages,
        tools,
        tool_choice: 'auto',
      });
    } else {
      // Production: Use server-side API route (API key secure)
      debugInfo.push(`[OpenAI] Using server-side call (production mode)`);
      const apiResponse = await fetch('/api/ai-command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: chosenModel,
          temperature: DEFAULT_AI_TEMPERATURE,
          messages,
          tools,
          tool_choice: 'auto',
        }),
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.error || 'AI service error');
      }

      response = await apiResponse.json();
    }

    console.timeEnd('⏱️ OpenAI API Call');
    debugInfo.push(`[OpenAI] Received response`);

    const choice = response.choices[0];
    const message = choice.message;

    // Extract tool calls if present
    const toolCalls: ToolCall[] = message.tool_calls?.map((tc: { id: string; function?: { name: string; arguments: string } }) => {
      if (tc.function) {
        return {
          id: tc.id,
          function: {
            name: tc.function.name,
            arguments: tc.function.arguments,
          },
        };
      }
      return null;
    }).filter((tc: ToolCall | null): tc is ToolCall => tc !== null) || [];

    debugInfo.push(`[OpenAI] Tool calls: ${toolCalls.length}`);
    toolCalls.forEach((tc) => {
      debugInfo.push(`  - ${tc.function.name}(${tc.function.arguments})`);
    });

    // Get AI's text response
    // If AI didn't provide a message (shouldn't happen with updated prompt), generate a minimal one
    let aiMessage = message.content || '';
    
    if (!aiMessage && toolCalls.length > 0) {
      // Fallback: create a simple message based on tool calls
      const actionVerbs: Record<string, string> = {
        createShape: 'created',
        moveShape: 'moved',
        resizeShape: 'resized',
        rotateShape: 'rotated',
        changeShapeColor: 'changed the color of',
        alignShapes: 'aligned',
        changeLayerOrder: 'changed the layer order of',
        changeShapeStyle: 'styled',
        queryCanvas: 'analyzed',
        deleteShape: 'deleted',
      };
      
      const actions = toolCalls.map(tc => actionVerbs[tc.function.name] || 'updated');
      const uniqueActions = [...new Set(actions)];
      
      if (uniqueActions.length === 1) {
        aiMessage = `Done! I ${uniqueActions[0]} the shapes for you.`;
      } else {
        aiMessage = `All set! I've made the changes you requested.`;
      }
      
      debugInfo.push(`[Warning] AI didn't provide a message, generated fallback: "${aiMessage}"`);
    }

    return {
      message: aiMessage,
      toolCalls,
      debugInfo,
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    debugInfo.push(`[Error] ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    throw new Error(
      error instanceof Error 
        ? `AI Error: ${error.message}` 
        : 'Failed to communicate with AI'
    );
  }
}

/**
 * Build a text description of the canvas state for AI context
 */
function buildCanvasContext(shapes: Shape[]): string {
  if (shapes.length === 0) {
    return 'The canvas is currently empty.';
  }

  const shapeDescriptions = shapes.map((shape): string => {
    const locked = shape.isLocked ? ` (locked by ${shape.lockedByName})` : '';
    
    if (shape.type === 'line') {
      return `- "${shape.name}" [id=${shape.id}]: Line from (${shape.x1}, ${shape.y1}) to (${shape.x2}, ${shape.y2})${locked}`;
    }
    
    if (shape.type === 'circle') {
      return `- "${shape.name}" [id=${shape.id}]: Circle at (${shape.x}, ${shape.y}), radius ${shape.radius}, color ${shape.fill}${locked}`;
    }
    
    if (shape.type === 'text') {
      return `- "${shape.name}" [id=${shape.id}]: Text "${shape.text}" at (${shape.x}, ${shape.y}), size ${shape.fontSize}${locked}`;
    }
    
    // shape.type === 'rectangle'
    return `- "${shape.name}" [id=${shape.id}]: Rectangle at (${shape.x}, ${shape.y}), size ${shape.width}x${shape.height}, color ${shape.fill}${locked}`;
  });

  // Group by type for clarity
  const rectangles = shapes.filter(s => s.type === 'rectangle');
  const circles = shapes.filter(s => s.type === 'circle');
  const lines = shapes.filter(s => s.type === 'line');
  const texts = shapes.filter(s => s.type === 'text');

  let summary = `Canvas has ${shapes.length} shape(s)`;
  if (rectangles.length > 0) summary += ` (${rectangles.length} rectangles/squares)`;
  if (circles.length > 0) summary += ` (${circles.length} circles)`;
  if (lines.length > 0) summary += ` (${lines.length} lines)`;
  if (texts.length > 0) summary += ` (${texts.length} texts)`;
  summary += ':\n\n';
  
  // List all shape names explicitly by type
  if (rectangles.length > 0) {
    summary += `Rectangles: ${rectangles.map(s => s.name).join(', ')}\n`;
  }
  if (circles.length > 0) {
    summary += `Circles: ${circles.map(s => s.name).join(', ')}\n`;
  }
  if (lines.length > 0) {
    summary += `Lines: ${lines.map(s => s.name).join(', ')}\n`;
  }
  if (texts.length > 0) {
    summary += `Texts: ${texts.map(s => s.name).join(', ')}\n`;
  }
  summary += '\nDetailed information:\n';

  return summary + shapeDescriptions.join('\n') + '\n\n⚠️ CRITICAL: These are the ONLY shapes that exist. Do NOT use any other shape names!';
}

