/**
 * Position Parser
 * Parses position parameters from AI commands into actual canvas coordinates
 * Updated for endless canvas (0 to 100k, center at 50k, 50k)
 */

import type { Shape, LineShape } from '../../types';
import { CANVAS_BOUNDS } from '../../utils/constants';

// ============================================================================
// Type Definitions
// ============================================================================

export interface PositionParameter {
  preset?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
  x?: number;
  y?: number;
  relativeTo?: string;
  offset?: number;
  direction?: 'right' | 'left' | 'top' | 'bottom' | 'center';
}

export interface ParsedPosition {
  x: number;
  y: number;
}

export interface PositionParseResult {
  position: ParsedPosition | null;
  error?: string;
}

// ============================================================================
// Preset Positions - Updated for Endless Canvas
// ============================================================================

const PRESET_POSITIONS: Record<string, ParsedPosition> = {
  'center': { x: CANVAS_BOUNDS.CENTER_X, y: CANVAS_BOUNDS.CENTER_Y }, // (50000, 50000)
  'top-left': { x: CANVAS_BOUNDS.MIN_X + 100, y: CANVAS_BOUNDS.MIN_Y + 100 }, // (100, 100)
  'top-right': { x: CANVAS_BOUNDS.MAX_X - 100, y: CANVAS_BOUNDS.MIN_Y + 100 }, // (99900, 100)
  'top-center': { x: CANVAS_BOUNDS.CENTER_X, y: CANVAS_BOUNDS.MIN_Y + 100 }, // (50000, 100)
  'bottom-left': { x: CANVAS_BOUNDS.MIN_X + 100, y: CANVAS_BOUNDS.MAX_Y - 100 }, // (100, 99900)
  'bottom-right': { x: CANVAS_BOUNDS.MAX_X - 100, y: CANVAS_BOUNDS.MAX_Y - 100 }, // (99900, 99900)
  'bottom-center': { x: CANVAS_BOUNDS.CENTER_X, y: CANVAS_BOUNDS.MAX_Y - 100 }, // (50000, 99900)
};

// ============================================================================
// Main Position Parser
// ============================================================================

/**
 * Parse position parameter into canvas coordinates
 */
export function parsePosition(
  positionParam: PositionParameter,
  shapes: Shape[],
  shapeWidth: number = 100,
  shapeHeight: number = 100
): PositionParseResult {
  try {
    // Option 1: Preset position
    if (positionParam.preset) {
      const preset = PRESET_POSITIONS[positionParam.preset];
      if (preset) {
        let finalX = preset.x;
        let finalY = preset.y;
        
        // Apply offset if specified
        if (positionParam.offset !== undefined && positionParam.direction) {
          const offset = positionParam.offset;
          switch (positionParam.direction) {
            case 'right':
              finalX += offset;
              break;
            case 'left':
              finalX -= offset;
              break;
            case 'bottom':
              finalY += offset;
              break;
            case 'top':
              finalY -= offset;
              break;
          }
        }
        
        // Center the shape at the final position by offsetting by half width/height
        const centeredX = finalX - shapeWidth / 2;
        const centeredY = finalY - shapeHeight / 2;
        const clamped = clampToCanvas(centeredX, centeredY, shapeWidth, shapeHeight);
        return { position: clamped };
      }
      return { position: null, error: `Unknown preset: ${positionParam.preset}` };
    }

    // Option 2: Exact coordinates
    if (positionParam.x !== undefined && positionParam.y !== undefined) {
      const clamped = clampToCanvas(positionParam.x, positionParam.y, shapeWidth, shapeHeight);
      return { position: clamped };
    }

    // Option 3: Relative to another shape
    if (positionParam.relativeTo) {
      return parseRelativePosition(positionParam, shapes, shapeWidth, shapeHeight);
    }

    return { position: null, error: 'No valid position specified' };
  } catch (error) {
    return {
      position: null,
      error: error instanceof Error ? error.message : 'Failed to parse position',
    };
  }
}

/**
 * Parse relative position (e.g., "near Rectangle 1", "below Circle 2")
 */
function parseRelativePosition(
  positionParam: PositionParameter,
  shapes: Shape[],
  shapeWidth: number,
  shapeHeight: number
): PositionParseResult {
  const targetShape = findShapeByName(positionParam.relativeTo!, shapes);
  
  if (!targetShape) {
    return {
      position: null,
      error: `Shape not found: ${positionParam.relativeTo}`,
    };
  }

  // Default offset and direction
  const offset = positionParam.offset || 50;
  const direction = positionParam.direction || 'bottom'; // Changed default to 'bottom' for more intuitive "below" behavior

  const relativePos = calculateRelativePosition(
    targetShape,
    direction,
    offset,
    shapeWidth,
    shapeHeight
  );

  const clamped = clampToCanvas(relativePos.x, relativePos.y, shapeWidth, shapeHeight);
  return { position: clamped };
}

/**
 * Calculate position relative to a target shape
 */
