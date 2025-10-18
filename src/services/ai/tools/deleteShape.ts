/**
 * Delete Shape Tool
 * Handles shape deletion from AI commands
 */

import type { Shape, CanvasContextType } from '../../../types';
import type { DeleteShapeParams } from '../types/toolTypes';
import { findShapeByName } from '../positionParser';

/**
 * Execute deleteShape tool call
 */
export async function executeDeleteShape(
  params: DeleteShapeParams,
  canvasContext: CanvasContextType,
  shapes: Shape[],
  debugLog: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const shapeIds: string[] = [];
    const notFound: string[] = [];

    if (params.shapeIds && params.shapeIds.length > 0) {
      for (const id of params.shapeIds) {
        const shape = shapes.find(s => s.id === id);
        if (shape) shapeIds.push(shape.id); else notFound.push(id);
      }
    }

    if ((!params.shapeIds || params.shapeIds.length === 0) && params.shapeNames && params.shapeNames.length > 0) {
      for (const name of params.shapeNames) {
        const shape = findShapeByName(name, shapes);
        if (shape) shapeIds.push(shape.id); else notFound.push(name);
      }
    }

    if (shapeIds.length === 0) {
      const error = `Shape(s) not found`;
      debugLog.push(`[deleteShape] Error: ${error}`);
      return { success: false, error };
    }

    // Delete the shapes
    await canvasContext.deleteShapes(shapeIds);
    
    debugLog.push(`[deleteShape] Deleted ${shapeIds.length} shape(s)`);
    if (notFound.length > 0) {
      debugLog.push(`[deleteShape] Warning: Could not find: ${notFound.join(', ')}`);
    }

    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to delete shapes';
    debugLog.push(`[deleteShape] Error: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}

