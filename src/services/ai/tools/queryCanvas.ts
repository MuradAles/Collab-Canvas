/**
 * Query Canvas Tool
 * Handles canvas state queries from AI
 */

import type { Shape, ShapeType } from '../../../types';
import type { GetCanvasStateParams } from '../types/toolTypes';

/**
 * Execute getCanvasState tool call
 */
export function executeGetCanvasState(
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

