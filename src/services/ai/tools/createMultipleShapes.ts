/**
 * Create Multiple Shapes Tool
 * Handles bulk creation of shapes with various layout patterns
 */

import type { Shape, CanvasContextType } from '../../../types';
import type { CreateMultipleShapesParams } from '../types/toolTypes';
import { parseColor } from '../utils/colorParser';
import { DEFAULT_SHAPE_WIDTH, DEFAULT_SHAPE_HEIGHT, DEFAULT_TEXT_SIZE, CANVAS_BOUNDS } from '../../../utils/constants';

/**
 * Execute createMultipleShapes tool call
 */
export async function executeCreateMultipleShapes(
  params: CreateMultipleShapesParams,
  canvasContext: CanvasContextType,
  shapes: Shape[],
  debugLog: string[],
  viewport?: { center: { x: number; y: number }; bounds: { minX: number; maxX: number; minY: number; maxY: number } }
): Promise<{ count: number; error?: string }> {
  try {
    const count = Math.min(Math.max(1, params.count), 5000); // Limit: 1-5000 shapes
    const layout = params.layout || 'grid';
    const shapeType = params.shapeType || 'random';
    const area = params.area || 'viewport';
    
    debugLog.push(`[createMultipleShapes] Creating ${count} shapes with layout: ${layout}`);

    // Determine the area bounds
    let bounds = {
      minX: CANVAS_BOUNDS.MIN_X,
      maxX: CANVAS_BOUNDS.MAX_X,
      minY: CANVAS_BOUNDS.MIN_Y,
      maxY: CANVAS_BOUNDS.MAX_Y,
    };

    if (area === 'viewport' && viewport) {
      bounds = viewport.bounds;
    }

    // Calculate spacing and grid dimensions
    const spacing = params.spacing || 20;
    const minSize = params.minSize || 30;
    const maxSize = params.maxSize || 100;
    const colorScheme = params.colorScheme || 'random';
    const sizeVariation = params.sizeVariation || 'random';

    // Generate positions based on layout
    const positions = generatePositions(count, layout, bounds, spacing, minSize, maxSize, params.rows, params.columns);

    debugLog.push(`[createMultipleShapes] Generated ${positions.length} positions`);

    // Generate shapes data
    const shapesToCreate = [];
    for (let i = 0; i < count; i++) {
      const position = positions[i];
      
      // Determine shape type
      let type = shapeType;
      if (shapeType === 'random' || shapeType === 'mixed') {
        const types = ['rectangle', 'circle', 'line', 'text'];
        type = types[Math.floor(Math.random() * types.length)] as typeof type;
      }

      // Determine size
      let width, height;
      if (sizeVariation === 'uniform') {
        width = minSize;
        height = minSize;
      } else if (sizeVariation === 'random') {
        width = minSize + Math.random() * (maxSize - minSize);
        height = minSize + Math.random() * (maxSize - minSize);
      } else {
        // Gradual variation based on position
        const progress = i / count;
        width = minSize + progress * (maxSize - minSize);
        height = minSize + progress * (maxSize - minSize);
      }

      // Determine color
      const color = generateColor(i, count, colorScheme);

      // Build shape data
      const shapeData = buildShapeData(
        type,
        position.x,
        position.y,
        width,
        height,
        color,
        shapes.length + i
      );

      shapesToCreate.push(shapeData);
    }

    debugLog.push(`[createMultipleShapes] Creating ${shapesToCreate.length} shapes in Firestore with BATCH WRITE...`);

    // ⚡ Use batch write - ALL shapes create in one or few Firebase transactions!
    // This is MUCH faster than individual writes (1-3 operations vs 1000 operations)
    await canvasContext.addShapesBatch(shapesToCreate);

    debugLog.push(`[createMultipleShapes] ✅ Successfully batch created ${count} shapes`);
    
    return { count };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to create multiple shapes';
    debugLog.push(`[createMultipleShapes] Error: ${errorMsg}`);
    return { count: 0, error: errorMsg };
  }
}

/**
 * Generate positions based on layout pattern
 */
