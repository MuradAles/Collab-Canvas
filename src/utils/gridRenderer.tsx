/**
 * Grid Renderer Utility
 * Renders grid lines on the canvas
 * Updated for endless canvas with viewport-based rendering
 */

import React from 'react';
import { Line } from 'react-konva';

interface RenderGridOptions {
  showGrid: boolean;
  gridSize?: number;
  gridColor?: string;
  thickLineColor?: string;
  originColor?: string;
  viewport?: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

/**
 * Render grid lines based on current viewport
 * Only renders grid lines visible in viewport + small buffer for smooth panning
 */
export function renderGrid({
  showGrid,
  gridSize = 50,
  gridColor = '#e0e0e0',
  thickLineColor = '#d0d0d0',
  originColor = '#3b82f6',
  viewport,
}: RenderGridOptions): React.ReactElement[] | null {
  if (!showGrid) return null;

  const lines: React.ReactElement[] = [];

  // If viewport is provided, use it; otherwise render a default area
  const viewportMinX = viewport?.minX ?? -5000;
  const viewportMaxX = viewport?.maxX ?? 5000;
  const viewportMinY = viewport?.minY ?? -5000;
  const viewportMaxY = viewport?.maxY ?? 5000;

  // Add buffer to viewport for smoother panning (1.5x viewport size)
  const bufferX = (viewportMaxX - viewportMinX) * 0.5;
  const bufferY = (viewportMaxY - viewportMinY) * 0.5;
  
  const renderMinX = viewportMinX - bufferX;
  const renderMaxX = viewportMaxX + bufferX;
  const renderMinY = viewportMinY - bufferY;
  const renderMaxY = viewportMaxY + bufferY;

  // Snap to grid boundaries for clean rendering
  const startX = Math.floor(renderMinX / gridSize) * gridSize;
  const endX = Math.ceil(renderMaxX / gridSize) * gridSize;
  const startY = Math.floor(renderMinY / gridSize) * gridSize;
  const endY = Math.ceil(renderMaxY / gridSize) * gridSize;

  // Clamp to canvas bounds (0 to 100k)
  const clampedStartX = Math.max(0, startX);
  const clampedEndX = Math.min(100000, endX);
  const clampedStartY = Math.max(0, startY);
  const clampedEndY = Math.min(100000, endY);

  // Vertical lines
  for (let x = clampedStartX; x <= clampedEndX; x += gridSize) {
    const isCenter = x === 50000; // Center of canvas (was origin at 0,0)
    const isThick = x % (gridSize * 5) === 0;
    
    lines.push(
      <Line
        key={`v-${x}`}
        points={[x, clampedStartY, x, clampedEndY]}
        stroke={isCenter ? originColor : (isThick ? thickLineColor : gridColor)}
        strokeWidth={isCenter ? 2 : (isThick ? 1.5 : 0.5)}
        listening={false}
      />
    );
  }

  // Horizontal lines
  for (let y = clampedStartY; y <= clampedEndY; y += gridSize) {
    const isCenter = y === 50000; // Center of canvas (was origin at 0,0)
    const isThick = y % (gridSize * 5) === 0;
    
    lines.push(
      <Line
        key={`h-${y}`}
        points={[clampedStartX, y, clampedEndX, y]}
        stroke={isCenter ? originColor : (isThick ? thickLineColor : gridColor)}
        strokeWidth={isCenter ? 2 : (isThick ? 1.5 : 0.5)}
        listening={false}
      />
    );
  }

  return lines;
}

