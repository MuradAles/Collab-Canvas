/**
 * Shape Selection Hook
 * Handles shape selection and multi-selection with locking
 */

import { useCallback } from 'react';
import type { Shape, User } from '../../types';
import {
  lockShapesBatch,
  unlockShapesBatch,
} from '../../services/canvas';

export function useShapeSelection(
  currentUser: User | null,
  shapes: Shape[],
  selectedIdsRef: React.MutableRefObject<string[]>,
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>,
  lockShape: (id: string, userId: string, userName: string) => Promise<void>,
  unlockShape: (id: string) => Promise<void>
) {
  /**
   * Sets the selected shape IDs
   * Locks shapes on selection, unlocks deselected shapes
   */
  const selectShape = useCallback(async (id: string | null, addToSelection = false) => {
    const currentSelectedIds = selectedIdsRef.current;
    
    if (!currentUser) return;

    // If clicking background (id = null), deselect all
    if (id === null) {
      const shapesToUnlock = [...currentSelectedIds];
      
      setSelectedIds([]);
      selectedIdsRef.current = [];
      
      if (shapesToUnlock.length > 0) {
        try {
          await unlockShapesBatch(shapesToUnlock, currentUser.uid);
        } catch (error) {
          console.error('Failed to unlock shapes:', error);
        }
      }
      return;
    }

    // Check if shape is locked by another user
    const shape = shapes.find(s => s.id === id);
    if (shape?.isLocked && shape.lockedBy && shape.lockedBy !== currentUser.uid) {
      return;
    }

    // If addToSelection (Shift+Click)
    if (addToSelection) {
      const isAlreadySelected = currentSelectedIds.includes(id);
      
      if (isAlreadySelected) {
        // Deselect this shape
        const newSelection = currentSelectedIds.filter(shapeId => shapeId !== id);
        setSelectedIds(newSelection);
        selectedIdsRef.current = newSelection;
        try {
          await unlockShape(id);
        } catch (error) {
          console.error('Failed to unlock shape:', error);
        }
      } else {
        // Add to selection
        const newSelection = [...currentSelectedIds, id];
        setSelectedIds(newSelection);
        selectedIdsRef.current = newSelection;
        try {
          await lockShape(id, currentUser.uid, currentUser.displayName || 'Unknown');
        } catch (error) {
          console.error('Failed to lock shape:', error);
          const revertedSelection = currentSelectedIds;
          setSelectedIds(revertedSelection);
          selectedIdsRef.current = revertedSelection;
        }
      }
    } else {
      // Normal selection (replace current selection)
      const previousSelection = [...currentSelectedIds];
      
      // Unlock all previously selected shapes (except the new one)
      const shapesToUnlock = previousSelection.filter(shapeId => shapeId !== id);
      if (shapesToUnlock.length > 0) {
        try {
          await unlockShapesBatch(shapesToUnlock, currentUser.uid);
        } catch (error) {
          console.error('Failed to unlock previous shapes:', error);
        }
      }
      
      setSelectedIds([id]);
      selectedIdsRef.current = [id];
      
      // Lock the new shape if it wasn't already selected
      const needsLocking = !previousSelection.includes(id);
      
      if (needsLocking) {
        try {
          await lockShape(id, currentUser.uid, currentUser.displayName || 'Unknown');
        } catch (error) {
          console.error('Failed to lock shape:', error);
          setSelectedIds(previousSelection);
          selectedIdsRef.current = previousSelection;
        }
      }
    }
  }, [currentUser, shapes, selectedIdsRef, setSelectedIds, lockShape, unlockShape]);

  /**
   * Select multiple shapes atomically (batch selection)
   */
  const selectMultipleShapes = useCallback(async (ids: string[], addToSelection = false) => {
    if (!currentUser || ids.length === 0) return;

    const currentSelectedIds = selectedIdsRef.current;

    // Filter out shapes locked by other users
    const selectableIds = ids.filter(id => {
      const shape = shapes.find(s => s.id === id);
      return !shape?.isLocked || !shape.lockedBy || shape.lockedBy === currentUser.uid;
    });

    if (selectableIds.length === 0) return;

    // Calculate what needs to be locked/unlocked
    let newSelection: string[];
    let shapesToLock: string[];
    let shapesToUnlock: string[];

    if (addToSelection) {
      newSelection = [...new Set([...currentSelectedIds, ...selectableIds])];
      shapesToLock = selectableIds.filter(id => !currentSelectedIds.includes(id));
      shapesToUnlock = [];
    } else {
      newSelection = selectableIds;
      shapesToLock = selectableIds.filter(id => !currentSelectedIds.includes(id));
      shapesToUnlock = currentSelectedIds.filter(id => !selectableIds.includes(id));
    }

    // Update state immediately
    setSelectedIds(newSelection);
    selectedIdsRef.current = newSelection;

    // Batch lock/unlock with retry logic
    const executeWithRetry = async (operation: () => Promise<void>, operationName: string, maxRetries = 3) => {
      let retryCount = 0;
      while (retryCount < maxRetries) {
        try {
          await operation();
          return;
        } catch (error) {
          retryCount++;
          console.warn(`${operationName} attempt ${retryCount} failed:`, error);
          if (retryCount >= maxRetries) {
            console.error(`${operationName} failed after all retries:`, error);
            return;
          }
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 50));
        }
      }
    };

    Promise.all([
      shapesToLock.length > 0
        ? executeWithRetry(
            () => lockShapesBatch(shapesToLock, currentUser.uid, currentUser.displayName || 'Unknown'),
            'Batch lock'
          )
        : Promise.resolve(),
      shapesToUnlock.length > 0
        ? executeWithRetry(
            () => unlockShapesBatch(shapesToUnlock, currentUser.uid),
            'Batch unlock'
          )
        : Promise.resolve(),
    ]).catch(console.error);
  }, [currentUser, shapes, selectedIdsRef, setSelectedIds]);

  return {
    selectShape,
    selectMultipleShapes,
  };
}

