/**
 * OpenAI Service
 * Handles communication with OpenAI API and function calling
 */

import OpenAI from 'openai';
import type { Shape } from '../../types';

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
          color: {
            type: 'string',
            description: 'Color of the shape (hex code or color name like "red", "blue", "green")',
          },
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
      description: 'Rotate a shape by a specified angle in degrees. Only works for rectangles and lines.',
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
  conversationHistory: ConversationMessage[] = []
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
        content: `You are an AI assistant that helps users manipulate a collaborative canvas. 
The canvas is 5000x5000 pixels. You can create shapes, move shapes, and query the canvas state.

Important rules:
1. ⚠️ CRITICAL: ONLY use shape names that are shown in the current canvas context
   - The canvas context shows ALL shapes that currently exist
   - When user says "squares" they mean rectangles
   - When user says "all rectangles" find ALL shapes with "Rectangle" in their name FROM THE CANVAS CONTEXT
   - Shape names look like: "Rectangle 1", "Rectangle 2", "Circle 1", "Line 1", etc.
   - NEVER use shape names like "Rectangle 6" or "Rectangle 7" if they're not in the canvas context
   - If you just created shapes and need to manipulate them, ONLY use shapes you see in the current canvas context
2. ⚠️ Shape existence: BEFORE manipulating shapes, verify they exist in the canvas context
   - If a shape name isn't listed in the canvas context, it doesn't exist
   - Don't assume shapes exist based on previous conversation - ALWAYS check current canvas context
3. For relative positioning, verify the target shape exists
4. Use preset positions like "center" when appropriate
5. Clamp all coordinates to 0-5000 range
6. For multiple shapes, you can call createShape multiple times
7. Remember previous conversation context - if user says "these shapes" or "those objects", refer to what was discussed
8. "Squares" and "rectangles" are the SAME thing - both refer to rectangle type shapes

Understanding user intent:
- "Put together" / "group" / "stack" / "cluster" = Move ALL shapes to the SAME position (they will overlap/stack)
  * Example: "put all circles together at center" → Move ALL circles to x=2500, y=2500
  * Example: "group rectangles" → Move all rectangles to same x, y coordinates
- "Arrange in a line" / "sort" / "line up" = Arrange shapes in a LINE with spacing
  * Example: "arrange circles in a line" → Space them out: x=1000, x=1300, x=1600, etc.
- "Middle of canvas" / "center" = Exact center point (x=2500, y=2500)

Arranging shapes in a line:
- "Horizontally middle" = arrange in a horizontal line at vertical center (y = 2500)
- "Vertically middle" = arrange in a vertical line at horizontal center (x = 2500)
- When arranging multiple shapes in a line, ALWAYS use exact x,y coordinates, NOT preset positions
- ⚠️ CRITICAL: Calculate spacing based on ACTUAL shape sizes from canvas context (radius for circles, width/height for rectangles)
  * For circles: Use ACTUAL radius values from canvas context
    - Spacing between circles = radius_of_current + radius_of_next + 100px gap
    - Example: Circle 1 (radius 50) and Circle 2 (radius 75):
      * Circle 1 at x=1000
      * Circle 2 at x=1000 + 50 + 75 + 100 = 1225
  * For rectangles: Use ACTUAL width values from canvas context
    - Spacing = width_of_current + width_of_next / 2 + 100px gap
  * NEVER use fixed spacing - always calculate based on actual shape dimensions
  * Example for horizontal line with circles of different sizes:
    - Circle 1 (radius 50): x=1000, y=2500
    - Circle 2 (radius 75): x=1225, y=2500 (50+75+100 spacing)
    - Circle 3 (radius 50): x=1450, y=2500 (75+50+100 spacing)

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
    let response: any;
    
    if (import.meta.env.DEV) {
      // Development: Use client-side OpenAI (API key exposed but only locally)
      if (!openai) {
        throw new Error('OpenAI client not initialized. Please set VITE_OPENAI_API_KEY in your .env file.');
      }
      debugInfo.push(`[OpenAI] Using client-side call (development mode)`);
      response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
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
          model: 'gpt-4o-mini',
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
    const toolCalls: ToolCall[] = message.tool_calls?.map((tc: any) => {
      if ('function' in tc) {
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
      return `- "${shape.name}": Line from (${shape.x1}, ${shape.y1}) to (${shape.x2}, ${shape.y2})${locked}`;
    }
    
    if (shape.type === 'circle') {
      return `- "${shape.name}": Circle at (${shape.x}, ${shape.y}), radius ${shape.radius}, color ${shape.fill}${locked}`;
    }
    
    if (shape.type === 'text') {
      return `- "${shape.name}": Text "${shape.text}" at (${shape.x}, ${shape.y}), size ${shape.fontSize}${locked}`;
    }
    
    // Rectangle
    return `- "${shape.name}": Rectangle (square) at (${shape.x}, ${shape.y}), size ${shape.width}x${shape.height}, color ${shape.fill}${locked}`;
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

