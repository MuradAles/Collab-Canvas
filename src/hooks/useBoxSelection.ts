/**
 * Box Selection Hook
 * Handles box/marquee selection for selecting multiple shapes
 */

import { useState, useCallback } from 'react';
import type Konva from 'konva';
import type { Shape } from '../types';
import { screenToCanvas, normalizeRectangle, rectanglesIntersect, circleIntersectsRect, lineIntersectsRect } from '../utils/helpers';

interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface UseBoxSelectionProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  currentTool: string;
  shapes: Shape[];
  currentUser: { uid: string } | null;
  stagePosition: { x: number; y: number };
  stageScale: number;
  selectShape: (id: string | null, shiftKey?: boolean) => void;
  selectMultipleShapes: (ids: string[], additive: boolean) => Promise<void>;
}

export function useBoxSelection({
  stageRef,
  currentTool,
  shapes,
  currentUser,
  stagePosition,
  stageScale,
  selectShape,
  selectMultipleShapes,
}: UseBoxSelectionProps) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);

  /**
   * Handle box selection start
   */
  const handleSelectionStart = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Only start box selection if:
      // 1. Select tool is active
      // 2. Not panning (Ctrl/Cmd not pressed)
      // 3. Clicking on stage background (not a shape)
      if (currentTool !== 'select' || e.evt.ctrlKey || e.evt.metaKey || e.target !== e.target.getStage()) {
        return;
      }

      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // Convert to canvas coordinates
      const canvasPos = screenToCanvas(
        pointer.x,
        pointer.y,
        stagePosition.x,
        stagePosition.y,
        stageScale
      );

      setIsSelecting(true);
      setSelectionStart(canvasPos);
      setSelectionRect(null);
    },
    [currentTool, stagePosition, stageScale, stageRef]
  );

  /**
   * Handle box selection move
   */
  const handleSelectionMove = useCallback(() => {
    if (!isSelecting || !selectionStart) return;

    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // Convert to canvas coordinates
    const canvasPos = screenToCanvas(
      pointer.x,
      pointer.y,
      stagePosition.x,
      stagePosition.y,
      stageScale
    );

    // Create normalized rectangle
    const rect = normalizeRectangle(
      selectionStart.x,
      selectionStart.y,
      canvasPos.x,
      canvasPos.y
    );

    setSelectionRect(rect);
  }, [isSelecting, selectionStart, stagePosition, stageScale, stageRef]);

  /**
   * Handle box selection end - find and select intersecting shapes
   * ⚡ ATOMIC: Selects all shapes at once to prevent race conditions
   * NOTE: Box selection checks all shapes, not just visible ones
   * Uses lenient intersection - any overlap selects the shape
   */
  const handleSelectionEnd = useCallback(async () => {
    if (!isSelecting || !selectionRect || !currentUser) {
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionRect(null);
      return;
    }

    // No padding for accurate selection - use exact selection box
    const SELECTION_PADDING = 0;
    const paddedSelectionRect = {
      x: selectionRect.x - SELECTION_PADDING,
      y: selectionRect.y - SELECTION_PADDING,
      width: selectionRect.width + SELECTION_PADDING * 2,
      height: selectionRect.height + SELECTION_PADDING * 2,
    };

    // Find all shapes that intersect with the selection rectangle
    // Use ALL shapes (not just visible ones) for selection
    const intersectingShapes = shapes.filter((shape) => {
      // Skip locked shapes by other users (selectMultipleShapes will also filter)
      if (shape.isLocked && shape.lockedBy && shape.lockedBy !== currentUser.uid) {
        return false;
      }

      if (shape.type === 'rectangle' || shape.type === 'text') {
        // For rectangles and text, check bounding box intersection with padding
        const shapeRect = {
          x: shape.x,
          y: shape.y,
          width: shape.width || 100,
          height: shape.type === 'rectangle' ? shape.height : (shape.fontSize || 16),
        };
        return rectanglesIntersect(paddedSelectionRect, shapeRect);
      } else if (shape.type === 'circle') {
        // For circles, check circle-rectangle intersection with padding
        const circle = {
          x: shape.x,
          y: shape.y,
          radius: shape.radius,
        };
        return circleIntersectsRect(circle, paddedSelectionRect);
      } else if (shape.type === 'line') {
        // For lines, check line-rectangle intersection with padding
        const line = {
          x1: shape.x1,
          y1: shape.y1,
          x2: shape.x2,
          y2: shape.y2,
        };
        return lineIntersectsRect(line, paddedSelectionRect);
      }
      return false;
    });

    // Get IDs of intersecting shapes
    const intersectingIds = intersectingShapes.map((s) => s.id);

    // Check if Shift is pressed for additive selection
    const shiftPressed = window.event && (window.event as KeyboardEvent).shiftKey;

    if (intersectingIds.length > 0) {
      // ⚡ ATOMIC: Select all at once
      await selectMultipleShapes(intersectingIds, shiftPressed);
    } else if (!shiftPressed) {
      selectShape(null);
    }

    // Clear selection rectangle
    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionRect(null);
  }, [isSelecting, selectionRect, shapes, currentUser, selectShape, selectMultipleShapes]);

  return {
    isSelecting,
    selectionRect,
    handleSelectionStart,
    handleSelectionMove,
    handleSelectionEnd,
  };
}

