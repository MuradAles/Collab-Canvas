/**
 * useShapeInteraction Hook
 * Manages shape drag and transform interactions
 */

import { useCallback, useRef, useEffect } from 'react';
import type Konva from 'konva';
import type { Shape } from '../types';
import { updateDragPosition, clearDragPosition, initializeSelectionDrag, updateSelectionDragDelta, clearSelectionDrag } from '../services/dragSync';
import { updateCursorPosition } from '../services/presence';
import { updateShapesBatch } from '../services/canvas';
import { screenToCanvas, generateUserColor } from '../utils/helpers';
import { MULTI_DRAG_THRESHOLD, DRAG_THROTTLE_MS } from '../utils/constants';

interface UseShapeInteractionProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  stagePosition: { x: number; y: number };
  stageScale: number;
  currentUserId?: string;
  currentUserName?: string;
  updateShape: (id: string, updates: Partial<Shape>, localOnly?: boolean) => Promise<void>;
  updateShapesBatchLocal: (updates: Array<{ id: string; updates: Partial<Shape> }>) => void;
  selectedIds: string[];
  shapes: Shape[];
  clearLocalUpdates: (shapeIds: string[]) => void;
}

export function useShapeInteraction({
  stageRef,
  stagePosition,
  stageScale,
  currentUserId,
  currentUserName,
  updateShape,
  updateShapesBatchLocal,
  selectedIds,
  shapes,
  clearLocalUpdates,
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
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
  } | null>(null);
  
  // Drag throttling (50ms for ALL Firebase updates - individual and selection)
  const selectionDragInitializedRef = useRef<boolean>(false);
  const lastDragUpdateRef = useRef<number>(0);
  
  // Track initial positions of all selected shapes for group drag
  // For lines, store endpoints; for others, store x, y
  const initialPositionsRef = useRef<Map<string, { x: number; y: number; x1?: number; y1?: number; x2?: number; y2?: number }>>(new Map());
  
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
   * NEW: Initialize selection drag for 10+ shapes with delta-based system
   */
  const handleShapeDragStart = useCallback(
    async (shapeId: string) => {
      if (!currentUserId || !currentUserName) return;
      
      // CRITICAL: Read from ref to get the LATEST selection, not stale closure value
      const latestSelectedIds = selectedIdsRef.current;
      const latestShapes = shapesRef.current;
      
      // Store initial positions of all selected shapes
      initialPositionsRef.current.clear();
      selectionDragInitializedRef.current = false;
      
      const initialPositions: Record<string, { x: number; y: number; x1?: number; y1?: number; x2?: number; y2?: number }> = {};
      
      latestSelectedIds.forEach(id => {
        const shape = latestShapes.find(s => s.id === id);
        if (shape) {
          // Lines store endpoints for accurate delta calculation
          if (shape.type === 'line') {
            const centerX = (shape.x1 + shape.x2) / 2;
            const centerY = (shape.y1 + shape.y2) / 2;
            const pos = { 
              x: centerX, 
              y: centerY,
              x1: shape.x1,
              y1: shape.y1,
              x2: shape.x2,
              y2: shape.y2
            };
            initialPositionsRef.current.set(id, pos);
            initialPositions[id] = pos;
          } else {
            const pos = { x: shape.x, y: shape.y };
            initialPositionsRef.current.set(id, pos);
            initialPositions[id] = pos;
          }
        }
      });
      
      try {
        // Check if using selection drag (10+ shapes)
        const useSelectionDrag = latestSelectedIds.length >= MULTI_DRAG_THRESHOLD;
        
        if (useSelectionDrag) {
          // Initialize selection drag in Firebase with initial positions
          await initializeSelectionDrag(
            'global-canvas-v1',
            currentUserId,
            currentUserName,
            generateUserColor(currentUserId),
            latestSelectedIds,
            initialPositions
          );
          selectionDragInitializedRef.current = true;
        } else {
          // Mark dragged shape as being dragged (old system for <10 shapes)
          await updateShape(shapeId, {
            isDragging: true,
            draggingBy: currentUserId,
            draggingByName: currentUserName,
          }, true);
        }

        // Update cursor position at drag start
        updateCurrentCursorPosition();
      } catch (error) {
        console.error('Failed to start drag:', error);
      }
    },
    [currentUserId, currentUserName, updateShape, updateCurrentCursorPosition]
  );

  /**
   * Handle shape drag move - update position in real-time using RTDB
   * Throttled with RAF for 60fps max to prevent FPS drops
   * OPTIMIZED: Uses selection drag (bounding box) for 10+ shapes
   * NEW (PR #12): Move all selected shapes together if dragging in multi-selection
   */
  const handleShapeDragMove = useCallback(
    (shapeId: string, x: number, y: number) => {
      if (!currentUserId || !currentUserName) return;
      
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
          
          // OPTIMIZATION: Use selection drag for 10+ shapes
          const useSelectionDrag = isMultiDrag && storedShapeCount >= MULTI_DRAG_THRESHOLD;
          
          if (useSelectionDrag) {
            // SELECTION DRAG MODE (10+ shapes) - Delta-based with 50ms throttle
            const initialPos = initialPositionsRef.current.get(pending.shapeId);
            if (initialPos) {
              const deltaX = pending.x - initialPos.x;
              const deltaY = pending.y - initialPos.y;
              
              // OPTIMIZATION: Send delta to Firebase only every 50ms
              const now = Date.now();
              const timeSinceLastUpdate = now - lastDragUpdateRef.current;
              
              if (timeSinceLastUpdate >= DRAG_THROTTLE_MS) {
                // Send delta update to Firebase (throttled to 20 updates/sec)
                updateSelectionDragDelta(
                  'global-canvas-v1',
                  currentUserId,
                  deltaX,
                  deltaY
                ).catch(console.error);
                
                lastDragUpdateRef.current = now;
              }
              
              // CRITICAL: Still update local state immediately for smooth local dragging
              // Collect all local state updates
              const localStateUpdates: Array<{ id: string; updates: Partial<Shape> }> = [];
              
              initialPositionsRef.current.forEach((initialShapePos, id) => {
                if (id !== pending.shapeId) {
                  // Update OTHER shapes (not the dragged one - Konva handles that)
                  if (initialShapePos.x1 !== undefined && initialShapePos.y1 !== undefined && 
                      initialShapePos.x2 !== undefined && initialShapePos.y2 !== undefined) {
                    // Line
                    localStateUpdates.push({
                      id,
                      updates: { 
                        x1: initialShapePos.x1 + deltaX,
                        y1: initialShapePos.y1 + deltaY,
                        x2: initialShapePos.x2 + deltaX,
                        y2: initialShapePos.y2 + deltaY
                      } as Partial<Shape>
                    });
                  } else {
                    // Regular shapes
                    localStateUpdates.push({
                      id,
                      updates: { 
                        x: initialShapePos.x + deltaX, 
                        y: initialShapePos.y + deltaY 
                      }
                    });
                  }
                }
              });
              
              // Batch update local state for smooth dragging (NO FIREBASE - just memory)
              if (localStateUpdates.length > 0) {
                updateShapesBatchLocal(localStateUpdates);
              }
            }
          } else if (isMultiDrag) {
            // INDIVIDUAL DRAG MODE (< threshold shapes) - Still throttled to 50ms
            // Calculate delta from initial position
            const initialPos = initialPositionsRef.current.get(pending.shapeId);
            if (initialPos) {
              const deltaX = pending.x - initialPos.x;
              const deltaY = pending.y - initialPos.y;
              
              // THROTTLE: Only send to Firebase every 50ms
              const now = Date.now();
              const timeSinceLastUpdate = now - lastDragUpdateRef.current;
              const shouldSendToFirebase = timeSinceLastUpdate >= DRAG_THROTTLE_MS;
              
              // OPTIMIZATION: Collect all RTDB updates and local state updates first
              const rtdbUpdates: Promise<void>[] = [];
              const localStateUpdates: Array<{ id: string; updates: Partial<Shape> }> = [];
              
              // Move all stored shapes by the same delta
              initialPositionsRef.current.forEach((initialShapePos, id) => {
                // For lines, use INITIAL stored endpoints and apply delta
                if (initialShapePos.x1 !== undefined && initialShapePos.y1 !== undefined && 
                    initialShapePos.x2 !== undefined && initialShapePos.y2 !== undefined) {
                  // Calculate new line endpoints from INITIAL position + delta (not current position!)
                  const newX1 = initialShapePos.x1 + deltaX;
                  const newY1 = initialShapePos.y1 + deltaY;
                  const newX2 = initialShapePos.x2 + deltaX;
                  const newY2 = initialShapePos.y2 + deltaY;
                  const midX = (newX1 + newX2) / 2;
                  const midY = (newY1 + newY2) / 2;
                  
                  // Send RTDB only if throttle time has elapsed
                  if (shouldSendToFirebase) {
                    rtdbUpdates.push(
                      updateDragPosition(
                        'global-canvas-v1',
                        id,
                        midX,
                        midY,
                        currentUserId,
                        currentUserName || 'Unknown User',
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        newX1,
                        newY1,
                        newX2,
                        newY2
                      )
                    );
                  }
                  
                  // Update local state for OTHER lines (not the dragged one)
                  // The dragged line is handled by Konva's offset until drag ends
                  if (id !== pending.shapeId) {
                    localStateUpdates.push({
                      id,
                      updates: { 
                        x1: newX1,
                        y1: newY1,
                        x2: newX2,
                        y2: newY2
                      } as Partial<Shape>
                    });
                  }
                } else {
                  // Regular shapes use x, y
                  // Send RTDB only if throttle time has elapsed
                  if (shouldSendToFirebase) {
                    rtdbUpdates.push(
                      updateDragPosition(
                        'global-canvas-v1',
                        id,
                        initialShapePos.x + deltaX,
                        initialShapePos.y + deltaY,
                        currentUserId,
                        currentUserName || 'Unknown User'
                      )
                    );
                  }
                  
                  // ONLY update local state for OTHER shapes (not the one being dragged)
                  // Konva handles the dragged shape automatically, we update the others
                  if (id !== pending.shapeId) {
                    localStateUpdates.push({
                      id,
                      updates: { 
                        x: initialShapePos.x + deltaX, 
                        y: initialShapePos.y + deltaY 
                      }
                    });
                  }
                }
              });
              
              // Execute all RTDB updates (fire-and-forget) and update timestamp
              if (rtdbUpdates.length > 0) {
                Promise.all(rtdbUpdates).catch(console.error);
                lastDragUpdateRef.current = now;
              }
              
              // OPTIMIZATION: Batch all local state updates into a single operation
              // This prevents multiple React re-renders (N updates -> 1 re-render)
              if (localStateUpdates.length > 0) {
                updateShapesBatchLocal(localStateUpdates);
              }
            }
          } else {
            // Single shape drag - Also throttled to 50ms
            // Check if it's a line - lines need RTDB updates with calculated endpoints
            const shape = shapesRef.current.find(s => s.id === pending.shapeId);
            
            // THROTTLE: Only send to Firebase every 50ms
            const now = Date.now();
            const timeSinceLastUpdate = now - lastDragUpdateRef.current;
            
            if (shape && shape.type === 'line') {
              // For lines, only send RTDB update with coordinates
              // Don't update local state - Konva handles visual dragging with offset
              // We'll apply final position at drag end
              const initialPos = initialPositionsRef.current.get(pending.shapeId);
              if (initialPos && initialPos.x1 !== undefined && initialPos.y1 !== undefined &&
                  initialPos.x2 !== undefined && initialPos.y2 !== undefined) {
                const deltaX = pending.x - initialPos.x;
                const deltaY = pending.y - initialPos.y;
                
                const newX1 = initialPos.x1 + deltaX;
                const newY1 = initialPos.y1 + deltaY;
                const newX2 = initialPos.x2 + deltaX;
                const newY2 = initialPos.y2 + deltaY;
                
                if (timeSinceLastUpdate >= DRAG_THROTTLE_MS) {
                  // Update RTDB for network sync (other users see the movement)
                  updateDragPosition(
                    'global-canvas-v1',
                    pending.shapeId,
                    pending.x,
                    pending.y,
                    currentUserId,
                    currentUserName || 'Unknown User',
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    newX1,
                    newY1,
                    newX2,
                    newY2
                  ).catch(console.error);
                  
                  lastDragUpdateRef.current = now;
                }
              }
            } else {
              // Regular shapes (circle, rectangle, text)
              // THROTTLE: Only send to Firebase every 50ms (using same timing check as above)
              if (timeSinceLastUpdate >= DRAG_THROTTLE_MS) {
                // Update RTDB for network sync
                updateDragPosition(
                  'global-canvas-v1',
                  pending.shapeId,
                  pending.x,
                  pending.y,
                  currentUserId,
                  currentUserName || 'Unknown User'
                ).catch(console.error);
                
                lastDragUpdateRef.current = now;
              }
              
              // ALWAYS update local state for smooth dragging without Firebase lag
              // This prevents React re-renders from resetting Konva's visual position
              updateShape(pending.shapeId, {
                x: pending.x,
                y: pending.y
              }, true).catch(console.error); // localOnly: true for instant feedback
            }
          }
          
          pendingDragUpdateRef.current = null;
        }
        dragRafRef.current = null;
      });
    },
    [currentUserId, currentUserName, updateShape, updateShapesBatchLocal]
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
        // Check if this was a multi-shape drag with 10+ shapes (selection drag mode)
        const wasSelectionDrag = initialPositionsRef.current.size >= MULTI_DRAG_THRESHOLD;
        
        // If multiple shapes are selected and this shape is in the selection, save all selected shapes
        if (selectedIds.length > 1 && selectedIds.includes(shapeId)) {
          // Calculate delta from initial position
          const initialPos = initialPositionsRef.current.get(shapeId);
          if (initialPos) {
            const deltaX = x - initialPos.x;
            const deltaY = y - initialPos.y;
            
            // OPTIMIZATION: Use batch writes for all shapes (1 network request instead of N!)
            const batchUpdates: Array<{ shapeId: string; updates: Partial<Shape> }> = [];
            
            selectedIds.forEach((id) => {
              const initialShapePos = initialPositionsRef.current.get(id);
              const shape = shapesRef.current.find(s => s.id === id);
              
              if (initialShapePos && shape) {
                // Handle lines differently - they use x1, y1, x2, y2
                if (shape.type === 'line' && initialShapePos.x1 !== undefined && 
                    initialShapePos.y1 !== undefined && initialShapePos.x2 !== undefined && 
                    initialShapePos.y2 !== undefined) {
                  // CRITICAL: Use INITIAL position + delta, not current position!
                  // Current position already includes local updates from drag
                  batchUpdates.push({
                    shapeId: id,
                    updates: {
                      x1: initialShapePos.x1 + deltaX,
                      y1: initialShapePos.y1 + deltaY,
                      x2: initialShapePos.x2 + deltaX,
                      y2: initialShapePos.y2 + deltaY,
                      isDragging: false,
                      draggingBy: null,
                      draggingByName: null,
                    },
                  });
                } else {
                  batchUpdates.push({
                    shapeId: id,
                    updates: {
                      x: initialShapePos.x + deltaX,
                      y: initialShapePos.y + deltaY,
                      isDragging: false,
                      draggingBy: null,
                      draggingByName: null,
                    },
                  });
                }
              }
            });
            
            // Save all shapes in a single batch write
            if (batchUpdates.length > 0) {
              console.log(`🔥 [FIREBASE WRITE] Firestore BATCH - Saving ${batchUpdates.length} shapes (Selection Drag: ${wasSelectionDrag})`);
              await updateShapesBatch(batchUpdates);
              console.log(`✅ [FIREBASE WRITE] Firestore batch complete`);
            }
            
            // CRITICAL FIX: Clear local updates for all selected shapes
            // This prevents stale local state from causing teleportation on next click
            clearLocalUpdates(selectedIds);
            
            // Clear RTDB state based on drag mode
            if (wasSelectionDrag) {
              // Clear selection drag (only 1 entry to clear)
              await clearSelectionDrag('global-canvas-v1', currentUserId);
            } else {
              // Clear individual drag positions for each shape
              await Promise.all(
                selectedIds.map((id) => clearDragPosition('global-canvas-v1', id))
              );
            }
          }
        } else {
          // Single shape drag - save only the dragged shape
          // Note: For lines, the Shape component already called onTransformEnd with x1, y1, x2, y2
          // so we don't need to update x, y here. Just clear the drag state.
          const shape = shapesRef.current.find(s => s.id === shapeId);
          if (shape && shape.type !== 'line') {
            await updateShape(shapeId, {
              x,
              y,
              isDragging: false,
              draggingBy: null,
              draggingByName: null,
            });
          } else {
            // For lines, just clear drag state (coordinates already updated via onTransformEnd)
            await updateShape(shapeId, {
              isDragging: false,
              draggingBy: null,
              draggingByName: null,
            });
          }
          
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
    (shapeId: string, x: number, y: number, rotation: number, width?: number, height?: number, radius?: number, fontSize?: number, x1?: number, y1?: number, x2?: number, y2?: number) => {
      if (!currentUserId) return;
      
      // Cancel any pending RAF
      if (dragRafRef.current !== null) {
        cancelAnimationFrame(dragRafRef.current);
      }
      
      // Store pending update (with transformation data)
      pendingDragUpdateRef.current = { shapeId, x, y, rotation, width, height, radius, fontSize, x1, y1, x2, y2 };
      
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
            pending.fontSize,
            pending.x1,
            pending.y1,
            pending.x2,
            pending.y2
          ).catch(console.error);
          
          // For line anchor dragging, update local state for immediate visual feedback
          if (pending.x1 !== undefined && pending.y1 !== undefined && 
              pending.x2 !== undefined && pending.y2 !== undefined) {
            updateShape(pending.shapeId, {
              x1: pending.x1,
              y1: pending.y1,
              x2: pending.x2,
              y2: pending.y2,
            } as Partial<Shape>, true).catch(console.error); // localOnly: true for instant feedback
          }
          
          // ALSO update cursor position during transformation
          updateCurrentCursorPosition();
          
          pendingDragUpdateRef.current = null;
        }
        dragRafRef.current = null;
      });
    },
    [currentUserId, currentUserName, updateCurrentCursorPosition, updateShape]
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

