/**
 * useShapeInteraction Hook
 * Manages shape drag and transform interactions
 */

import { useCallback, useRef, useEffect } from 'react';
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
  selectedIds: string[];
  shapes: Shape[];
}

export function useShapeInteraction({
  stageRef,
  stagePosition,
  stageScale,
  currentUserId,
  currentUserName,
  updateShape,
  selectedIds,
  shapes,
}: UseShapeInteractionProps) {
  
  // RAF throttling for drag updates to prevent FPS drops
  const dragRafRef = useRef<number | null>(null);
  const pendingDragUpdateRef = useRef<{
    shapeId: string;
    x: number;
    y: number;
    rotation?: number;
    width?: number;
    height?: number;
    radius?: number;
    fontSize?: number;
  } | null>(null);
  
  // Track initial positions of all selected shapes for group drag
  const initialPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  
  // CRITICAL FIX: Keep a ref with the latest selectedIds to avoid stale closure issues
  // When you quickly select shapes and start dragging, the callback might have old selectedIds
  const selectedIdsRef = useRef<string[]>(selectedIds);
  const shapesRef = useRef<Shape[]>(shapes);
  
  // Update refs whenever selectedIds or shapes change
  useEffect(() => {
    selectedIdsRef.current = selectedIds;
    shapesRef.current = shapes;
  }, [selectedIds, shapes]);
  
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
   * NEW (PR #12): Store initial positions of all selected shapes for group drag
   */
  const handleShapeDragStart = useCallback(
    async (shapeId: string) => {
      if (!currentUserId) return;
      
      // CRITICAL: Read from ref to get the LATEST selection, not stale closure value
      const latestSelectedIds = selectedIdsRef.current;
      const latestShapes = shapesRef.current;
      
      // Store initial positions of all selected shapes
      initialPositionsRef.current.clear();
      
      latestSelectedIds.forEach(id => {
        const shape = latestShapes.find(s => s.id === id);
        if (shape) {
          initialPositionsRef.current.set(id, { x: shape.x, y: shape.y });
        }
      });
      
      try {
        // Mark dragged shape as being dragged by current user
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
   * Throttled with RAF for 60fps max to prevent FPS drops
   * ALSO update cursor position during drag for smooth tracking
   * NEW (PR #12): Move all selected shapes together if dragging in multi-selection
   */
  const handleShapeDragMove = useCallback(
    (shapeId: string, x: number, y: number) => {
      if (!currentUserId) return;
      
      // Cancel any pending RAF
      if (dragRafRef.current !== null) {
        cancelAnimationFrame(dragRafRef.current);
      }
      
      // Store pending update
      pendingDragUpdateRef.current = { shapeId, x, y };
      
      // Schedule update on next frame (max 60fps)
      dragRafRef.current = requestAnimationFrame(() => {
        const pending = pendingDragUpdateRef.current;
        if (pending) {
          // Check if we have multiple shapes stored (indicates multi-selection drag)
          const storedShapeCount = initialPositionsRef.current.size;
          const isMultiDrag = storedShapeCount > 1 && initialPositionsRef.current.has(pending.shapeId);
          
          // If multiple shapes stored and this shape is in them, move all stored shapes
          if (isMultiDrag) {
            // Calculate delta from initial position
            const initialPos = initialPositionsRef.current.get(pending.shapeId);
            if (initialPos) {
              const deltaX = pending.x - initialPos.x;
              const deltaY = pending.y - initialPos.y;
              
              // Move all stored shapes by the same delta
              initialPositionsRef.current.forEach((initialShapePos, id) => {
                // Update RTDB for real-time sync with other users
                updateDragPosition(
                  'global-canvas-v1',
                  id,
                  initialShapePos.x + deltaX,
                  initialShapePos.y + deltaY,
                  currentUserId,
                  currentUserName || 'Unknown User'
                ).catch(console.error);
                
                // ONLY update local state for OTHER shapes (not the one being dragged)
                // This keeps dragging smooth - Konva handles the dragged shape, we move the others
                if (id !== pending.shapeId) {
                  updateShape(id, { 
                    x: initialShapePos.x + deltaX, 
                    y: initialShapePos.y + deltaY 
                  }, true).catch(console.error);
                }
              });
            }
          } else {
            // Single shape drag - just update RTDB, let Konva handle the visual dragging
            updateDragPosition(
              'global-canvas-v1',
              pending.shapeId,
              pending.x,
              pending.y,
              currentUserId,
              currentUserName || 'Unknown User'
            ).catch(console.error);
            
            // Don't update local state - let Konva handle smooth dragging
          }
          
          // ALSO update cursor position during drag
          updateCurrentCursorPosition();
          
          pendingDragUpdateRef.current = null;
        }
        dragRafRef.current = null;
      });
    },
    [currentUserId, currentUserName, updateCurrentCursorPosition, selectedIds, updateShape]
  );

  /**
   * Handle shape drag end - save final position to Firestore and clear RTDB
   * Also update cursor position at drag end and cancel any pending RAF
   * NEW (PR #12): Save all selected shapes' positions if dragging in multi-selection
   */
  const handleShapeDragEnd = useCallback(
    async (shapeId: string, x: number, y: number) => {
      if (!currentUserId) return;

      // Cancel any pending RAF and ensure last update is sent
      if (dragRafRef.current !== null) {
        cancelAnimationFrame(dragRafRef.current);
        dragRafRef.current = null;
      }
      
      // Send final position to RTDB before clearing
      if (pendingDragUpdateRef.current) {
        const pending = pendingDragUpdateRef.current;
        await updateDragPosition(
          'global-canvas-v1',
          pending.shapeId,
          pending.x,
          pending.y,
          currentUserId,
          currentUserName || 'Unknown User'
        ).catch(console.error);
        pendingDragUpdateRef.current = null;
      }

      try {
        // If multiple shapes are selected and this shape is in the selection, save all selected shapes
        if (selectedIds.length > 1 && selectedIds.includes(shapeId)) {
          // Calculate delta from initial position
          const initialPos = initialPositionsRef.current.get(shapeId);
          if (initialPos) {
            const deltaX = x - initialPos.x;
            const deltaY = y - initialPos.y;
            
            // Save all selected shapes' final positions to Firestore
            await Promise.all(
              selectedIds.map(async (id) => {
                const initialShapePos = initialPositionsRef.current.get(id);
                if (initialShapePos) {
                  await updateShape(id, {
                    x: initialShapePos.x + deltaX,
                    y: initialShapePos.y + deltaY,
                    isDragging: false,
                    draggingBy: null,
                    draggingByName: null,
                  });
                  
                  // Clear RTDB position for each shape
                  await clearDragPosition('global-canvas-v1', id);
                }
              })
            );
          }
        } else {
          // Single shape drag - save only the dragged shape
          await updateShape(shapeId, {
            x,
            y,
            isDragging: false,
            draggingBy: null,
            draggingByName: null,
          });
          
          // Then clear real-time drag position from RTDB
          await clearDragPosition('global-canvas-v1', shapeId);
        }

        // Clear initial positions
        initialPositionsRef.current.clear();

        // Update cursor position at drag end
        updateCurrentCursorPosition();
      } catch (error) {
        console.error('Failed to update shape:', error);
      }
    },
    [currentUserId, currentUserName, updateShape, updateCurrentCursorPosition, selectedIds]
  );

  /**
   * Handle shape transformation - update position, rotation, and dimensions in real-time using RTDB
   * Throttled with RAF for 60fps max to prevent FPS drops
   * Also update cursor position during transformation
   */
  const handleShapeTransform = useCallback(
    (shapeId: string, x: number, y: number, rotation: number, width?: number, height?: number, radius?: number, fontSize?: number) => {
      if (!currentUserId) return;
      
      // Cancel any pending RAF
      if (dragRafRef.current !== null) {
        cancelAnimationFrame(dragRafRef.current);
      }
      
      // Store pending update (with transformation data)
      pendingDragUpdateRef.current = { shapeId, x, y, rotation, width, height, radius, fontSize };
      
      // Schedule update on next frame (max 60fps)
      dragRafRef.current = requestAnimationFrame(() => {
        const pending = pendingDragUpdateRef.current;
        if (pending) {
          // Update shape transformation in RTDB (position, rotation, dimensions)
          updateDragPosition(
            'global-canvas-v1',
            pending.shapeId,
            pending.x,
            pending.y,
            currentUserId,
            currentUserName || 'Unknown User',
            pending.rotation,
            pending.width,
            pending.height,
            pending.radius,
            pending.fontSize
          ).catch(console.error);
          
          // ALSO update cursor position during transformation
          updateCurrentCursorPosition();
          
          pendingDragUpdateRef.current = null;
        }
        dragRafRef.current = null;
      });
    },
    [currentUserId, currentUserName, updateCurrentCursorPosition]
  );

  /**
   * Handle shape transform end (resize/rotation)
   * Also update cursor position after transform and clear RTDB state and cancel any pending RAF
   */
  const handleShapeTransformEnd = useCallback(
    async (shapeId: string, updates: { x?: number; y?: number; width?: number; height?: number; radius?: number; fontSize?: number; rotation?: number }) => {
      if (!currentUserId) return;

      // Cancel any pending RAF
      if (dragRafRef.current !== null) {
        cancelAnimationFrame(dragRafRef.current);
        dragRafRef.current = null;
      }
      pendingDragUpdateRef.current = null;

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

