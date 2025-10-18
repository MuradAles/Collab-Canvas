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
const DEFAULT_AI_MODEL = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini';

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

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
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
            description: 'Position where the shape should be created. Use preset names, exact coordinates, or relative positioning.',
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
  conversationHistory: ConversationMessage[] = [],
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
        content: `You are an AI assistant that manipulates a collaborative canvas. The canvas bounds are dynamic; follow the ranges described in the context rather than assuming fixed sizes.

🎨 Available shapes (always allowed to create):
- rectangle ("square" means width = height)
- circle (radius)
- text
- line

Correctness rules:
1) Only manipulate shapes that exist in the canvas context below. Use exact names from the context.
2) Defaults when unspecified:
   - Rectangle: 100x100 (square if user says "square")
   - Circle: radius 50 (you may pass size.width=100 → radius=50)
   - Text: content "Text", fontSize 16
   - Line: horizontal, length 100; x,y is the left endpoint
3) Clamp all coordinates to the canvas bounds shown in context. For circles, x,y is center and must be ≥ radius from edges.
4) Terminology mapping to tools:
   - Rectangle "radius" means corner radius → use changeShapeStyle with cornerRadius (do NOT use resizeShape.radius for rectangles)
   - Circle radius → use resizeShape with radius
   - Rectangle size changes → use resizeShape with width/height
   - Line length/orientation → createShape (length via size.width), moveShape for position
5) Relative placement must include relativeTo + direction + offset (default 50).
6) Prefer the minimum number of tool calls to fulfill a request.

Styling at creation:
- When the user specifies corner radius, stroke, or text color, set them during createShape (use color for fill, strokeColor/strokeWidth, cornerRadius). Avoid post-creation style calls unless needed across existing shapes.

Arrangements and spacing:
- When arranging multiple items (e.g., "line up"), compute explicit x,y using actual dimensions from context.
- Do not use presets for each item in sequences; anchor once and accumulate positions using previous widths/radii + a reasonable gap (e.g., 100).

Viewport anchoring:
- If the user does not specify position, anchor to the user's current viewport center.
- For sequences/arrangements, use the viewport's center Y (horizontal) or center X (vertical) as the baseline.
- Viewport info is provided below.
- Always compute absolute x,y using the viewport center; do NOT use preset "center" for viewport anchoring. Only use presets if the user asks for canvas positions.
- Convenience: let vcx = viewport.center.x, vcy = viewport.center.y. For centered rectangle width w: x = vcx - w/2. For stacking: start at vcy and add/subtract 16px per row.

Multi-create in one request (critical):
- Do NOT reference shapes created earlier in the same request using relativeTo; they won't appear yet in the canvas context.
- Instead, compute absolute x,y positions for every new element from the viewport anchor and the specified spacing.
- Only use relativeTo for shapes that already exist in the current canvas context.

UI wireframe interpretation (using shapes only, not real code):
- If the user asks for UI like a "login page" or "navbar", create a wireframe using rectangles and text:
  - Inputs: rectangles 320x44 with text labels above
  - Buttons: rectangles 120x44 with text centered
  - Headings: text (fontSize 24–32), body text 14–16
  - Spacing: 16px between stacked elements, center on canvas unless directed otherwise

Current viewport:
${extras?.viewport ? `center=(${extras.viewport.center.x}, ${extras.viewport.center.y}), bounds=[${extras.viewport.bounds.minX}..${extras.viewport.bounds.maxX}, ${extras.viewport.bounds.minY}..${extras.viewport.bounds.maxY}], vcx=${extras.viewport.center.x}, vcy=${extras.viewport.center.y}` : 'unknown'}

Current canvas state:
${canvasContext}`,
      },
    ];

    // Add conversation history (last 5 exchanges to keep context)
    const recentHistory = conversationHistory.slice(-10); // Last 10 messages (5 exchanges)
    messages.push(...recentHistory.map(msg => ({
      role: msg.role,
      content: msg.content,
    })));

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
    const chosenModel = extras?.model || DEFAULT_AI_MODEL;
    debugInfo.push(`[OpenAI] Model: ${chosenModel}`);
    
    if (import.meta.env.DEV) {
      // Development: Use client-side OpenAI (API key exposed but only locally)
      if (!openai) {
        throw new Error('OpenAI client not initialized. Please set VITE_OPENAI_API_KEY in your .env file.');
      }
      debugInfo.push(`[OpenAI] Using client-side call (development mode)`);
      response = await openai.chat.completions.create({
        model: chosenModel,
        temperature: 0.3,
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
          temperature: 0.3,
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
    const aiMessage = message.content || 'Processing your request...';

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

  const shapeDescriptions = shapes.map((shape) => {
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
    
    // Rectangle
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

