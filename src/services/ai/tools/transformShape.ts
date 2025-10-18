/**
 * Transform Shape Tools
 * Handles shape resizing and rotation from AI commands
 */

import type { Shape, CanvasContextType } from '../../../types';
import type { ResizeShapeParams, RotateShapeParams } from '../types/toolTypes';
import { findShapeByName } from '../positionParser';

/**
 * Execute resizeShape tool call
 */
export async function executeResizeShape(
  params: ResizeShapeParams,
  canvasContext: CanvasContextType,
  shapes: Shape[],
  debugLog: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const shape = params.shapeId
      ? shapes.find(s => s.id === params.shapeId)
      : (params.shapeName ? findShapeByName(params.shapeName, shapes) : null);
    if (!shape) {
      const error = `Shape not found`;
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
    
    debugLog.push(`[resizeShape] Resized ${shape.name}: ${JSON.stringify(updates)}`);
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
export async function executeRotateShape(
  params: RotateShapeParams,
  canvasContext: CanvasContextType,
  shapes: Shape[],
  debugLog: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const shape = params.shapeId
      ? shapes.find(s => s.id === params.shapeId)
      : (params.shapeName ? findShapeByName(params.shapeName, shapes) : null);
    if (!shape) {
      const error = `Shape not found`;
      debugLog.push(`[rotateShape] Error: ${error}`);
      return { success: false, error };
    }

    if (shape.type !== 'rectangle' && shape.type !== 'line' && shape.type !== 'text') {
      const error = `Shape type ${shape.type} cannot be rotated. Only rectangles, lines, and text support rotation.`;
      debugLog.push(`[rotateShape] Error: ${error}`);
      return { success: false, error };
    }

    // Normalize angle to 0-360 range
    const normalizedAngle = params.angle % 360;
    
    await canvasContext.updateShape(shape.id, { rotation: normalizedAngle });
    
    debugLog.push(`[rotateShape] Rotated ${shape.name} to ${normalizedAngle}°`);
    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to rotate shape';
    debugLog.push(`[rotateShape] Error: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}

