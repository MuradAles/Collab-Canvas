/**
 * Shape Operations Hook
 * Handles CRUD operations for shapes (add, update, delete)
 */

import { useCallback, useRef } from 'react';
import type { Shape, ShapeUpdate, User } from '../../types';
import {
  createShape as createShapeInFirestore,
  updateShape as updateShapeInFirestore,
  deleteShape as deleteShapeInFirestore,
  deleteShapesBatch as deleteShapesBatchInFirestore,
  lockShape as lockShapeInFirestore,
  unlockShapesBatch,
} from '../../services/canvas';
import { generateId } from '../../utils/helpers';

export function useShapeOperations(
  currentUser: User | null,
  shapes: Shape[],
  shapeCounterRef: React.MutableRefObject<{ [key: string]: number }>,
  selectedIdsRef: React.MutableRefObject<string[]>,
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>,
  setLocalUpdates: React.Dispatch<React.SetStateAction<Map<string, Partial<Shape>>>>
) {
  /**
   * Adds a new shape to the canvas
   */
  const addShape = useCallback(
    async (
      shapeData: Omit<Shape, 'id' | 'name' | 'isLocked' | 'lockedBy' | 'lockedByName'>,
      options?: { skipAutoLock?: boolean }
    ) => {
      if (!currentUser) {
        throw new Error('Must be logged in to create shapes');
      }

      // Increment counter and generate name
      shapeCounterRef.current[shapeData.type] += 1;
      const shapeNumber = shapeCounterRef.current[shapeData.type];
      
      let name: string;
      if (shapeData.type === 'rectangle') {
        name = `Rectangle ${shapeNumber}`;
      } else if (shapeData.type === 'circle') {
        name = `Circle ${shapeNumber}`;
      } else if (shapeData.type === 'line') {
        name = `Line ${shapeNumber}`;
      } else {
        name = `Text ${shapeNumber}`;
      }

      // Calculate zIndex (new shapes go on top)
      const maxZIndex = shapes.length > 0 
        ? Math.max(...shapes.map(s => s.zIndex)) 
        : -1;

      const newShape: Shape = {
        ...shapeData,
        id: generateId(),
        name,
        zIndex: maxZIndex + 1,
        isLocked: false,
        lockedBy: null,
        lockedByName: null,
      } as Shape;

      try {
        await createShapeInFirestore(newShape);
        
        // Only auto-select and lock if not skipped (e.g., for AI-created shapes)
        if (!options?.skipAutoLock) {
          // Get previously selected shapes to unlock them
          const previousSelection = [...selectedIdsRef.current];
          
          // STEP 1: Unlock ALL previously selected shapes FIRST
          if (previousSelection.length > 0) {
            try {
              await unlockShapesBatch(previousSelection, currentUser.uid);
            } catch (error) {
              console.error('Failed to unlock previous shapes:', error);
            }
          }
          
          // STEP 2: Update selection state to the new shape
          setSelectedIds([newShape.id]);
          selectedIdsRef.current = [newShape.id];
          
          // STEP 3: Lock the newly created shape
          try {
            await lockShapeInFirestore(
              newShape.id, 
              currentUser.uid, 
              currentUser.displayName || 'Unknown User'
            );
            await new Promise(resolve => setTimeout(resolve, 50));
          } catch (error) {
            console.error('Failed to lock new shape:', error);
            setSelectedIds([]);
          }
        }
        
        return newShape.id;
      } catch (error) {
        console.error('Failed to add shape:', error);
        throw error;
      }
    },
    [currentUser, shapes, shapeCounterRef, selectedIdsRef, setSelectedIds]
  );

  /**
   * Updates an existing shape
   */
  const updateShape = useCallback(
    async (id: string, updates: ShapeUpdate, localOnly = false) => {
      if (!currentUser) {
        throw new Error('Must be logged in to update shapes');
      }

      // Always update local state first for instant feedback
      setLocalUpdates((prev) => {
        const newMap = new Map(prev);
        const existing = newMap.get(id) || {};
        newMap.set(id, { ...existing, ...updates });
        return newMap;
      });

      // If not local-only, also sync to Firebase
      if (!localOnly) {
        const maxRetries = 3;
        let retryCount = 0;
        
        while (retryCount < maxRetries) {
          try {
            await updateShapeInFirestore(id, updates);
            return;
          } catch (error) {
            retryCount++;
            console.warn(`Update attempt ${retryCount} failed for shape ${id}:`, error);
            
            if (retryCount >= maxRetries) {
              console.error('Failed to update shape after all retries:', error);
              throw error;
            }
            
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 100));
          }
        }
      }
    },
    [currentUser, setLocalUpdates]
  );

  /**
   * Updates multiple shapes at once (batch update for local state only)
   */
  const updateShapesBatchLocal = useCallback(
    (updates: Array<{ id: string; updates: Partial<Shape> }>) => {
      if (!currentUser || updates.length === 0) return;

      setLocalUpdates((prev) => {
        const newMap = new Map(prev);
        updates.forEach(({ id, updates: shapeUpdates }) => {
          const existing = newMap.get(id) || {};
          newMap.set(id, { ...existing, ...shapeUpdates });
        });
        return newMap;
      });
    },
    [currentUser, setLocalUpdates]
  );

  /**
   * Clears local updates for specific shape IDs
   */
  const clearLocalUpdates = useCallback((shapeIds: string[]) => {
    setLocalUpdates((prev) => {
      const newMap = new Map(prev);
      shapeIds.forEach(id => newMap.delete(id));
      return newMap;
    });
  }, [setLocalUpdates]);

  /**
   * Deletes a shape from the canvas
   */
  const deleteShape = useCallback(
    async (id: string) => {
      if (!currentUser) {
        throw new Error('Must be logged in to delete shapes');
      }

      try {
        await deleteShapeInFirestore(id, currentUser.uid);
        setSelectedIds((prev) => prev.filter(shapeId => shapeId !== id));
      } catch (error) {
        console.error('Failed to delete shape:', error);
        if (error instanceof Error) {
          console.warn('Delete operation failed:', error.message);
        }
      }
    },
    [currentUser, setSelectedIds]
  );

  /**
   * Deletes multiple shapes at once (batch operation)
   */
  const deleteShapes = useCallback(
    async (shapeIds: string[]) => {
      if (!currentUser) {
        throw new Error('Must be logged in to delete shapes');
      }

      if (shapeIds.length === 0) {
        return;
      }

      try {
        await deleteShapesBatchInFirestore(shapeIds, currentUser.uid);
        setSelectedIds((prev) => prev.filter(id => !shapeIds.includes(id)));
      } catch (error) {
        console.error('Failed to batch delete shapes:', error);
        if (error instanceof Error) {
          console.warn('Batch delete operation failed:', error.message);
        }
      }
    },
    [currentUser, setSelectedIds]
  );

  return {
    addShape,
    updateShape,
    updateShapesBatchLocal,
    clearLocalUpdates,
    deleteShape,
    deleteShapes,
  };
}

