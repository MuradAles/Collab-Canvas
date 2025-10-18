/**
 * Drag Sync Hook
 * Merges real-time drag positions with persistent shapes
 */

import { useMemo } from 'react';
import type { Shape, User } from '../../types';
import type { DragPosition, SelectionDrag } from '../../services/dragSync';

export function useDragSync(
  shapes: Shape[],
  dragPositions: Map<string, DragPosition>,
  selectionDrags: Map<string, SelectionDrag>,
  localUpdates: Map<string, Partial<Shape>>,
  currentUser: User | null
) {
  // Merge real-time drag positions, selection drags, and local updates with persistent shapes
  const shapesWithDragPositions = useMemo(() => {
    return shapes.map(shape => {
      const localUpdate = localUpdates.get(shape.id);
      const dragPos = dragPositions.get(shape.id);
      const isDraggedByOther = dragPos && dragPos.draggingBy !== currentUser?.uid;
      
      // Check if this shape is in a selection drag by another user
      const activeSelectionDragArray: Array<{
        deltaX: number;
        deltaY: number;
        initialPos: { x: number; y: number; x1?: number; y1?: number; x2?: number; y2?: number };
      }> = [];
      
      selectionDrags.forEach((drag) => {
        if (drag.userId !== currentUser?.uid && drag.shapeIds?.includes(shape.id)) {
          const initialPos = drag.initialPositions?.[shape.id];
          if (initialPos) {
            activeSelectionDragArray.push({
              deltaX: drag.deltaX,
              deltaY: drag.deltaY,
              initialPos,
            });
          }
        }
      });
      
      const activeSelectionDrag = activeSelectionDragArray[0] || null;
      
      const shouldApplyDragPos = isDraggedByOther;
      const shouldApplySelectionDrag = activeSelectionDrag !== null;
      
      // If no updates for this shape, return the original reference
      if (!localUpdate && !shouldApplyDragPos && !shouldApplySelectionDrag) {
        return shape;
      }
      
      let mergedShape: Shape = shape;
      
      // Apply selection drag delta (PRIORITY)
      if (activeSelectionDrag) {
        const deltaX = activeSelectionDrag.deltaX;
        const deltaY = activeSelectionDrag.deltaY;
        const initialPos = activeSelectionDrag.initialPos;
        
        if (shape.type === 'line') {
          if (initialPos.x1 !== undefined && initialPos.y1 !== undefined &&
              initialPos.x2 !== undefined && initialPos.y2 !== undefined) {
            const newX1 = initialPos.x1 + deltaX;
            const newY1 = initialPos.y1 + deltaY;
            const newX2 = initialPos.x2 + deltaX;
            const newY2 = initialPos.y2 + deltaY;
            
            mergedShape = {
              ...mergedShape,
              x1: newX1,
              y1: newY1,
              x2: newX2,
              y2: newY2,
            } as Shape;
          }
        } else {
          const newX = initialPos.x + deltaX;
          const newY = initialPos.y + deltaY;
          
          mergedShape = {
            ...mergedShape,
            x: newX,
            y: newY,
          } as Shape;
        }
      }
      // Apply local updates
      else if (localUpdate) {
        mergedShape = { ...mergedShape, ...localUpdate } as Shape;
      }
      // Apply drag positions (from other users)
      else if (shouldApplyDragPos && dragPos) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const baseUpdates: any = {
          ...mergedShape,
          x: dragPos.x,
          y: dragPos.y,
          isDragging: isDraggedByOther,
          draggingBy: isDraggedByOther ? dragPos.draggingBy : undefined,
          draggingByName: isDraggedByOther ? dragPos.draggingByName : undefined,
        };
        
        if (dragPos.rotation !== undefined) {
          baseUpdates.rotation = dragPos.rotation;
        }
        
        if (mergedShape.type === 'rectangle' && dragPos.width !== undefined) {
          baseUpdates.width = dragPos.width;
        }
        if (mergedShape.type === 'rectangle' && dragPos.height !== undefined) {
          baseUpdates.height = dragPos.height;
        }
        if (mergedShape.type === 'circle' && dragPos.radius !== undefined) {
          baseUpdates.radius = dragPos.radius;
        }
        if (mergedShape.type === 'text' && dragPos.width !== undefined) {
          baseUpdates.width = dragPos.width;
        }
        if (mergedShape.type === 'text' && dragPos.fontSize !== undefined) {
          baseUpdates.fontSize = dragPos.fontSize;
        }
        
        if (mergedShape.type === 'line') {
          if (dragPos.x1 !== undefined) baseUpdates.x1 = dragPos.x1;
          if (dragPos.y1 !== undefined) baseUpdates.y1 = dragPos.y1;
          if (dragPos.x2 !== undefined) baseUpdates.x2 = dragPos.x2;
          if (dragPos.y2 !== undefined) baseUpdates.y2 = dragPos.y2;
        }
        
        return baseUpdates as Shape;
      }
      
      return mergedShape;
    });
  }, [shapes, dragPositions, selectionDrags, localUpdates, currentUser?.uid]);

  return shapesWithDragPositions;
}

