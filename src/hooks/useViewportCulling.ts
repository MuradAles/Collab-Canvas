/**
 * useViewportCulling Hook
 * Calculates which shapes are visible in the current viewport
 * Only renders shapes within viewport + buffer zone for optimal performance
 */

import { useMemo } from 'react';
import type { Shape, LineShape, CircleShape } from '../types';

interface ViewportBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

interface UseViewportCullingProps {
  shapes: Shape[];
  stagePosition: { x: number; y: number };
  stageScale: number;
  stageSize: { width: number; height: number };
  bufferMultiplier?: number; // Multiplier for buffer zone (default 0.5x viewport)
}

/**
 * Calculate viewport bounds in canvas coordinates
 */
function getViewportBounds(
  stagePosition: { x: number; y: number },
  stageScale: number,
  stageSize: { width: number; height: number },
  bufferMultiplier: number
): ViewportBounds {
  // Convert viewport screen coordinates to canvas coordinates
  const viewportMinX = -stagePosition.x / stageScale;
  const viewportMinY = -stagePosition.y / stageScale;
  const viewportMaxX = viewportMinX + stageSize.width / stageScale;
  const viewportMaxY = viewportMinY + stageSize.height / stageScale;

  // Calculate buffer size
  const viewportWidth = viewportMaxX - viewportMinX;
  const viewportHeight = viewportMaxY - viewportMinY;
  const bufferX = viewportWidth * bufferMultiplier;
  const bufferY = viewportHeight * bufferMultiplier;

  // Apply buffer zone
  return {
    minX: viewportMinX - bufferX,
    maxX: viewportMaxX + bufferX,
    minY: viewportMinY - bufferY,
    maxY: viewportMaxY + bufferY,
  };
}

/**
 * Check if a shape intersects with the viewport bounds
 */
function isShapeVisible(shape: Shape, viewport: ViewportBounds): boolean {
  if (shape.type === 'rectangle' || shape.type === 'text') {
    // Rectangles and text have x, y, width, height
    const shapeMinX = shape.x;
    const shapeMaxX = shape.x + (shape.width || 100);
    const shapeMinY = shape.y;
    const shapeMaxY = shape.y + (shape.type === 'rectangle' ? (shape.height || 100) : (shape.fontSize || 16));

    // Check for intersection
    return !(
      shapeMaxX < viewport.minX ||
      shapeMinX > viewport.maxX ||
      shapeMaxY < viewport.minY ||
      shapeMinY > viewport.maxY
    );
  } else if (shape.type === 'circle') {
    // Circles have x, y (center) and radius
    const circleShape = shape as CircleShape;
    const shapeMinX = circleShape.x - circleShape.radius;
    const shapeMaxX = circleShape.x + circleShape.radius;
    const shapeMinY = circleShape.y - circleShape.radius;
    const shapeMaxY = circleShape.y + circleShape.radius;

    // Check for intersection
    return !(
      shapeMaxX < viewport.minX ||
      shapeMinX > viewport.maxX ||
      shapeMaxY < viewport.minY ||
      shapeMinY > viewport.maxY
    );
  } else if (shape.type === 'line') {
    // Lines have x1, y1, x2, y2
    const lineShape = shape as LineShape;
    const shapeMinX = Math.min(lineShape.x1, lineShape.x2);
    const shapeMaxX = Math.max(lineShape.x1, lineShape.x2);
    const shapeMinY = Math.min(lineShape.y1, lineShape.y2);
    const shapeMaxY = Math.max(lineShape.y1, lineShape.y2);

    // Add small buffer for line thickness
    const lineThickness = lineShape.strokeWidth || 2;
    
    // Check for intersection
    return !(
      shapeMaxX + lineThickness < viewport.minX ||
      shapeMinX - lineThickness > viewport.maxX ||
      shapeMaxY + lineThickness < viewport.minY ||
      shapeMinY - lineThickness > viewport.maxY
    );
  }

  // Unknown shape type - render it to be safe
  return true;
}

/**
 * Hook to calculate visible shapes based on current viewport
 */
export function useViewportCulling({
  shapes,
  stagePosition,
  stageScale,
  stageSize,
  bufferMultiplier = 0.5, // 0.5x viewport = renders 2x2 total area (smooth panning buffer)
}: UseViewportCullingProps) {
  const visibleShapes = useMemo(() => {
    // Calculate viewport bounds with buffer
    const viewport = getViewportBounds(
      stagePosition,
      stageScale,
      stageSize,
      bufferMultiplier
    );

    // Filter shapes that intersect with buffered viewport
    return shapes.filter(shape => isShapeVisible(shape, viewport));
  }, [shapes, stagePosition, stageScale, stageSize, bufferMultiplier]);

  const cullingStats = useMemo(() => ({
    totalShapes: shapes.length,
    visibleShapes: visibleShapes.length,
    culledShapes: shapes.length - visibleShapes.length,
    cullingPercentage: shapes.length > 0 
      ? Math.round(((shapes.length - visibleShapes.length) / shapes.length) * 100)
      : 0,
  }), [shapes.length, visibleShapes.length]);

  return {
    visibleShapes,
    cullingStats,
  };
}