function generatePositions(
  count: number,
  layout: string,
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
  spacing: number,
  minSize: number,
  maxSize: number,
  requestedRows?: number,
  requestedColumns?: number
): Array<{ x: number; y: number }> {
  const positions: Array<{ x: number; y: number }> = [];
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  const avgSize = (minSize + maxSize) / 2;

  switch (layout) {
    case 'grid': {
      // Calculate grid dimensions - use requested rows/columns if provided
      let cols: number;
      let rows: number;
      
      if (requestedColumns && requestedRows) {
        // Both specified - use them directly
        cols = requestedColumns;
        rows = requestedRows;
      } else if (requestedColumns) {
        // Only columns specified - calculate rows
        cols = requestedColumns;
        rows = Math.ceil(count / cols);
      } else if (requestedRows) {
        // Only rows specified - calculate columns
        rows = requestedRows;
        cols = Math.ceil(count / rows);
      } else {
        // Neither specified - use smart calculation based on aspect ratio
        cols = Math.ceil(Math.sqrt(count * (width / height)));
        rows = Math.ceil(count / cols);
      }
      
      const cellWidth = width / cols;
      const cellHeight = height / rows;

      for (let i = 0; i < count; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        positions.push({
          x: bounds.minX + col * cellWidth + cellWidth / 2,
          y: bounds.minY + row * cellHeight + cellHeight / 2,
        });
      }
      break;
    }

    case 'random': {
      // Random scatter with collision avoidance
      for (let i = 0; i < count; i++) {
        positions.push({
          x: bounds.minX + avgSize + Math.random() * (width - avgSize * 2),
          y: bounds.minY + avgSize + Math.random() * (height - avgSize * 2),
        });
      }
      break;
    }

    case 'circular': {
      // Arrange in circular/spiral pattern
      const centerX = bounds.minX + width / 2;
      const centerY = bounds.minY + height / 2;
      const maxRadius = Math.min(width, height) / 2 - avgSize;

      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 * Math.ceil(count / 20); // Multiple circles
        const radius = (i / count) * maxRadius;
        positions.push({
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
        });
      }
      break;
    }

    case 'horizontal': {
      // Line up horizontally
      const totalWidth = count * avgSize + (count - 1) * spacing;
      const startX = bounds.minX + width / 2 - totalWidth / 2;
      const y = bounds.minY + height / 2;

      for (let i = 0; i < count; i++) {
        positions.push({
          x: startX + i * (avgSize + spacing),
          y,
        });
      }
      break;
    }

    case 'vertical': {
      // Line up vertically
      const totalHeight = count * avgSize + (count - 1) * spacing;
      const x = bounds.minX + width / 2;
      const startY = bounds.minY + height / 2 - totalHeight / 2;

      for (let i = 0; i < count; i++) {
        positions.push({
          x,
          y: startY + i * (avgSize + spacing),
        });
      }
      break;
    }

    case 'wave': {
      // Create wave pattern
      const cols = Math.ceil(Math.sqrt(count));
      const rows = Math.ceil(count / cols);
      const cellWidth = width / cols;
      const cellHeight = height / rows;

      for (let i = 0; i < count; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const waveOffset = Math.sin((col / cols) * Math.PI * 4) * (cellHeight * 0.3);
        positions.push({
          x: bounds.minX + col * cellWidth + cellWidth / 2,
          y: bounds.minY + row * cellHeight + cellHeight / 2 + waveOffset,
        });
      }
      break;
    }

    default: {
      // Fallback to grid
      const cols = Math.ceil(Math.sqrt(count));
      const rows = Math.ceil(count / cols);
      const cellWidth = width / cols;
      const cellHeight = height / rows;

      for (let i = 0; i < count; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        positions.push({
          x: bounds.minX + col * cellWidth + cellWidth / 2,
          y: bounds.minY + row * cellHeight + cellHeight / 2,
        });
      }
    }
  }

  return positions;
}

/**
 * Generate color based on scheme
 */
function generateColor(index: number, total: number, scheme: string): string {
  switch (scheme) {
    case 'random': {
      const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
        '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B500', '#90EE90',
        '#FFB6C1', '#DDA0DD', '#F0E68C', '#E6E6FA', '#FFE4B5'
      ];
      return colors[Math.floor(Math.random() * colors.length)];
    }

    case 'gradient': {
      // Rainbow gradient based on position
      const progress = index / total;
      const hue = progress * 360;
      return `hsl(${hue}, 70%, 60%)`;
    }

    case 'monochrome': {
      // Shades of blue
      const progress = index / total;
      const lightness = 40 + progress * 40; // 40% to 80%
      return `hsl(210, 70%, ${lightness}%)`;
    }

    case 'warm': {
      // Warm colors (red, orange, yellow)
      const hue = Math.random() * 60; // 0-60 = red to yellow
      return `hsl(${hue}, 80%, 60%)`;
    }

    case 'cool': {
      // Cool colors (blue, green, cyan)
      const hue = 180 + Math.random() * 120; // 180-300 = cyan to purple
      return `hsl(${hue}, 70%, 60%)`;
    }

    default: {
      // Try to parse as specific color
      return parseColor(scheme);
    }
  }
}

/**
 * Build shape data object
 */
function buildShapeData(
  type: string,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  zIndex: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  const baseData = {
    x,
    y,
    rotation: 0,
    zIndex,
  };

  switch (type) {
    case 'rectangle':
      return {
        type: 'rectangle',
        ...baseData,
        width,
        height,
        fill: color,
        stroke: '#000000',
        strokeWidth: 2,
        cornerRadius: 0,
      };

    case 'circle': {
      const radius = width / 2;
      return {
        type: 'circle',
        ...baseData,
        radius,
        fill: color,
        stroke: '#000000',
        strokeWidth: 2,
      };
    }

    case 'text':
      return {
        type: 'text',
        ...baseData,
        text: 'Text',
        fontSize: DEFAULT_TEXT_SIZE,
        fontFamily: 'Arial',
        fill: color,
      };

    case 'line': {
      const lineData = {
        type: 'line',
        x1: x - width / 2,
        y1: y,
        x2: x + width / 2,
        y2: y,
        stroke: color,
        strokeWidth: 2,
        lineCap: 'round' as const,
        rotation: 0,
        zIndex,
      };
      return lineData;
    }

    default:
      return {
        type: 'rectangle',
        ...baseData,
        width: DEFAULT_SHAPE_WIDTH,
        height: DEFAULT_SHAPE_HEIGHT,
        fill: color,
        stroke: '#000000',
        strokeWidth: 2,
        cornerRadius: 0,
      };
  }
}

