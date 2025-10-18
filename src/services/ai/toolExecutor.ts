/**
 * Tool Executor
 * Executes AI tool calls on the canvas (create shapes, move shapes, query state)
 */

import type { Shape, CanvasContextType, User, ShapeType } from '../../types';
import type { ToolCall } from './openai';
import { parsePosition, findShapeByName, type PositionParameter } from './positionParser';
import { DEFAULT_SHAPE_WIDTH, DEFAULT_SHAPE_HEIGHT, DEFAULT_TEXT_SIZE, CANVAS_BOUNDS } from '../../utils/constants';

// ============================================================================
// Type Definitions
// ============================================================================

export interface ExecutionResult {
  success: boolean;
  message: string;
  debugLog: string[];
  createdShapeIds: string[];
  createdShapeNames: string[]; // NEW: Actual names of created shapes
  errors: string[];
}

interface CreateShapeParams {
  type: ShapeType;
  position: PositionParameter;
  size?: { width?: number; height?: number };
  color?: string;
  text?: string;
  fontSize?: number;
}

interface MoveShapeParams {
  shapeName: string;
  position: PositionParameter;
}

interface GetCanvasStateParams {
  filter?: 'all' | 'rectangles' | 'circles' | 'text' | 'lines';
}

interface DeleteShapeParams {
  shapeNames: string[];
}

interface ResizeShapeParams {
  shapeName: string;
  width?: number;
  height?: number;
  radius?: number;
}

interface RotateShapeParams {
  shapeName: string;
  angle: number;
}

interface ChangeShapeColorParams {
  shapeNames: string[];
  color: string;
}

interface AlignShapesParams {
  shapeNames: string[];
  alignment: 'left' | 'right' | 'center-horizontal' | 'top' | 'bottom' | 'center-vertical';
}

interface ChangeLayerParams {
  shapeNames: string[];
  action: 'bring-to-front' | 'send-to-back' | 'bring-forward' | 'send-backward';
}

interface ChangeShapeStyleParams {
  shapeNames: string[];
  strokeColor?: string;
  strokeWidth?: number;
  cornerRadius?: number;
  lineCap?: 'butt' | 'round' | 'square';
}

// ============================================================================
// Color Name to Hex Mapping
// ============================================================================

const COLOR_MAP: Record<string, string> = {
  'red': '#EF4444',
  'blue': '#3B82F6',
  'green': '#10B981',
  'yellow': '#FBBF24',
  'purple': '#A855F7',
  'orange': '#F97316',
  'pink': '#EC4899',
  'gray': '#6B7280',
  'grey': '#6B7280',
  'black': '#000000',
  'white': '#FFFFFF',
  'cyan': '#06B6D4',
  'lime': '#84CC16',
  'indigo': '#6366F1',
  'teal': '#14B8A6',
  'amber': '#F59E0B',
};

const DEFAULT_COLOR = '#94A3B8'; // slate-400

// ============================================================================
// Main Execution Function
// ============================================================================

/**
 * Execute all tool calls from AI response
 */
