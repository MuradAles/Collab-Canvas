/**
 * AI Service
 * Handles OpenAI integration with function calling for canvas operations
 */

import OpenAI from 'openai';
import type { Shape, AICommandResult } from '../types';

// ============================================================================
// OpenAI Client Setup
// ============================================================================

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

if (!apiKey) {
  console.warn('OpenAI API key not found. AI features will not work.');
}

const openai = new OpenAI({
  apiKey,
  dangerouslyAllowBrowser: true, // Required for client-side usage
});

// ============================================================================
// Function Calling Tool Definitions
// ============================================================================

const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'createShape',
      description: 'Create a new shape (rectangle, circle, or text) on the canvas',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['rectangle', 'circle', 'text'],
            description: 'Type of shape to create',
          },
          x: {
            type: 'number',
            description: 'X position on canvas (0-5000)',
          },
          y: {
            type: 'number',
            description: 'Y position on canvas (0-5000)',
          },
          width: {
            type: 'number',
            description: 'Width of the shape (for rectangles and text)',
          },
          height: {
            type: 'number',
            description: 'Height of the shape (for rectangles)',
          },
          radius: {
            type: 'number',
            description: 'Radius of the circle (for circles)',
          },
          fill: {
            type: 'string',
            description: 'Fill color in hex format (e.g., #ff0000 for red)',
          },
          text: {
            type: 'string',
            description: 'Text content (for text shapes)',
          },
          fontSize: {
            type: 'number',
            description: 'Font size (for text shapes)',
          },
        },
        required: ['type', 'x', 'y'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'moveShape',
      description: 'Move a shape to a new position',
      parameters: {
        type: 'object',
        properties: {
          shapeId: {
            type: 'string',
            description: 'ID of the shape to move',
          },
          x: {
            type: 'number',
            description: 'New X position',
          },
          y: {
            type: 'number',
            description: 'New Y position',
          },
        },
        required: ['shapeId', 'x', 'y'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'resizeShape',
      description: 'Resize a shape',
      parameters: {
        type: 'object',
        properties: {
          shapeId: {
            type: 'string',
            description: 'ID of the shape to resize',
          },
          width: {
            type: 'number',
            description: 'New width (for rectangles)',
          },
          height: {
            type: 'number',
            description: 'New height (for rectangles)',
          },
          radius: {
            type: 'number',
            description: 'New radius (for circles)',
          },
        },
        required: ['shapeId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'rotateShape',
      description: 'Rotate a shape by specified degrees',
      parameters: {
        type: 'object',
        properties: {
          shapeId: {
            type: 'string',
            description: 'ID of the shape to rotate',
          },
          degrees: {
            type: 'number',
            description: 'Rotation angle in degrees',
          },
        },
        required: ['shapeId', 'degrees'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'deleteShape',
      description: 'Delete a shape from the canvas',
      parameters: {
        type: 'object',
        properties: {
          shapeId: {
            type: 'string',
            description: 'ID of the shape to delete',
          },
        },
        required: ['shapeId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'editShape',
      description: 'Edit properties of an existing shape (color, stroke, text, etc.)',
      parameters: {
        type: 'object',
        properties: {
          shapeId: {
            type: 'string',
            description: 'ID of the shape to edit',
          },
          fill: {
            type: 'string',
            description: 'New fill color',
          },
          stroke: {
            type: 'string',
            description: 'New stroke color',
          },
          strokeWidth: {
            type: 'number',
            description: 'New stroke width',
          },
          text: {
            type: 'string',
            description: 'New text content (for text shapes)',
          },
          fontSize: {
            type: 'number',
            description: 'New font size (for text shapes)',
          },
        },
        required: ['shapeId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'arrangeShapes',
      description: 'Arrange multiple shapes in a pattern (horizontal, vertical, or grid)',
      parameters: {
        type: 'object',
        properties: {
          shapeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of shape IDs to arrange',
          },
          direction: {
            type: 'string',
            enum: ['horizontal', 'vertical', 'grid'],
            description: 'Direction to arrange shapes',
          },
          spacing: {
            type: 'number',
            description: 'Space between shapes in pixels',
          },
          columns: {
            type: 'number',
            description: 'Number of columns (for grid arrangement)',
          },
        },
        required: ['shapeIds', 'direction'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'alignShapes',
      description: 'Align multiple shapes',
      parameters: {
        type: 'object',
        properties: {
          shapeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of shape IDs to align',
          },
          alignment: {
            type: 'string',
            enum: ['left', 'center', 'right', 'top', 'middle', 'bottom'],
            description: 'Alignment direction',
          },
        },
        required: ['shapeIds', 'alignment'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getCanvasState',
      description: 'Get current state of all shapes on the canvas for context',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
];

// ============================================================================
// System Prompt
// ============================================================================

const SYSTEM_PROMPT = `You are an AI assistant that helps users create and manipulate shapes on a collaborative canvas.

Canvas Details:
- Canvas size: 5000x5000 pixels
- Available shapes: rectangles, circles, text
- Colors: Use hex format (e.g., #ff0000 for red, #0000ff for blue)
- Default sizes: rectangles 100x100, circles radius 50, text font size 24

User Commands:
- Simple: "create a red square at 100, 200"
- Complex: "create a login form with username, password, and submit button"
- Batch: "create 10 circles in a row"
- Edit: "make the blue rectangle larger"
- Arrange: "arrange these shapes in a grid"

Guidelines:
1. Use sensible defaults for unspecified properties
2. For complex requests (login form, nav bar), break them into multiple shape creations
3. When creating multiple shapes, arrange them nicely
4. Use getCanvasState to see existing shapes before editing
5. Be helpful and creative with layout suggestions
6. Confirm actions with friendly responses

Remember: You're helping users build visual layouts quickly and efficiently!`;

// ============================================================================
// AI Service Functions
// ============================================================================

export interface ProcessCommandOptions {
  userMessage: string;
  conversationHistory: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
  shapes: Shape[];
  onToolCall: (toolName: string, args: any) => Promise<any>;
}

/**
 * Process a user command with OpenAI and execute tool calls
 */
export async function processAICommand(
  options: ProcessCommandOptions
): Promise<AICommandResult> {
  const { userMessage, conversationHistory, onToolCall } = options;

  if (!apiKey) {
    return {
      success: false,
      message: 'OpenAI API key is not configured. Please add VITE_OPENAI_API_KEY to your .env file.',
    };
  }

  try {
    // Build messages array with system prompt
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory,
      { role: 'user', content: userMessage },
    ];

    // Call OpenAI with function calling
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      tools,
      tool_choice: 'auto',
    });

    const assistantMessage = response.choices[0].message;
    const toolCalls = assistantMessage.tool_calls;

    // Execute tool calls if any
    if (toolCalls && toolCalls.length > 0) {
      const results = [];
      
      for (const toolCall of toolCalls) {
        if (toolCall.type === 'function') {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);
          
          console.log(`[AI] Executing: ${functionName}`, functionArgs);
          
          // Execute the tool via callback
          const result = await onToolCall(functionName, functionArgs);
          results.push(result);
        }
      }

      // Get the assistant's text response
      const textResponse = assistantMessage.content || 'Done! I\'ve executed your command.';

      return {
        success: true,
        message: textResponse,
      };
    }

    // No tool calls, just text response
    return {
      success: true,
      message: assistantMessage.content || 'I understand, but I\'m not sure what to do. Can you be more specific?',
    };
  } catch (error) {
    console.error('[AI] Error processing command:', error);
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
    };
  }
}

/**
 * Generate a canvas state summary for AI context
 */
export function generateCanvasStateSummary(shapes: Shape[]): string {
  if (shapes.length === 0) {
    return 'Canvas is empty.';
  }

  const summary = shapes.map((shape, index) => {
    const base = `${index + 1}. ${shape.name} (ID: ${shape.id})`;
    
    if (shape.type === 'rectangle') {
      return `${base} - Rectangle at (${shape.x}, ${shape.y}), ${shape.width}x${shape.height}, fill: ${shape.fill}`;
    } else if (shape.type === 'circle') {
      return `${base} - Circle at (${shape.x}, ${shape.y}), radius: ${shape.radius}, fill: ${shape.fill}`;
    } else if (shape.type === 'text') {
      return `${base} - Text "${shape.text}" at (${shape.x}, ${shape.y}), font size: ${shape.fontSize}`;
    } else if (shape.type === 'line') {
      return `${base} - Line from (${shape.x1}, ${shape.y1}) to (${shape.x2}, ${shape.y2})`;
    }
    
    return base;
  });

  return `Current canvas (${shapes.length} shapes):\n${summary.join('\n')}`;
}

