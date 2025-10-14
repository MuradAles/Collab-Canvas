/**
 * Grid Renderer Utility
 * Renders grid lines on the canvas
 */

import React from 'react';
import { Line } from 'react-konva';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';

interface RenderGridOptions {
  showGrid: boolean;
  gridSize?: number;
  gridColor?: string;
  thickLineColor?: string;
}

/**
 * Render grid lines for the canvas
 */
export function renderGrid({
  showGrid,
  gridSize = 50,
  gridColor = '#e0e0e0',
  thickLineColor = '#d0d0d0',
}: RenderGridOptions): React.ReactElement[] | null {
  if (!showGrid) return null;

  const lines: React.ReactElement[] = [];

  // Vertical lines
  for (let i = 0; i <= CANVAS_WIDTH; i += gridSize) {
    const isThick = i % (gridSize * 5) === 0;
    lines.push(
      <Line
        key={`v-${i}`}
        points={[i, 0, i, CANVAS_HEIGHT]}
        stroke={isThick ? thickLineColor : gridColor}
        strokeWidth={isThick ? 1.5 : 0.5}
        listening={false}
      />
    );
  }

  // Horizontal lines
  for (let i = 0; i <= CANVAS_HEIGHT; i += gridSize) {
    const isThick = i % (gridSize * 5) === 0;
    lines.push(
      <Line
        key={`h-${i}`}
        points={[0, i, CANVAS_WIDTH, i]}
        stroke={isThick ? thickLineColor : gridColor}
        strokeWidth={isThick ? 1.5 : 0.5}
        listening={false}
      />
    );
  }

  return lines;
}

