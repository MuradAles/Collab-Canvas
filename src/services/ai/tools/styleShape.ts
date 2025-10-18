/**
 * Style Shape Tools
 * Handles shape color and style changes from AI commands
 */

import type { Shape, CanvasContextType } from '../../../types';
import type { ChangeShapeColorParams, ChangeShapeStyleParams } from '../types/toolTypes';
import { findShapeByName } from '../positionParser';
import { parseColor } from '../utils/colorParser';

/**
 * Execute changeShapeColor tool call
 */
export async function executeChangeShapeColor(
  params: ChangeShapeColorParams,
  canvasContext: CanvasContextType,
  shapes: Shape[],
  debugLog: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const shapeIds: string[] = [];
    const notFound: string[] = [];
    const color = parseColor(params.color);

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
      debugLog.push(`[changeShapeColor] Error: ${error}`);
      return { success: false, error };
    }

    // Update colors for all shapes
    for (const shapeId of shapeIds) {
      await canvasContext.updateShape(shapeId, { fill: color });
    }
    
    debugLog.push(`[changeShapeColor] Changed color of ${shapeIds.length} shape(s) to ${color}`);
    if (notFound.length > 0) {
      debugLog.push(`[changeShapeColor] Warning: Could not find: ${notFound.join(', ')}`);
    }

    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to change shape color';
    debugLog.push(`[changeShapeColor] Error: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}

/**
 * Execute changeShapeStyle tool call
 */
export async function executeChangeShapeStyle(
  params: ChangeShapeStyleParams,
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
    
    if (notFound.length > 0) {
      debugLog.push(`[changeShapeStyle] Warning: Could not find: ${notFound.join(', ')}`);
    }

    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to change shape style';
    debugLog.push(`[changeShapeStyle] Error: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}

