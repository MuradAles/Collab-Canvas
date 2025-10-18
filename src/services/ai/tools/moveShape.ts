/**
 * Move Shape Tool
 * Handles shape movement from AI commands
 */

import type { Shape, CanvasContextType } from '../../../types';
import type { MoveShapeParams } from '../types/toolTypes';
import { parsePosition, findShapeByName, type PositionViewportInfo } from '../positionParser';
import { CANVAS_BOUNDS } from '../../../utils/constants';

/**
 * Execute moveShape tool call
 */
export async function executeMoveShape(
  params: MoveShapeParams,
  canvasContext: CanvasContextType,
  shapes: Shape[],
  debugLog: string[],
  viewport?: PositionViewportInfo
): Promise<{ success: boolean; error?: string }> {
  try {
    // Find the shape by ID (preferred) or name
    const shape = (params.shapeId
      ? shapes.find(s => s.id === params.shapeId)
      : (params.shapeName ? findShapeByName(params.shapeName, shapes) : null));

    if (!shape) {
      const error = `Shape not found`;
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
    
    const positionResult = parsePosition(
      params.position,
      shapes,
      shapeWidth,
      shapeHeight,
      viewport,
      { forceWithinViewport: true, defaultToViewportCenter: false }
    );
    
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

