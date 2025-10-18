/**
 * Shape Locking Hook
 * Handles shape locking and unlocking for collaboration
 */

import { useCallback } from 'react';
import type { User } from '../../types';
import {
  lockShape as lockShapeInFirestore,
  unlockShape as unlockShapeInFirestore,
} from '../../services/canvas';

export function useShapeLocking(currentUser: User | null) {
  /**
   * Locks a shape when user selects or starts dragging
   */
  const lockShape = useCallback(
    async (id: string, userId: string, userName: string) => {
      if (!currentUser) {
        throw new Error('Must be logged in to lock shapes');
      }

      const maxRetries = 3;
      let retryCount = 0;
      
      while (retryCount < maxRetries) {
        try {
          await lockShapeInFirestore(id, userId, userName);
          return;
        } catch (error) {
          retryCount++;
          console.warn(`Lock attempt ${retryCount} failed for shape ${id}:`, error);
          
          if (retryCount >= maxRetries) {
            console.error('Failed to lock shape after all retries:', error);
            if (error instanceof Error) {
              console.warn('Lock operation failed:', error.message);
            }
            throw error;
          }
          
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 100));
        }
      }
    },
    [currentUser]
  );

  /**
   * Unlocks a shape when user deselects or stops dragging
   */
  const unlockShape = useCallback(
    async (id: string) => {
      if (!currentUser) {
        return;
      }

      try {
        await unlockShapeInFirestore(id, currentUser.uid);
      } catch (error) {
        console.error('Failed to unlock shape:', id, error);
        throw error;
      }
    },
    [currentUser]
  );

  return {
    lockShape,
    unlockShape,
  };
}

