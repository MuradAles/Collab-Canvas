/**
 * useShapeInteraction Hook
 * Manages shape drag and transform interactions
 */

import { useCallback } from 'react';
import type Konva from 'konva';
import type { Shape } from '../types';
import { updateDragPosition, clearDragPosition } from '../services/dragSync';
import { updateCursorPosition } from '../services/presence';
import { screenToCanvas } from '../utils/helpers';

interface UseShapeInteractionProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  stagePosition: { x: number; y: number };
  stageScale: number;
  currentUserId?: string;
  currentUserName?: string;
  updateShape: (id: string, updates: Partial<Shape>) => Promise<void>;
}

export function useShapeInteraction({
  stageRef,
  stagePosition,
  stageScale,
  currentUserId,
  currentUserName,
  updateShape,
}: UseShapeInteractionProps) {
  
  /**
   * Update cursor position based on current mouse position
   */
  const updateCurrentCursorPosition = useCallback(() => {
    if (!currentUserId) return;
    
    const stage = stageRef.current;
    if (stage) {
      const pointer = stage.getPointerPosition();
      if (pointer) {
        const canvasPos = screenToCanvas(
          pointer.x,
          pointer.y,
          stagePosition.x,
          stagePosition.y,
          stageScale
        );
        updateCursorPosition(currentUserId, canvasPos.x, canvasPos.y);
      }
    }
  }, [currentUserId, stageRef, stagePosition, stageScale]);

  /**
   * Handle shape drag start - mark shape as being dragged
   * Also update cursor position at drag start
   */
  const handleShapeDragStart = useCallback(
    async (shapeId: string) => {
      if (!currentUserId) return;
      
      try {
        // Mark shape as being dragged by current user
        await updateShape(shapeId, {
          isDragging: true,
          draggingBy: currentUserId,
          draggingByName: currentUserName || 'Unknown User',
        });

        // Update cursor position at drag start
        updateCurrentCursorPosition();
      } catch (error) {
        console.error('Failed to mark shape as dragging:', error);
      }
    },
    [currentUserId, currentUserName, updateShape, updateCurrentCursorPosition]
  );

  /**
   * Handle shape drag move - update position in real-time using RTDB
   * No throttling for sub-100ms latency
   * ALSO update cursor position during drag for smooth tracking
   */
  const handleShapeDragMove = useCallback(
    (shapeId: string, x: number, y: number) => {
      if (!currentUserId) return;
      
      // Update shape position in RTDB
      updateDragPosition(
        'global-canvas-v1',
        shapeId,
        x,
        y,
        currentUserId,
        currentUserName || 'Unknown User'
      ).catch(console.error);

      // ALSO update cursor position during drag
      updateCurrentCursorPosition();
    },
    [currentUserId, currentUserName, updateCurrentCursorPosition]
  );

  /**
   * Handle shape drag end - save final position to Firestore and clear RTDB
   * Also update cursor position at drag end
   */
  const handleShapeDragEnd = useCallback(
    async (shapeId: string, x: number, y: number) => {
      if (!currentUserId) return;

      try {
        // Save final position to Firestore FIRST (prevents visual jump)
        await updateShape(shapeId, {
          x,
          y,
          isDragging: false,
          draggingBy: null,
          draggingByName: null,
        });
        
        // Then clear real-time drag position from RTDB
        await clearDragPosition('global-canvas-v1', shapeId);

        // Update cursor position at drag end
        updateCurrentCursorPosition();
      } catch (error) {
        console.error('Failed to update shape:', error);
      }
    },
    [currentUserId, updateShape, updateCurrentCursorPosition]
  );

  /**
   * Handle shape transformation - update position, rotation, and dimensions in real-time using RTDB
   * Also update cursor position during transformation
   */
  const handleShapeTransform = useCallback(
    (shapeId: string, x: number, y: number, rotation: number, width?: number, height?: number, radius?: number, fontSize?: number) => {
      if (!currentUserId) return;
      
      // Update shape transformation in RTDB (position, rotation, dimensions)
      updateDragPosition(
        'global-canvas-v1',
        shapeId,
        x,
        y,
        currentUserId,
        currentUserName || 'Unknown User',
        rotation,
        width,
        height,
        radius,
        fontSize
      ).catch(console.error);

      // ALSO update cursor position during transformation
      updateCurrentCursorPosition();
    },
    [currentUserId, currentUserName, updateCurrentCursorPosition]
  );

  /**
   * Handle shape transform end (resize/rotation)
   * Also update cursor position after transform and clear RTDB state
   */
  const handleShapeTransformEnd = useCallback(
    async (shapeId: string, updates: { x?: number; y?: number; width?: number; height?: number; radius?: number; fontSize?: number; rotation?: number }) => {
      if (!currentUserId) return;

      try {
        // Save final state to Firestore
        await updateShape(shapeId, updates);
        
        // Clear real-time drag/rotation position from RTDB
        await clearDragPosition('global-canvas-v1', shapeId);

        // Update cursor position after transform
        updateCurrentCursorPosition();
      } catch (error) {
        console.error('Failed to update shape:', error);
      }
    },
    [updateShape, currentUserId, updateCurrentCursorPosition]
  );

  return {
    handleShapeDragStart,
    handleShapeDragMove,
    handleShapeDragEnd,
    handleShapeTransform,
    handleShapeTransformEnd,
  };
}

