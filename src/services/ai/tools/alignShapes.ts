/**
 * Align Shapes Tool
 * Handles shape alignment from AI commands
 */

import type { Shape, CanvasContextType } from '../../../types';
import type { AlignShapesParams } from '../types/toolTypes';
import { findShapeByName } from '../positionParser';

/**
 * Execute alignShapes tool call
 */
export async function executeAlignShapes(
  params: AlignShapesParams,
  canvasContext: CanvasContextType,
  shapes: Shape[],
  debugLog: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const targetShapes: Shape[] = [];
    const notFound: string[] = [];

    if (params.shapeIds && params.shapeIds.length > 0) {
      for (const id of params.shapeIds) {
        const shape = shapes.find(s => s.id === id);
        if (shape) targetShapes.push(shape); else notFound.push(id);
      }
    }
    if ((!params.shapeIds || params.shapeIds.length === 0) && params.shapeNames && params.shapeNames.length > 0) {
      for (const name of params.shapeNames) {
        const shape = findShapeByName(name, shapes);
        if (shape) targetShapes.push(shape); else notFound.push(name);
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
    if (notFound.length > 0) {
      debugLog.push(`[alignShapes] Warning: Could not find: ${notFound.join(', ')}`);
    }

    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to align shapes';
    debugLog.push(`[alignShapes] Error: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}