export function calculateRelativePosition(
  targetShape: Shape,
  direction: 'right' | 'left' | 'top' | 'bottom' | 'center',
  offset: number,
  newShapeWidth: number = 100,
  newShapeHeight: number = 100
): ParsedPosition {
  // For lines, use the midpoint
  if (targetShape.type === 'line') {
    const lineShape = targetShape as LineShape;
    const centerX = (lineShape.x1 + lineShape.x2) / 2;
    const centerY = (lineShape.y1 + lineShape.y2) / 2;
    
    switch (direction) {
      case 'right':
        return { x: centerX + offset + newShapeWidth / 2, y: centerY };
      case 'left':
        return { x: centerX - offset - newShapeWidth / 2, y: centerY };
      case 'top':
        return { x: centerX, y: centerY - offset - newShapeHeight / 2 };
      case 'bottom':
        return { x: centerX, y: centerY + offset + newShapeHeight / 2 };
      case 'center':
        return { x: centerX - newShapeWidth / 2, y: centerY - newShapeHeight / 2 };
      default:
        return { x: centerX + offset + newShapeWidth / 2, y: centerY };
    }
  }

  // For circles, calculate position based on center and radius
  if (targetShape.type === 'circle') {
    const centerX = targetShape.x;
    const centerY = targetShape.y;
    const radius = targetShape.radius;

    switch (direction) {
      case 'right':
        return { x: centerX + radius + offset + newShapeWidth / 2, y: centerY };
      case 'left':
        return { x: centerX - radius - offset - newShapeWidth / 2, y: centerY };
      case 'top':
        return { x: centerX, y: centerY - radius - offset - newShapeHeight / 2 };
      case 'bottom':
        return { x: centerX, y: centerY + radius + offset + newShapeHeight / 2 };
      case 'center':
        return { x: centerX - newShapeWidth / 2, y: centerY - newShapeHeight / 2 };
      default:
        return { x: centerX + radius + offset + newShapeWidth / 2, y: centerY };
    }
  }

  // For rectangles and text (have x, y, width, height)
  const shapeWidth = 'width' in targetShape ? targetShape.width || 100 : 100;
  const shapeHeight = 'height' in targetShape ? targetShape.height || 100 : 100;

  switch (direction) {
    case 'right':
      return { x: targetShape.x + shapeWidth + offset, y: targetShape.y };
    case 'left':
      return { x: targetShape.x - offset - newShapeWidth, y: targetShape.y };
    case 'top':
      return { x: targetShape.x, y: targetShape.y - offset - newShapeHeight };
    case 'bottom':
      // Position below, centered horizontally relative to the target shape
      return { 
        x: targetShape.x + (shapeWidth / 2) - (newShapeWidth / 2), 
        y: targetShape.y + shapeHeight + offset 
      };
    case 'center':
      return {
        x: targetShape.x + (shapeWidth / 2) - (newShapeWidth / 2),
        y: targetShape.y + (shapeHeight / 2) - (newShapeHeight / 2),
      };
    default:
      return { x: targetShape.x + shapeWidth + offset, y: targetShape.y };
  }
}

/**
 * Find a shape by its name (case-insensitive, flexible matching)
 */
export function findShapeByName(shapeName: string, shapes: Shape[]): Shape | null {
  const normalizedName = shapeName.toLowerCase().trim();
  
  // Try exact match first
  let found = shapes.find(s => s.name.toLowerCase() === normalizedName);
  if (found) return found;
  
  // Try partial match (contains)
  found = shapes.find(s => s.name.toLowerCase().includes(normalizedName));
  if (found) return found;
  
  // Try removing "AI" prefix and matching
  const withoutAI = normalizedName.replace(/^ai\s*/i, '');
  found = shapes.find(s => s.name.toLowerCase().replace(/^ai\s*/i, '') === withoutAI);
  if (found) return found;
  
  return null;
}

/**
 * Clamp coordinates to canvas bounds, accounting for shape size
 * Updated for endless canvas (0 to 100k)
 */
export function clampToCanvas(
  x: number,
  y: number,
  shapeWidth: number = 0,
  shapeHeight: number = 0
): ParsedPosition {
  // Ensure shape stays within bounds
  const minX = CANVAS_BOUNDS.MIN_X;
  const minY = CANVAS_BOUNDS.MIN_Y;
  const maxX = CANVAS_BOUNDS.MAX_X - shapeWidth;
  const maxY = CANVAS_BOUNDS.MAX_Y - shapeHeight;

  return {
    x: Math.max(minX, Math.min(maxX, x)),
    y: Math.max(minY, Math.min(maxY, y)),
  };
}

/**
 * Validate if a position is within canvas bounds
 * Updated for endless canvas (0 to 100k)
 */
export function isWithinBounds(x: number, y: number): boolean {
  return x >= CANVAS_BOUNDS.MIN_X && x <= CANVAS_BOUNDS.MAX_X && 
         y >= CANVAS_BOUNDS.MIN_Y && y <= CANVAS_BOUNDS.MAX_Y;
}

