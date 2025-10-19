/**
 * useShapeDrawing Hook
 * Manages shape creation (rectangle, circle, text)
 */

import { useState, useCallback } from 'react';
import type Konva from 'konva';
import type { Tool } from '../components/Canvas/ToolSelector';
import type { RectangleShape, CircleShape, TextShape, LineShape } from '../types';
import { screenToCanvas, normalizeRectangle, validateShapePosition, clampToCanvasBounds } from '../utils/helpers';
import {
  DEFAULT_SHAPE_FILL,
  DEFAULT_SHAPE_STROKE,
  DEFAULT_SHAPE_STROKE_WIDTH,
  DEFAULT_CORNER_RADIUS,
  MIN_SHAPE_SIZE,
  DEFAULT_TEXT_SIZE,
  DEFAULT_TEXT_FONT,
  DEFAULT_TEXT_FILL,
  CANVAS_BOUNDS,
} from '../utils/constants';

interface NewShapePreview {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface NewLinePreview {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface UseShapeDrawingProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  stagePosition: { x: number; y: number };
  stageScale: number;
  selectedTool: Tool;
  setSelectedTool: (tool: Tool) => void;
  addShape: (shape: Omit<RectangleShape | CircleShape | TextShape | LineShape, 'id' | 'name' | 'isLocked' | 'lockedBy' | 'lockedByName'>, options?: { skipAutoLock?: boolean }) => Promise<string>;
  onTextCreated?: (shapeId: string) => void;
}

export function useShapeDrawing({
  stageRef,
  stagePosition,
  stageScale,
  selectedTool,
  setSelectedTool,
  addShape,
  onTextCreated,
}: UseShapeDrawingProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [newShapePreview, setNewShapePreview] = useState<NewShapePreview | null>(null);
  const [newLinePreview, setNewLinePreview] = useState<NewLinePreview | null>(null);

  /**
   * Handle mouse down - start shape creation
   */
  const handleDrawStart = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const isCtrlPressed = e.evt.ctrlKey || e.evt.metaKey;
      
      // If Ctrl is pressed, skip (panning)
      if (isCtrlPressed) {
        return;
      }

      // Only start drawing if a shape or text tool is selected
      if (selectedTool === 'rectangle' || selectedTool === 'circle' || selectedTool === 'line' || selectedTool === 'text') {
        const stage = stageRef.current;
        if (!stage) return;

        const pointer = stage.getPointerPosition();
        if (!pointer) return;

        // Convert screen coordinates to canvas coordinates
        const canvasPos = screenToCanvas(
          pointer.x,
          pointer.y,
          stagePosition.x,
          stagePosition.y,
          stageScale
        );

        if (selectedTool === 'rectangle' || selectedTool === 'circle') {
          // Clear any previous preview state before starting new drawing
          setNewLinePreview(null);
          setIsDrawing(true);
          setDrawStart(canvasPos);
          setNewShapePreview({
            x: canvasPos.x,
            y: canvasPos.y,
            width: 0,
            height: 0,
          });
        } else if (selectedTool === 'line') {
          // Clear any previous preview state before starting new drawing
          setNewShapePreview(null);
          // For lines, start point is where user clicks
          setIsDrawing(true);
          setDrawStart(canvasPos);
          setNewLinePreview({
            x1: canvasPos.x,
            y1: canvasPos.y,
            x2: canvasPos.x,
            y2: canvasPos.y,
          });
        } else if (selectedTool === 'text') {
          // DO NOT create text on mouse down - wait for canvas click
          // This prevents accidentally creating text on existing shapes
          return;
        }
      }
    },
    [stageRef, stagePosition, stageScale, selectedTool]
  );

  /**
   * Handle mouse move - update shape preview while drawing
   */
  const handleDrawMove = useCallback(() => {
    if (!isDrawing || !drawStart) return;

    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const canvasPos = screenToCanvas(
      pointer.x,
      pointer.y,
      stagePosition.x,
      stagePosition.y,
      stageScale
    );

    if (selectedTool === 'rectangle' || selectedTool === 'circle') {
      const normalized = normalizeRectangle(
        drawStart.x,
        drawStart.y,
        canvasPos.x,
        canvasPos.y
      );
      setNewShapePreview(normalized);
    } else if (selectedTool === 'line') {
      // Update line end point
      setNewLinePreview({
        x1: drawStart.x,
        y1: drawStart.y,
        x2: canvasPos.x,
        y2: canvasPos.y,
      });
    }
  }, [isDrawing, drawStart, stageRef, stagePosition, stageScale, selectedTool]);

  /**
   * Handle mouse up - finish drawing a shape
   */
  const handleDrawEnd = useCallback(async () => {
    // If not currently drawing, ensure all preview state is cleared and exit
    if (!isDrawing) {
      setIsDrawing(false);
      setDrawStart(null);
      setNewShapePreview(null);
      setNewLinePreview(null);
      return;
    }

    // Store current state before clearing (we need these values for shape creation)
    const currentShapePreview = newShapePreview;
    const currentLinePreview = newLinePreview;
    const currentTool = selectedTool;

    // IMMEDIATELY clear drawing state for instant UI feedback (no delay)
    setIsDrawing(false);
    setDrawStart(null);
    setNewShapePreview(null);
    setNewLinePreview(null);

    try {
      // Handle rectangle/circle
      if ((currentTool === 'rectangle' || currentTool === 'circle') && currentShapePreview) {
        // Only create shape if it's large enough
        if (
          currentShapePreview.width >= MIN_SHAPE_SIZE &&
          currentShapePreview.height >= MIN_SHAPE_SIZE
        ) {
          if (currentTool === 'rectangle') {
            // Validate and clamp position to canvas bounds
            const validated = validateShapePosition(
              currentShapePreview.x,
              currentShapePreview.y,
              currentShapePreview.width,
              currentShapePreview.height
            );

            if (validated.wasClamped) {
              console.warn('Shape position clamped to canvas bounds');
            }

            const rectShape: Omit<RectangleShape, 'id' | 'name' | 'isLocked' | 'lockedBy' | 'lockedByName'> = {
              type: 'rectangle',
              x: validated.x,
              y: validated.y,
              width: currentShapePreview.width,
              height: currentShapePreview.height,
              rotation: 0,
              zIndex: 0,
              fill: DEFAULT_SHAPE_FILL,
              stroke: DEFAULT_SHAPE_STROKE,
              strokeWidth: DEFAULT_SHAPE_STROKE_WIDTH,
              cornerRadius: DEFAULT_CORNER_RADIUS,
            };
            await addShape(rectShape);
          } else if (currentTool === 'circle') {
            // Create circle based on drag size
            const radius = Math.max(currentShapePreview.width, currentShapePreview.height) / 2;
            const centerX = currentShapePreview.x + currentShapePreview.width / 2;
            const centerY = currentShapePreview.y + currentShapePreview.height / 2;

            // Clamp circle center to bounds (accounting for radius)
            const clampedCenterX = clampToCanvasBounds(centerX, CANVAS_BOUNDS.MIN_X + radius, CANVAS_BOUNDS.MAX_X - radius);
            const clampedCenterY = clampToCanvasBounds(centerY, CANVAS_BOUNDS.MIN_Y + radius, CANVAS_BOUNDS.MAX_Y - radius);

            if (clampedCenterX !== centerX || clampedCenterY !== centerY) {
              console.warn('Circle position clamped to canvas bounds');
            }

            const circleShape: Omit<CircleShape, 'id' | 'name' | 'isLocked' | 'lockedBy' | 'lockedByName'> = {
              type: 'circle',
              x: clampedCenterX,
              y: clampedCenterY,
              radius: radius,
              rotation: 0,
              zIndex: 0,
              fill: DEFAULT_SHAPE_FILL,
              stroke: DEFAULT_SHAPE_STROKE,
              strokeWidth: DEFAULT_SHAPE_STROKE_WIDTH,
            };
            await addShape(circleShape);
          }
        }
      } 
      // Handle line
      else if (currentTool === 'line' && currentLinePreview) {
        // Calculate line length to ensure it's not too short
        const dx = currentLinePreview.x2 - currentLinePreview.x1;
        const dy = currentLinePreview.y2 - currentLinePreview.y1;
        const length = Math.sqrt(dx * dx + dy * dy);

        if (length >= MIN_SHAPE_SIZE) {
          // Clamp line endpoints to canvas bounds
          const x1 = clampToCanvasBounds(currentLinePreview.x1);
          const y1 = clampToCanvasBounds(currentLinePreview.y1);
          const x2 = clampToCanvasBounds(currentLinePreview.x2);
          const y2 = clampToCanvasBounds(currentLinePreview.y2);

          if (x1 !== currentLinePreview.x1 || y1 !== currentLinePreview.y1 || 
              x2 !== currentLinePreview.x2 || y2 !== currentLinePreview.y2) {
            console.warn('Line endpoints clamped to canvas bounds');
          }

          const lineShape: Omit<LineShape, 'id' | 'name' | 'isLocked' | 'lockedBy' | 'lockedByName'> = {
            type: 'line',
            // Lines use absolute x1, y1, x2, y2 coordinates - no need for x, y, or rotation
            x1,
            y1,
            x2,
            y2,
            zIndex: 0,
            stroke: DEFAULT_SHAPE_STROKE,
            strokeWidth: DEFAULT_SHAPE_STROKE_WIDTH,
            lineCap: 'round',
          };
          await addShape(lineShape);
        }
      }
    } catch (error) {
      console.error('Failed to create shape:', error);
    }
    // Note: No finally block needed - state is already cleared above for instant feedback
  }, [isDrawing, newShapePreview, newLinePreview, addShape, selectedTool]);

  /**
   * Handle text creation on canvas click
   * Separated from handleDrawStart to avoid conflicts with existing text shapes
   */
  const handleTextClick = useCallback(
    async (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Only create text if text tool is selected and clicking on stage background
      if (selectedTool !== 'text' || e.target !== e.target.getStage()) {
        return;
      }

      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // Convert screen coordinates to canvas coordinates
      const canvasPos = screenToCanvas(
        pointer.x,
        pointer.y,
        stagePosition.x,
        stagePosition.y,
        stageScale
      );

      // Validate and clamp text position
      const validated = validateShapePosition(canvasPos.x, canvasPos.y, 200, DEFAULT_TEXT_SIZE);
      
      if (validated.wasClamped) {
        console.warn('Text position clamped to canvas bounds');
      }

      // Create text immediately at click position with default "Text" content
      const textShape: Omit<TextShape, 'id' | 'name' | 'isLocked' | 'lockedBy' | 'lockedByName'> = {
        type: 'text',
        x: validated.x,
        y: validated.y,
        rotation: 0,
        zIndex: 0,
        text: 'Text',
        fontSize: DEFAULT_TEXT_SIZE,
        fontFamily: DEFAULT_TEXT_FONT,
        fill: DEFAULT_TEXT_FILL,
        fontStyle: 'normal',
        textDecoration: '',
        width: 200, // Default width for new text shapes
      };
      
      // Add shape and notify parent to enable editing
      const shapeId = await addShape(textShape);
      
      // Notify parent that text was created (so it can start editing)
      if (onTextCreated && shapeId) {
        // Small delay to ensure shape is added to context
        setTimeout(() => {
          onTextCreated(shapeId);
        }, 50);
      }
      
      setSelectedTool('select'); // Switch back to select tool
    },
    [stageRef, stagePosition, stageScale, selectedTool, addShape, setSelectedTool, onTextCreated]
  );

  return {
    isDrawing,
    newShapePreview,
    newLinePreview,
    handleDrawStart,
    handleDrawMove,
    handleDrawEnd,
    handleTextClick,
  };
}