export async function executeToolCalls(
  toolCalls: ToolCall[],
  canvasContext: CanvasContextType,
  _currentUser: User,
  shapes: Shape[]
): Promise<ExecutionResult> {
  const debugLog: string[] = [];
  const errors: string[] = [];
  const createdShapeIds: string[] = [];
  const createdShapeNames: string[] = []; // NEW: Track actual shape names
  
  if (toolCalls.length === 0) {
    return {
      success: false,
      message: 'No actions to execute',
      debugLog: ['[Executor] No tool calls provided'],
      createdShapeIds: [],
      createdShapeNames: [],
      errors: ['No tool calls to execute'],
    };
  }

  debugLog.push(`[Executor] Executing ${toolCalls.length} tool call(s)`);

  // Determine execution strategy
  const shouldExecuteSequentially = toolCalls.length >= 4;
  const delay = toolCalls.length >= 11 ? 50 : 100;

  let successCount = 0;
  const initialShapeCount = canvasContext.shapes.length;

  for (let i = 0; i < toolCalls.length; i++) {
    const toolCall = toolCalls[i];
    
    try {
      const params = JSON.parse(toolCall.function.arguments);
      debugLog.push(`[Tool ${i + 1}/${toolCalls.length}] ${toolCall.function.name}(${JSON.stringify(params)})`);

      switch (toolCall.function.name) {
        case 'createShape': {
          const result = await executeCreateShape(params, canvasContext, shapes, debugLog);
          if (result.shapeId) {
            createdShapeIds.push(result.shapeId);
            successCount++;
          } else if (result.error) {
            errors.push(result.error);
          }
          break;
        }

        case 'moveShape': {
          const result = await executeMoveShape(params, canvasContext, shapes, debugLog);
          if (result.success) {
            successCount++;
          } else if (result.error) {
            errors.push(result.error);
          }
          break;
        }

        case 'getCanvasState': {
          const result = executeGetCanvasState(params, shapes, debugLog);
          debugLog.push(result.message);
          // Store the query result to be included in the final message
          errors.push(`[Query Result] ${result.message}`);
          successCount++;
          break;
        }

        case 'deleteShape': {
          const result = await executeDeleteShape(params, canvasContext, shapes, debugLog);
          if (result.success) {
            successCount++;
          } else if (result.error) {
            errors.push(result.error);
          }
          break;
        }

        case 'resizeShape': {
          const result = await executeResizeShape(params, canvasContext, shapes, debugLog);
          if (result.success) {
            successCount++;
          } else if (result.error) {
            errors.push(result.error);
          }
          break;
        }

        case 'rotateShape': {
          const result = await executeRotateShape(params, canvasContext, shapes, debugLog);
          if (result.success) {
            successCount++;
          } else if (result.error) {
            errors.push(result.error);
          }
          break;
        }

        case 'changeShapeColor': {
          const result = await executeChangeShapeColor(params, canvasContext, shapes, debugLog);
          if (result.success) {
            successCount++;
          } else if (result.error) {
            errors.push(result.error);
          }
          break;
        }

        case 'alignShapes': {
          const result = await executeAlignShapes(params, canvasContext, shapes, debugLog);
          if (result.success) {
            successCount++;
          } else if (result.error) {
            errors.push(result.error);
          }
          break;
        }

        case 'changeLayer': {
          const result = await executeChangeLayer(params, canvasContext, shapes, debugLog);
          if (result.success) {
            successCount++;
          } else if (result.error) {
            errors.push(result.error);
          }
          break;
        }

        case 'changeShapeStyle': {
          const result = await executeChangeShapeStyle(params, canvasContext, shapes, debugLog);
          if (result.success) {
            successCount++;
          } else if (result.error) {
            errors.push(result.error);
          }
          break;
        }

        default:
          debugLog.push(`[Warning] Unknown tool: ${toolCall.function.name}`);
          errors.push(`Unknown tool: ${toolCall.function.name}`);
      }

      // Add delay for sequential execution
      if (shouldExecuteSequentially && i < toolCalls.length - 1) {
        await sleep(delay);
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      debugLog.push(`[Error] ${errorMsg}`);
      errors.push(errorMsg);
    }
  }

  // If we created shapes, wait for Firestore to sync and get their actual names
  if (createdShapeIds.length > 0) {
    debugLog.push(`[Executor] Waiting for Firestore to sync ${createdShapeIds.length} new shape(s)...`);
    
    // Retry logic: Try up to 3 times with increasing delays
    let newShapeCount = 0;
    for (let attempt = 0; attempt < 3; attempt++) {
      const waitTime = 500 + (attempt * 300); // 500ms, 800ms, 1100ms
      await sleep(waitTime);
      
      const currentShapes = canvasContext.shapes;
      newShapeCount = currentShapes.length - initialShapeCount;
      
      if (newShapeCount >= createdShapeIds.length) {
        // Got all shapes!
        debugLog.push(`[Executor] Shapes synced after ${attempt + 1} attempt(s)`);
        break;
      }
      
      if (attempt < 2) {
        debugLog.push(`[Executor] Attempt ${attempt + 1}: Found ${newShapeCount}/${createdShapeIds.length} shapes, retrying...`);
      }
    }
    
    // Get the newly created shapes (they'll have the highest zIndexes)
    const currentShapes = canvasContext.shapes;
    newShapeCount = currentShapes.length - initialShapeCount;
    
    if (newShapeCount > 0) {
      // Sort by zIndex descending and take the newest shapes
      const newestShapes = [...currentShapes]
        .sort((a, b) => b.zIndex - a.zIndex)
        .slice(0, Math.min(newShapeCount, createdShapeIds.length));
      
      // Reverse to get them in creation order
      newestShapes.reverse();
      
      // Extract names
      newestShapes.forEach(shape => {
        createdShapeNames.push(shape.name);
      });
      
      debugLog.push(`[Executor] Retrieved ${createdShapeNames.length} shape names: ${createdShapeNames.join(', ')}`);
      
      if (createdShapeNames.length < createdShapeIds.length) {
        debugLog.push(`[Executor] Warning: Only ${createdShapeNames.length}/${createdShapeIds.length} shapes synced`);
      }
    } else {
      debugLog.push(`[Executor] Warning: Shapes not synced after retries. AI may not know the new shape names.`);
    }
  }

  // Generate user-friendly success message
  const message = generateSuccessMessage(toolCalls, successCount, errors);

  // Extract query results from errors array (they were marked with [Query Result])
  const queryResults = errors.filter(e => e.startsWith('[Query Result]')).map(e => e.replace('[Query Result] ', ''));
  const actualErrors = errors.filter(e => !e.startsWith('[Query Result]'));

  return {
    success: successCount > 0,
    message: queryResults.length > 0 ? queryResults.join('\n') : message,
    debugLog,
    createdShapeIds,
    createdShapeNames, // Include actual shape names
    errors: actualErrors,
  };
}

// ============================================================================
// Tool Execution Functions
// ============================================================================

/**
 * Execute createShape tool call
 */
async function executeCreateShape(
  params: CreateShapeParams,
  canvasContext: CanvasContextType,
  shapes: Shape[],
  debugLog: string[]
): Promise<{ shapeId: string | null; error?: string }> {
  try {
    // Parse position
    const width = params.size?.width || DEFAULT_SHAPE_WIDTH;
    const height = params.size?.height || DEFAULT_SHAPE_HEIGHT;
    
    const positionResult = parsePosition(params.position, shapes, width, height);
    
    if (!positionResult.position) {
      const error = positionResult.error || 'Invalid position';
      debugLog.push(`[createShape] Error: ${error}`);
      return { shapeId: null, error };
    }

    const { x, y } = positionResult.position;
    const color = parseColor(params.color);

    // Build shape data based on type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let shapeData: any = {
      type: params.type,
      x,
      y,
      rotation: 0,
      zIndex: shapes.length,
    };

    switch (params.type) {
      case 'rectangle':
        shapeData = {
          ...shapeData,
          width,
          height,
          fill: color,
          stroke: '#000000',
          strokeWidth: 2,
          cornerRadius: 0,
        };
        break;

      case 'circle': {
        const radius = width / 2;
        // For circles, x,y is the CENTER, so we need to ensure center is at least radius away from edges
        const minPos = radius;
        const maxPosX = CANVAS_BOUNDS.MAX_X - radius;
        const maxPosY = CANVAS_BOUNDS.MAX_Y - radius;
        const safeX = Math.max(minPos, Math.min(maxPosX, x));
        const safeY = Math.max(minPos, Math.min(maxPosY, y));
        
        shapeData = {
          ...shapeData,
          x: safeX,
          y: safeY,
          radius,
          fill: color,
          stroke: '#000000',
          strokeWidth: 2,
        };
        break;
      }

      case 'text':
        shapeData = {
          ...shapeData,
          text: params.text || 'Text',
          fontSize: params.fontSize || DEFAULT_TEXT_SIZE,
          fontFamily: 'Arial',
          fill: '#000000',
        };
        break;

      case 'line':
        shapeData = {
          type: 'line',
          x1: x,
          y1: y,
          x2: x + width,
          y2: y,
          stroke: color,
          strokeWidth: 2,
          lineCap: 'round' as const,
          rotation: 0,
          zIndex: shapes.length,
        };
        // Lines don't have x, y, rotation
        delete shapeData.x;
        delete shapeData.y;
        delete shapeData.rotation;
        break;

      default:
        return { shapeId: null, error: `Unknown shape type: ${params.type}` };
    }

    // Create shape in Firestore (name will be auto-generated)
    // Skip auto-lock and auto-select for AI-created shapes
    await canvasContext.addShape(shapeData, { skipAutoLock: true });
    
    debugLog.push(`[createShape] Created ${params.type} at (${x}, ${y})`);
    
    return { shapeId: 'created' };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to create shape';
    debugLog.push(`[createShape] Error: ${errorMsg}`);
    return { shapeId: null, error: errorMsg };
  }
}

