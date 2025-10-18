/**
 * Tool Executor Type Definitions
 * All parameter interfaces and result types for AI tool execution
 */

import type { ShapeType } from '../../../types';

// ============================================================================
// Execution Result
// ============================================================================

export interface ExecutionResult {
  success: boolean;
  message: string;
  debugLog: string[];
  createdShapeIds: string[];
  createdShapeNames: string[];
  errors: string[];
}

// ============================================================================
// Position Parameter (from positionParser)
// ============================================================================

export interface PositionParameter {
  type: 'absolute' | 'relative' | 'viewport';
  x?: number;
  y?: number;
  reference?: string;
  offsetX?: number;
  offsetY?: number;
  viewportX?: number;
  viewportY?: number;
}

// ============================================================================
// Tool Parameter Interfaces
// ============================================================================

export interface CreateShapeParams {
  type: ShapeType;
  position: PositionParameter;
  size?: { width?: number; height?: number };
  color?: string;
  strokeColor?: string;
  strokeWidth?: number;
  cornerRadius?: number;
  text?: string;
  fontSize?: number;
}

export interface MoveShapeParams {
  shapeId?: string;
  shapeName?: string;
  position: PositionParameter;
}

export interface GetCanvasStateParams {
  filter?: 'all' | 'rectangles' | 'circles' | 'text' | 'lines';
}

export interface DeleteShapeParams {
  shapeIds?: string[];
  shapeNames?: string[];
}

export interface ResizeShapeParams {
  shapeId?: string;
  shapeName?: string;
  width?: number;
  height?: number;
  radius?: number;
}

export interface RotateShapeParams {
  shapeId?: string;
  shapeName?: string;
  angle: number;
}

export interface ChangeShapeColorParams {
  shapeIds?: string[];
  shapeNames?: string[];
  color: string;
}

export interface AlignShapesParams {
  shapeIds?: string[];
  shapeNames?: string[];
  alignment: 'left' | 'right' | 'center-horizontal' | 'top' | 'bottom' | 'center-vertical';
}

export interface ChangeLayerParams {
  shapeIds?: string[];
  shapeNames?: string[];
  action: 'bring-to-front' | 'send-to-back' | 'bring-forward' | 'send-backward';
}

export interface ChangeShapeStyleParams {
  shapeIds?: string[];
  shapeNames?: string[];
  strokeColor?: string;
  strokeWidth?: number;
  cornerRadius?: number;
  lineCap?: 'butt' | 'round' | 'square';
}

