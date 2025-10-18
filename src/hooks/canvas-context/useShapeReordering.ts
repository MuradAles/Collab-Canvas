/**
 * Shape Reordering Hook
 * Handles shape reordering and duplication
 */

import { useCallback } from 'react';
import type { Shape, User, LineShape } from '../../types';
import {
  reorderShapes as reorderShapesInFirestore,
  createShapesBatch as createShapesBatchInFirestore,
} from '../../services/canvas';
import { generateId } from '../../utils/helpers';

export function useShapeReordering(
  currentUser: User | null,
  shapes: Shape[],
  selectMultipleShapes: (ids: string[], addToSelection: boolean) => Promise<void>
) {
  /**
   * Reorders shapes (for z-index management)
   */
  const reorderShapes = useCallback(
    async (newOrder: Shape[]) => {
      if (!currentUser) {
        throw new Error('Must be logged in to reorder shapes');
      }

      try {
        await reorderShapesInFirestore(newOrder);
      } catch (error) {
        console.error('Failed to reorder shapes:', error);
        throw error;
      }
    },
    [currentUser]
  );

  /**
   * Duplicates selected shapes
   */
  const duplicateShapes = useCallback(
    async (shapeIds: string[]): Promise<string[]> => {
      if (!currentUser) {
        throw new Error('Must be logged in to duplicate shapes');
      }

      if (shapeIds.length === 0) {
        return [];
      }

      const newShapeIds: string[] = [];
      const duplicatedShapes: Shape[] = [];
      const OFFSET = 20;

      try {
        const maxZIndex = shapes.length > 0 
          ? Math.max(...shapes.map(s => s.zIndex)) 
          : -1;

        for (const shapeId of shapeIds) {
          const originalShape = shapes.find(s => s.id === shapeId);
          if (!originalShape) continue;

          const newId = generateId();

          // Generate duplicate name
          let newName: string;
          const copyMatch = originalShape.name.match(/^(.+?)(?: Copy (\d+))?$/);
          if (copyMatch) {
            const baseName = copyMatch[1];
            const copyNumber = copyMatch[2] ? parseInt(copyMatch[2], 10) + 1 : 2;
            
            if (baseName.match(/^(Rectangle|Circle|Text|Line) \d+$/)) {
              newName = copyNumber === 2 ? `${baseName} Copy` : `${baseName} Copy ${copyNumber}`;
            } else {
              newName = copyNumber === 2 ? `${baseName} Copy` : `${baseName} Copy ${copyNumber}`;
            }
          } else {
            newName = `${originalShape.name} Copy`;
          }

          // Create duplicate shape with offset position
          let duplicateShape: Shape;
          
          if (originalShape.type === 'line') {
            duplicateShape = {
              ...originalShape,
              id: newId,
              name: newName,
              x1: originalShape.x1 + OFFSET,
              y1: originalShape.y1 + OFFSET,
              x2: originalShape.x2 + OFFSET,
              y2: originalShape.y2 + OFFSET,
              zIndex: maxZIndex + duplicatedShapes.length + 1,
              isLocked: false,
              lockedBy: null,
              lockedByName: null,
            } as LineShape;
          } else {
            duplicateShape = {
              ...originalShape,
              id: newId,
              name: newName,
              x: originalShape.x + OFFSET,
              y: originalShape.y + OFFSET,
              zIndex: maxZIndex + duplicatedShapes.length + 1,
              isLocked: false,
              lockedBy: null,
              lockedByName: null,
            } as Shape;
          }

          duplicatedShapes.push(duplicateShape);
          newShapeIds.push(newId);
        }

        await createShapesBatchInFirestore(duplicatedShapes);
        await selectMultipleShapes(newShapeIds, false);

        return newShapeIds;
      } catch (error) {
        console.error('Failed to duplicate shapes:', error);
        throw error;
      }
    },
    [currentUser, shapes, selectMultipleShapes]
  );

  return {
    reorderShapes,
    duplicateShapes,
  };
}

