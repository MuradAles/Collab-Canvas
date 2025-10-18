/**
 * Layer Shape Tool
 * Handles shape z-index changes from AI commands
 */

import type { Shape, CanvasContextType } from '../../../types';
import type { ChangeLayerParams } from '../types/toolTypes';
import { findShapeByName } from '../positionParser';

/**
 * Execute changeLayer tool call
 */
export async function executeChangeLayer(
  params: ChangeLayerParams,
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

    if (targetShapes.length === 0) {
      const error = `Shape(s) not found`;
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

    if (notFound.length > 0) {
      debugLog.push(`[changeLayer] Warning: Could not find: ${notFound.join(', ')}`);
    }

    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to change layer';
    debugLog.push(`[changeLayer] Error: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}

