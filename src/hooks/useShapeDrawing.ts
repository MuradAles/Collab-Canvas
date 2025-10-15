/**
 * useShapeDrawing Hook
 * Manages shape creation (rectangle, circle, text)
 */

import { useState, useCallback } from 'react';
import type Konva from 'konva';
import type { Tool } from '../components/Canvas/ToolSelector';
import type { RectangleShape, CircleShape, TextShape } from '../types';
import { screenToCanvas, normalizeRectangle } from '../utils/helpers';
import {
  DEFAULT_SHAPE_FILL,
  DEFAULT_SHAPE_STROKE,
  DEFAULT_SHAPE_STROKE_WIDTH,
  DEFAULT_CORNER_RADIUS,
  MIN_SHAPE_SIZE,
  DEFAULT_TEXT_SIZE,
  DEFAULT_TEXT_FONT,
  DEFAULT_TEXT_FILL,
} from '../utils/constants';

interface NewShapePreview {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface UseShapeDrawingProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  stagePosition: { x: number; y: number };
  stageScale: number;
  selectedTool: Tool;
  setSelectedTool: (tool: Tool) => void;
  addShape: (shape: Omit<RectangleShape | CircleShape | TextShape, 'id' | 'name' | 'isLocked' | 'lockedBy' | 'lockedByName'>) => Promise<void>;
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
      if (selectedTool === 'rectangle' || selectedTool === 'circle' || selectedTool === 'text') {
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
          setIsDrawing(true);
          setDrawStart(canvasPos);
          setNewShapePreview({
            x: canvasPos.x,
            y: canvasPos.y,
            width: 0,
            height: 0,
          });
        } else if (selectedTool === 'text') {
          // Create text immediately at click position with default "Text" content
          const textShape: Omit<TextShape, 'id' | 'name' | 'isLocked' | 'lockedBy' | 'lockedByName'> = {
            type: 'text',
            x: canvasPos.x,
            y: canvasPos.y,
            rotation: 0,
            zIndex: 0,
            text: 'Text',
            fontSize: DEFAULT_TEXT_SIZE,
            fontFamily: DEFAULT_TEXT_FONT,
            fill: DEFAULT_TEXT_FILL,
          };
          
          // Add shape and notify parent to enable editing
          addShape(textShape).then(() => {
            // Notify parent that text was created (so it can start editing)
            if (onTextCreated) {
              // Small delay to ensure shape is added to context
              setTimeout(() => {
                onTextCreated('_last_created_'); // Signal to get last shape
              }, 50);
            }
          });
          
          setSelectedTool('select'); // Switch back to select tool
        }
      }
    },
    [stageRef, stagePosition, stageScale, selectedTool, addShape, setSelectedTool, onTextCreated]
  );

  /**
   * Handle mouse move - update shape preview while drawing
   */
  const handleDrawMove = useCallback(() => {
    if (!isDrawing || !drawStart || (selectedTool !== 'rectangle' && selectedTool !== 'circle')) return;

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

    const normalized = normalizeRectangle(
      drawStart.x,
      drawStart.y,
      canvasPos.x,
      canvasPos.y
    );

    setNewShapePreview(normalized);
  }, [isDrawing, drawStart, stageRef, stagePosition, stageScale, selectedTool]);

  /**
   * Handle mouse up - finish drawing a shape
   */
  const handleDrawEnd = useCallback(async () => {
    if (!isDrawing || !newShapePreview || (selectedTool !== 'rectangle' && selectedTool !== 'circle')) {
      setIsDrawing(false);
      setDrawStart(null);
      setNewShapePreview(null);
      return;
    }

    // Only create shape if it's large enough
    if (
      newShapePreview.width >= MIN_SHAPE_SIZE &&
      newShapePreview.height >= MIN_SHAPE_SIZE
    ) {
      if (selectedTool === 'rectangle') {
        const rectShape: Omit<RectangleShape, 'id' | 'name' | 'isLocked' | 'lockedBy' | 'lockedByName'> = {
          type: 'rectangle',
          x: newShapePreview.x,
          y: newShapePreview.y,
          width: newShapePreview.width,
          height: newShapePreview.height,
          rotation: 0,
          zIndex: 0,
          fill: DEFAULT_SHAPE_FILL,
          stroke: DEFAULT_SHAPE_STROKE,
          strokeWidth: DEFAULT_SHAPE_STROKE_WIDTH,
          cornerRadius: DEFAULT_CORNER_RADIUS,
        };
        await addShape(rectShape);
      } else if (selectedTool === 'circle') {
        // Create circle based on drag size
        const radius = Math.max(newShapePreview.width, newShapePreview.height) / 2;
        const circleShape: Omit<CircleShape, 'id' | 'name' | 'isLocked' | 'lockedBy' | 'lockedByName'> = {
          type: 'circle',
          x: newShapePreview.x + newShapePreview.width / 2,
          y: newShapePreview.y + newShapePreview.height / 2,
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

    // Reset drawing state
    setIsDrawing(false);
    setDrawStart(null);
    setNewShapePreview(null);
  }, [isDrawing, newShapePreview, addShape, selectedTool]);

  return {
    isDrawing,
    newShapePreview,
    handleDrawStart,
    handleDrawMove,
    handleDrawEnd,
  };
}

