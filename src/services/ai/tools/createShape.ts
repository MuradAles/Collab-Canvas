/**
 * Create Shape Tool
 * Handles shape creation from AI commands
 */

import type { Shape, CanvasContextType } from '../../../types';
import type { CreateShapeParams } from '../types/toolTypes';
import { parsePosition } from '../positionParser';
import { parseColor } from '../utils/colorParser';
import { DEFAULT_SHAPE_WIDTH, DEFAULT_SHAPE_HEIGHT, DEFAULT_TEXT_SIZE, CANVAS_BOUNDS } from '../../../utils/constants';

/**
 * Execute createShape tool call
 */
export async function executeCreateShape(
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
    const strokeColor = params.strokeColor ? parseColor(params.strokeColor) : '#000000';
    const strokeWidth = params.strokeWidth !== undefined ? Math.max(0, Math.min(20, params.strokeWidth)) : 2;

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
          stroke: strokeColor,
          strokeWidth,
          cornerRadius: params.cornerRadius !== undefined ? Math.max(0, Math.min(50, params.cornerRadius)) : 0,
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
          fill: params.color ? color : '#000000',
        };
        break;

      case 'line':
        shapeData = {
          type: 'line',
          x1: x,
          y1: y,
          x2: x + width,
          y2: y,
          stroke: params.strokeColor ? strokeColor : color,
          strokeWidth,
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