/**
 * Execute moveShape tool call
 */
async function executeMoveShape(
  params: MoveShapeParams,
  canvasContext: CanvasContextType,
  shapes: Shape[],
  debugLog: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    // Find the shape by name
    const shape = shapes.find(s => 
      s.name.toLowerCase() === params.shapeName.toLowerCase()
    );

    if (!shape) {
      const error = `Shape not found: ${params.shapeName}`;
      debugLog.push(`[moveShape] ${error}`);
      return { success: false, error };
    }

    // Check if shape is locked by another user
    if (shape.isLocked) {
      const error = `Cannot move ${shape.name} (locked by ${shape.lockedByName})`;
      debugLog.push(`[moveShape] ${error}`);
      return { success: false, error };
    }

    // Parse new position
    let shapeWidth = 'width' in shape ? shape.width : 100;
    let shapeHeight = 'height' in shape ? shape.height : 100;
    
    // For circles, use radius for bounds checking
    if (shape.type === 'circle') {
      const radius = shape.radius;
      shapeWidth = radius * 2;
      shapeHeight = radius * 2;
    }
    
    const positionResult = parsePosition(params.position, shapes, shapeWidth, shapeHeight);
    
    if (!positionResult.position) {
      const error = positionResult.error || 'Invalid position';
      debugLog.push(`[moveShape] Error: ${error}`);
      return { success: false, error };
    }

    let { x, y } = positionResult.position;
    
    // For circles, ensure the center is at least radius away from edges
    if (shape.type === 'circle') {
      const radius = shape.radius;
      x = Math.max(radius, Math.min(CANVAS_BOUNDS.MAX_X - radius, x));
      y = Math.max(radius, Math.min(CANVAS_BOUNDS.MAX_Y - radius, y));
    }

    // Update shape position
    if (shape.type === 'line') {
      // For lines, need to move both endpoints and keep them within bounds
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lineShape = shape as any;
      const currentCenterX = (lineShape.x1 + lineShape.x2) / 2;
      const currentCenterY = (lineShape.y1 + lineShape.y2) / 2;
      const dx = x - currentCenterX;
      const dy = y - currentCenterY;
      
      // Calculate new endpoints
      let newX1 = lineShape.x1 + dx;
      let newY1 = lineShape.y1 + dy;
      let newX2 = lineShape.x2 + dx;
      let newY2 = lineShape.y2 + dy;
      
      // Clamp both endpoints to canvas bounds
      newX1 = Math.max(CANVAS_BOUNDS.MIN_X, Math.min(CANVAS_BOUNDS.MAX_X, newX1));
      newY1 = Math.max(CANVAS_BOUNDS.MIN_Y, Math.min(CANVAS_BOUNDS.MAX_Y, newY1));
      newX2 = Math.max(CANVAS_BOUNDS.MIN_X, Math.min(CANVAS_BOUNDS.MAX_X, newX2));
      newY2 = Math.max(CANVAS_BOUNDS.MIN_Y, Math.min(CANVAS_BOUNDS.MAX_Y, newY2));
      
      await canvasContext.updateShape(shape.id, {
        x1: newX1,
        y1: newY1,
        x2: newX2,
        y2: newY2,
      });
      
      debugLog.push(`[moveShape] Moved ${shape.name} (line) from (${lineShape.x1},${lineShape.y1})-(${lineShape.x2},${lineShape.y2}) to (${newX1},${newY1})-(${newX2},${newY2})`);
    } else {
      await canvasContext.updateShape(shape.id, { x, y });
      debugLog.push(`[moveShape] Moved ${shape.name} to (${x}, ${y})`);
    }

    return { success: true };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to move shape';
    debugLog.push(`[moveShape] Error: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}

/**
 * Execute getCanvasState tool call
 */
function executeGetCanvasState(
  params: GetCanvasStateParams,
  shapes: Shape[],
  debugLog: string[]
): { message: string } {
  const filter = params.filter || 'all';
  
  let filteredShapes = shapes;
  if (filter !== 'all') {
    const typeMap: Record<string, ShapeType> = {
      'rectangles': 'rectangle',
      'circles': 'circle',
      'text': 'text',
      'lines': 'line',
    };
    const targetType = typeMap[filter];
    filteredShapes = shapes.filter(s => s.type === targetType);
  }

  debugLog.push(`[getCanvasState] Found ${filteredShapes.length} shapes (filter: ${filter})`);

  const shapeList = filteredShapes.map(s => {
    const locked = s.isLocked ? ` (locked by ${s.lockedByName})` : '';
    if (s.type === 'line') {
      return `${s.name}: Line${locked}`;
    }
    if (s.type === 'circle') {
      return `${s.name}: Circle at (${s.x}, ${s.y})${locked}`;
    }
    if (s.type === 'text') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return `${s.name}: "${(s as any).text}" at (${s.x}, ${s.y})${locked}`;
    }
    return `${s.name}: Rectangle at (${s.x}, ${s.y})${locked}`;
  }).join(', ');

  return {
    message: filteredShapes.length === 0 
      ? `No ${filter} shapes found on canvas`
      : `Found ${filteredShapes.length} ${filter}: ${shapeList}`,
  };
}

/**
 * Execute deleteShape tool call
 */
async function executeDeleteShape(
  params: DeleteShapeParams,
  canvasContext: CanvasContextType,
  shapes: Shape[],
  debugLog: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const shapeIds: string[] = [];
    const notFoundShapes: string[] = [];

    // Find all shapes by name
    for (const shapeName of params.shapeNames) {
      const shape = findShapeByName(shapeName, shapes);
      if (shape) {
        shapeIds.push(shape.id);
      } else {
        notFoundShapes.push(shapeName);
      }
    }

    if (shapeIds.length === 0) {
      const error = `Shape(s) not found: ${params.shapeNames.join(', ')}`;
      debugLog.push(`[deleteShape] Error: ${error}`);
      return { success: false, error };
    }

    // Delete the shapes
    await canvasContext.deleteShapes(shapeIds);
    
    debugLog.push(`[deleteShape] Deleted ${shapeIds.length} shape(s)`);
    if (notFoundShapes.length > 0) {
      debugLog.push(`[deleteShape] Warning: Could not find: ${notFoundShapes.join(', ')}`);
    }

    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to delete shapes';
    debugLog.push(`[deleteShape] Error: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}

/**
 * Execute resizeShape tool call
 */
async function executeResizeShape(
  params: ResizeShapeParams,
  canvasContext: CanvasContextType,
  shapes: Shape[],
  debugLog: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const shape = findShapeByName(params.shapeName, shapes);
    if (!shape) {
      const error = `Shape not found: ${params.shapeName}`;
      debugLog.push(`[resizeShape] Error: ${error}`);
      return { success: false, error };
    }

    // Build updates based on shape type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: any = {};

    if (shape.type === 'rectangle') {
      if (params.width !== undefined) updates.width = Math.max(10, params.width);
      if (params.height !== undefined) updates.height = Math.max(10, params.height);
    } else if (shape.type === 'circle') {
      if (params.radius !== undefined) updates.radius = Math.max(5, params.radius);
    } else if (shape.type === 'line') {
      const error = 'Lines cannot be resized. Use moveShape to change their endpoints.';
      debugLog.push(`[resizeShape] Error: ${error}`);
      return { success: false, error };
    } else if (shape.type === 'text') {
      const error = 'Text shapes cannot be resized. Change fontSize instead.';
      debugLog.push(`[resizeShape] Error: ${error}`);
      return { success: false, error };
    }

    if (Object.keys(updates).length === 0) {
      const error = 'No valid resize parameters provided';
      debugLog.push(`[resizeShape] Error: ${error}`);
      return { success: false, error };
    }

    await canvasContext.updateShape(shape.id, updates);
    
    debugLog.push(`[resizeShape] Resized ${params.shapeName}: ${JSON.stringify(updates)}`);
    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to resize shape';
    debugLog.push(`[resizeShape] Error: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}

/**
 * Execute rotateShape tool call
 */
async function executeRotateShape(
  params: RotateShapeParams,
  canvasContext: CanvasContextType,
  shapes: Shape[],
  debugLog: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const shape = findShapeByName(params.shapeName, shapes);
    if (!shape) {
      const error = `Shape not found: ${params.shapeName}`;
      debugLog.push(`[rotateShape] Error: ${error}`);
      return { success: false, error };
    }

    if (shape.type !== 'rectangle' && shape.type !== 'line') {
      const error = `Shape type ${shape.type} cannot be rotated. Only rectangles and lines support rotation.`;
      debugLog.push(`[rotateShape] Error: ${error}`);
      return { success: false, error };
    }

    // Normalize angle to 0-360 range
    const normalizedAngle = params.angle % 360;
    
    await canvasContext.updateShape(shape.id, { rotation: normalizedAngle });
    
    debugLog.push(`[rotateShape] Rotated ${params.shapeName} to ${normalizedAngle}°`);
    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to rotate shape';
    debugLog.push(`[rotateShape] Error: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}

/**
 * Execute changeShapeColor tool call
 */
async function executeChangeShapeColor(
  params: ChangeShapeColorParams,
  canvasContext: CanvasContextType,
  shapes: Shape[],
  debugLog: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const shapeIds: string[] = [];
    const notFoundShapes: string[] = [];
    const color = parseColor(params.color);

    // Find all shapes by name
    for (const shapeName of params.shapeNames) {
      const shape = findShapeByName(shapeName, shapes);
      if (shape) {
        shapeIds.push(shape.id);
      } else {
        notFoundShapes.push(shapeName);
      }
    }

    if (shapeIds.length === 0) {
      const error = `Shape(s) not found: ${params.shapeNames.join(', ')}`;
      debugLog.push(`[changeShapeColor] Error: ${error}`);
      return { success: false, error };
    }

    // Update colors for all shapes
    for (const shapeId of shapeIds) {
      await canvasContext.updateShape(shapeId, { fill: color });
    }
    
    debugLog.push(`[changeShapeColor] Changed color of ${shapeIds.length} shape(s) to ${color}`);
    if (notFoundShapes.length > 0) {
      debugLog.push(`[changeShapeColor] Warning: Could not find: ${notFoundShapes.join(', ')}`);
    }

    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to change shape color';
    debugLog.push(`[changeShapeColor] Error: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}

/**
 * Execute alignShapes tool call
 */
async function executeAlignShapes(
  params: AlignShapesParams,
  canvasContext: CanvasContextType,
  shapes: Shape[],
  debugLog: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const targetShapes: Shape[] = [];
    const notFoundShapes: string[] = [];

    // Find all shapes by name
    for (const shapeName of params.shapeNames) {
      const shape = findShapeByName(shapeName, shapes);
      if (shape) {
        targetShapes.push(shape);
      } else {
        notFoundShapes.push(shapeName);
      }
    }

    if (targetShapes.length < 2) {
      const error = 'Need at least 2 shapes to align';
      debugLog.push(`[alignShapes] Error: ${error}`);
      return { success: false, error };
    }

    // Calculate alignment coordinate
    let alignCoord: number;
    
    switch (params.alignment) {
      case 'left': {
        const shapesWithX = targetShapes.filter(s => s.type !== 'line');
        if (shapesWithX.length === 0) {
          const error = 'Cannot align lines horizontally';
          debugLog.push(`[alignShapes] Error: ${error}`);
          return { success: false, error };
        }
        alignCoord = Math.min(...shapesWithX.map(s => s.x));
        for (const shape of shapesWithX) {
          await canvasContext.updateShape(shape.id, { x: alignCoord });
        }
        break;
      }
        
      case 'right': {
        const shapesWithX = targetShapes.filter(s => s.type !== 'line');
        if (shapesWithX.length === 0) {
          const error = 'Cannot align lines horizontally';
          debugLog.push(`[alignShapes] Error: ${error}`);
          return { success: false, error };
        }
        alignCoord = Math.max(...shapesWithX.map(s => {
          if (s.type === 'rectangle') return s.x + s.width;
          if (s.type === 'circle') return s.x + s.radius;
          return s.x;
        }));
        for (const shape of shapesWithX) {
          let newX = alignCoord;
          if (shape.type === 'rectangle') newX -= shape.width;
          if (shape.type === 'circle') newX -= shape.radius;
          await canvasContext.updateShape(shape.id, { x: newX });
        }
        break;
      }
        
      case 'center-horizontal': {
        const shapesWithX = targetShapes.filter(s => s.type !== 'line');
        if (shapesWithX.length === 0) {
          const error = 'Cannot align lines horizontally';
          debugLog.push(`[alignShapes] Error: ${error}`);
          return { success: false, error };
        }
        const avgX = shapesWithX.reduce((sum, s) => sum + s.x, 0) / shapesWithX.length;
        for (const shape of shapesWithX) {
          await canvasContext.updateShape(shape.id, { x: avgX });
        }
        break;
      }
        
      case 'top': {
        const shapesWithY = targetShapes.filter(s => s.type !== 'line');
        if (shapesWithY.length === 0) {
          const error = 'Cannot align lines vertically';
          debugLog.push(`[alignShapes] Error: ${error}`);
          return { success: false, error };
        }
        alignCoord = Math.min(...shapesWithY.map(s => s.y));
        for (const shape of shapesWithY) {
          await canvasContext.updateShape(shape.id, { y: alignCoord });
        }
        break;
      }
        
      case 'bottom': {
        const shapesWithY = targetShapes.filter(s => s.type !== 'line');
        if (shapesWithY.length === 0) {
          const error = 'Cannot align lines vertically';
          debugLog.push(`[alignShapes] Error: ${error}`);
          return { success: false, error };
        }
        alignCoord = Math.max(...shapesWithY.map(s => {
          if (s.type === 'rectangle') return s.y + s.height;
          if (s.type === 'circle') return s.y + s.radius;
          return s.y;
        }));
        for (const shape of shapesWithY) {
          let newY = alignCoord;
          if (shape.type === 'rectangle') newY -= shape.height;
          if (shape.type === 'circle') newY -= shape.radius;
          await canvasContext.updateShape(shape.id, { y: newY });
        }
        break;
      }
        
      case 'center-vertical': {
        const shapesWithY = targetShapes.filter(s => s.type !== 'line');
        if (shapesWithY.length === 0) {
          const error = 'Cannot align lines vertically';
          debugLog.push(`[alignShapes] Error: ${error}`);
          return { success: false, error };
        }
        const avgY = shapesWithY.reduce((sum, s) => sum + s.y, 0) / shapesWithY.length;
        for (const shape of shapesWithY) {
          await canvasContext.updateShape(shape.id, { y: avgY });
        }
        break;
      }
    }
    
    debugLog.push(`[alignShapes] Aligned ${targetShapes.length} shapes: ${params.alignment}`);
    if (notFoundShapes.length > 0) {
      debugLog.push(`[alignShapes] Warning: Could not find: ${notFoundShapes.join(', ')}`);
    }

    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to align shapes';
    debugLog.push(`[alignShapes] Error: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}

/**
 * Execute changeLayer tool call
 */
async function executeChangeLayer(
  params: ChangeLayerParams,
  canvasContext: CanvasContextType,
  shapes: Shape[],
  debugLog: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const targetShapes: Shape[] = [];
    const notFoundShapes: string[] = [];

    // Find all shapes by name
    for (const shapeName of params.shapeNames) {
      const shape = findShapeByName(shapeName, shapes);
      if (shape) {
        targetShapes.push(shape);
      } else {
        notFoundShapes.push(shapeName);
      }
    }

    if (targetShapes.length === 0) {
      const error = `Shape(s) not found: ${params.shapeNames.join(', ')}`;
      debugLog.push(`[changeLayer] Error: ${error}`);
      return { success: false, error };
    }

    // Get all shapes sorted by zIndex
    const allShapes = [...shapes].sort((a, b) => a.zIndex - b.zIndex);
    const maxZIndex = allShapes[allShapes.length - 1]?.zIndex || 0;
    const minZIndex = allShapes[0]?.zIndex || 0;

    switch (params.action) {
      case 'bring-to-front':
        // Move all target shapes to the top
        for (const shape of targetShapes) {
          await canvasContext.updateShape(shape.id, { zIndex: maxZIndex + 1 });
        }
        debugLog.push(`[changeLayer] Brought ${targetShapes.length} shape(s) to front`);
        break;

      case 'send-to-back':
        // Move all target shapes to the bottom
        for (const shape of targetShapes) {
          await canvasContext.updateShape(shape.id, { zIndex: minZIndex - 1 });
        }
        debugLog.push(`[changeLayer] Sent ${targetShapes.length} shape(s) to back`);
        break;

      case 'bring-forward':
        // Move each shape up one layer
        for (const shape of targetShapes) {
          // Find the shape immediately above this one
          const currentIndex = allShapes.findIndex(s => s.id === shape.id);
          if (currentIndex < allShapes.length - 1) {
            const shapeAbove = allShapes[currentIndex + 1];
            await canvasContext.updateShape(shape.id, { zIndex: shapeAbove.zIndex + 1 });
          } else {
            // Already at the top
            debugLog.push(`[changeLayer] ${shape.name} already at top`);
          }
        }
        debugLog.push(`[changeLayer] Moved ${targetShapes.length} shape(s) forward`);
        break;

      case 'send-backward':
        // Move each shape down one layer
        for (const shape of targetShapes) {
          // Find the shape immediately below this one
          const currentIndex = allShapes.findIndex(s => s.id === shape.id);
          if (currentIndex > 0) {
            const shapeBelow = allShapes[currentIndex - 1];
            await canvasContext.updateShape(shape.id, { zIndex: shapeBelow.zIndex - 1 });
          } else {
            // Already at the bottom
            debugLog.push(`[changeLayer] ${shape.name} already at bottom`);
          }
        }
        debugLog.push(`[changeLayer] Moved ${targetShapes.length} shape(s) backward`);
        break;
    }

    if (notFoundShapes.length > 0) {
      debugLog.push(`[changeLayer] Warning: Could not find: ${notFoundShapes.join(', ')}`);
    }

    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to change layer';
    debugLog.push(`[changeLayer] Error: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}

/**
 * Execute changeShapeStyle tool call
 */
async function executeChangeShapeStyle(
  params: ChangeShapeStyleParams,
  canvasContext: CanvasContextType,
  shapes: Shape[],
  debugLog: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const targetShapes: Shape[] = [];
    const notFoundShapes: string[] = [];

    // Find all shapes by name
    for (const shapeName of params.shapeNames) {
      const shape = findShapeByName(shapeName, shapes);
      if (shape) {
        targetShapes.push(shape);
      } else {
        notFoundShapes.push(shapeName);
      }
    }

    if (targetShapes.length === 0) {
      const error = `Shape(s) not found: ${params.shapeNames.join(', ')}`;
      debugLog.push(`[changeShapeStyle] Error: ${error}`);
      return { success: false, error };
    }

    // Build updates object based on provided parameters
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: any = {};

    if (params.strokeColor !== undefined) {
      updates.stroke = parseColor(params.strokeColor);
    }

    if (params.strokeWidth !== undefined) {
      updates.strokeWidth = Math.max(0, Math.min(20, params.strokeWidth));
    }

    if (params.cornerRadius !== undefined) {
      updates.cornerRadius = Math.max(0, Math.min(50, params.cornerRadius));
    }

    if (params.lineCap !== undefined) {
      updates.lineCap = params.lineCap;
    }

    if (Object.keys(updates).length === 0) {
      const error = 'No valid style parameters provided';
      debugLog.push(`[changeShapeStyle] Error: ${error}`);
      return { success: false, error };
    }

    // Apply styles to all target shapes
    let updatedCount = 0;
    for (const shape of targetShapes) {
      // Filter updates based on shape type
      const shapeSpecificUpdates: {
        stroke?: string;
        strokeWidth?: number;
        cornerRadius?: number;
        lineCap?: 'butt' | 'round' | 'square';
      } = {};

      // All shapes can have stroke and strokeWidth
      if (updates.stroke !== undefined) shapeSpecificUpdates.stroke = updates.stroke;
      if (updates.strokeWidth !== undefined) shapeSpecificUpdates.strokeWidth = updates.strokeWidth;

      // Only rectangles can have corner radius
      if (shape.type === 'rectangle' && updates.cornerRadius !== undefined) {
        shapeSpecificUpdates.cornerRadius = updates.cornerRadius;
      }

      // Only lines can have lineCap
      if (shape.type === 'line' && updates.lineCap !== undefined) {
        shapeSpecificUpdates.lineCap = updates.lineCap;
      }

      if (Object.keys(shapeSpecificUpdates).length > 0) {
        await canvasContext.updateShape(shape.id, shapeSpecificUpdates);
        updatedCount++;
      }
    }

    debugLog.push(`[changeShapeStyle] Updated ${updatedCount} shape(s): ${JSON.stringify(updates)}`);
    
    if (notFoundShapes.length > 0) {
      debugLog.push(`[changeShapeStyle] Warning: Could not find: ${notFoundShapes.join(', ')}`);
    }

    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to change shape style';
    debugLog.push(`[changeShapeStyle] Error: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parse color name or hex code
 */
function parseColor(color?: string): string {
  if (!color) return DEFAULT_COLOR;
  
  const normalized = color.toLowerCase().trim();
  
  // Check if it's a known color name
  if (COLOR_MAP[normalized]) {
    return COLOR_MAP[normalized];
  }
  
  // Check if it's already a hex code
  if (/^#[0-9A-F]{6}$/i.test(color)) {
    return color;
  }
  
  return DEFAULT_COLOR;
}

/**
 * Sleep utility for sequential execution
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate user-friendly success message
 */
function generateSuccessMessage(
  toolCalls: ToolCall[],
  successCount: number,
  errors: string[]
): string {
  if (successCount === 0) {
    return errors.length > 0 
      ? `❌ Failed: ${errors[0]}`
      : '❌ No actions completed';
  }

  const createCalls = toolCalls.filter(tc => tc.function.name === 'createShape');
  const moveCalls = toolCalls.filter(tc => tc.function.name === 'moveShape');
  const queryCalls = toolCalls.filter(tc => tc.function.name === 'getCanvasState');
  const deleteCalls = toolCalls.filter(tc => tc.function.name === 'deleteShape');
  const resizeCalls = toolCalls.filter(tc => tc.function.name === 'resizeShape');
  const rotateCalls = toolCalls.filter(tc => tc.function.name === 'rotateShape');
  const colorCalls = toolCalls.filter(tc => tc.function.name === 'changeShapeColor');
  const alignCalls = toolCalls.filter(tc => tc.function.name === 'alignShapes');
  const layerCalls = toolCalls.filter(tc => tc.function.name === 'changeLayer');
  const styleCalls = toolCalls.filter(tc => tc.function.name === 'changeShapeStyle');

  const parts: string[] = [];
  
  if (createCalls.length > 0) {
    parts.push(`Created ${createCalls.length} shape${createCalls.length > 1 ? 's' : ''}`);
  }
  
  if (moveCalls.length > 0) {
    parts.push(`Moved ${moveCalls.length} shape${moveCalls.length > 1 ? 's' : ''}`);
  }
  
  if (deleteCalls.length > 0) {
    // Count actual shapes from parameters
    const totalDeleted = deleteCalls.reduce((sum, call) => {
      try {
        const params = JSON.parse(call.function.arguments);
        return sum + (params.shapeNames?.length || 0);
      } catch {
        return sum + 1;
      }
    }, 0);
    parts.push(`Deleted ${totalDeleted} shape${totalDeleted > 1 ? 's' : ''}`);
  }
  
  if (resizeCalls.length > 0) {
    parts.push(`Resized ${resizeCalls.length} shape${resizeCalls.length > 1 ? 's' : ''}`);
  }
  
  if (rotateCalls.length > 0) {
    parts.push(`Rotated ${rotateCalls.length} shape${rotateCalls.length > 1 ? 's' : ''}`);
  }
  
  if (colorCalls.length > 0) {
    // Count actual shapes from parameters
    const totalRecolored = colorCalls.reduce((sum, call) => {
      try {
        const params = JSON.parse(call.function.arguments);
        return sum + (params.shapeNames?.length || 0);
      } catch {
        return sum + 1;
      }
    }, 0);
    parts.push(`Recolored ${totalRecolored} shape${totalRecolored > 1 ? 's' : ''}`);
  }
  
  if (alignCalls.length > 0) {
    parts.push(`Aligned shapes`);
  }
  
  if (layerCalls.length > 0) {
    parts.push(`Changed layers`);
  }
  
  if (styleCalls.length > 0) {
    // Count actual shapes from parameters
    const totalStyled = styleCalls.reduce((sum, call) => {
      try {
        const params = JSON.parse(call.function.arguments);
        return sum + (params.shapeNames?.length || 0);
      } catch {
        return sum + 1;
      }
    }, 0);
    parts.push(`Styled ${totalStyled} shape${totalStyled > 1 ? 's' : ''}`);
  }
  
  if (queryCalls.length > 0) {
    parts.push(`Queried canvas`);
  }

  let message = `✓ ${parts.join(', ')}`;
  
  if (errors.length > 0) {
    message += ` (${errors.length} error${errors.length > 1 ? 's' : ''})`;
  }

  return message;
}

