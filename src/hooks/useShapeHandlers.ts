/**
 * useShapeHandlers Hook
 * Provides event handlers for shape drag and transform operations
 */

import { useCallback, useRef, useState } from 'react';
import type Konva from 'konva';
import type { Shape, LineShape } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/constants';
import { constrainRectangle } from '../utils/helpers';

interface UseShapeHandlersProps {
  shape: Shape;
  onDragStart?: () => void;
  onDragMove?: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
  onTransformEnd: (updates: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    radius?: number;
    fontSize?: number;
    rotation?: number;
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
  }) => void;
  onTransform?: (
    x: number,
    y: number,
    rotation: number,
    width?: number,
    height?: number,
    radius?: number,
    fontSize?: number,
    x1?: number,
    y1?: number,
    x2?: number,
    y2?: number
  ) => void;
  shapeRef: React.RefObject<Konva.Rect | Konva.Circle | Konva.Text | null>;
}

export function useShapeHandlers({
  shape,
  onDragStart,
  onDragMove,
  onDragEnd,
  onTransformEnd,
  onTransform,
  shapeRef,
}: UseShapeHandlersProps) {
  const [isLocalDragging, setIsLocalDragging] = useState(false);
  const dragStartPosRef = useRef<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

  const handleDragStart = useCallback(() => {
    setIsLocalDragging(true);
    if (onDragStart) {
      onDragStart();
    }
  }, [onDragStart]);

  const handleDragMove = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      if (!onDragMove) return;

      const node = e.target;
      const x = node.x();
      const y = node.y();

      onDragMove(x, y);
    },
    [onDragMove]
  );

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      setIsLocalDragging(false);
      const node = e.target;
      const x = node.x();
      const y = node.y();

      // Constrain position to canvas boundaries
      let constrainedX = x;
      let constrainedY = y;

      if (shape.type === 'rectangle') {
        const constrained = constrainRectangle(x, y, shape.width, shape.height, {
          minX: 0,
          minY: 0,
          maxX: CANVAS_WIDTH,
          maxY: CANVAS_HEIGHT,
        });
        constrainedX = constrained.x;
        constrainedY = constrained.y;
      } else if (shape.type === 'circle') {
        constrainedX = Math.max(shape.radius, Math.min(CANVAS_WIDTH - shape.radius, x));
        constrainedY = Math.max(shape.radius, Math.min(CANVAS_HEIGHT - shape.radius, y));
      } else {
        constrainedX = Math.max(0, Math.min(CANVAS_WIDTH - 100, x));
        constrainedY = Math.max(0, Math.min(CANVAS_HEIGHT - 50, y));
      }

      onDragEnd(constrainedX, constrainedY);
    },
    [shape, onDragEnd]
  );

  const handleTransformEnd = useCallback(() => {
    const node = shapeRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const rotation = node.rotation();

    let newWidth = 0;
    let newHeight = 0;
    let newRadius = 0;

    if (shape.type === 'rectangle') {
      newWidth = Math.max(5, node.width() * scaleX);
      newHeight = Math.max(5, node.height() * scaleY);
    } else if (shape.type === 'circle') {
      const circleNode = node as Konva.Circle;
      newRadius = Math.max(5, circleNode.radius() * scaleX);
    } else if (shape.type === 'text') {
      // For text, only change width, keep fontSize constant
      newWidth = Math.max(50, node.width() * scaleX);
    }

    // Reset scale immediately
    node.scaleX(1);
    node.scaleY(1);

    // Update node dimensions
    if (shape.type === 'rectangle') {
      node.width(newWidth);
      node.height(newHeight);
    } else if (shape.type === 'circle') {
      const circleNode = node as Konva.Circle;
      circleNode.radius(newRadius);
    } else if (shape.type === 'text') {
      node.width(newWidth);
    }

    node.getLayer()?.batchDraw();

    // Send updates to context
    if (shape.type === 'rectangle') {
      onTransformEnd({
        x: node.x(),
        y: node.y(),
        width: newWidth,
        height: newHeight,
        rotation: rotation,
      });
    } else if (shape.type === 'circle') {
      onTransformEnd({
        x: node.x(),
        y: node.y(),
        radius: newRadius,
        rotation: rotation,
      });
    } else if (shape.type === 'text') {
      onTransformEnd({
        x: node.x(),
        y: node.y(),
        width: newWidth,
        rotation: rotation,
      });
    }
  }, [shape, onTransformEnd, shapeRef]);

  const handleTransform = useCallback(() => {
    const node = shapeRef.current;
    if (!node || !onTransform) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    if (shape.type === 'text') {
      // For text, apply width change immediately and reset scale
      // This prevents scaling effect and shows text reflow in real-time
      const newWidth = Math.max(50, node.width() * scaleX);
      node.width(newWidth);
      node.scaleX(1);
      node.scaleY(1);
    }

    const x = node.x();
    const y = node.y();
    const rotation = node.rotation();

    let width: number | undefined;
    let height: number | undefined;
    let radius: number | undefined;
    let fontSize: number | undefined;

    if (shape.type === 'rectangle') {
      width = node.width() * scaleX;
      height = node.height() * scaleY;
    } else if (shape.type === 'circle') {
      const circleNode = node as Konva.Circle;
      radius = circleNode.radius() * scaleX;
    } else if (shape.type === 'text') {
      // Width already applied above
      width = node.width();
    }

    onTransform(x, y, rotation, width, height, radius, fontSize);
  }, [shape, onTransform, shapeRef]);

  // Line-specific handlers
  const handleLineDragStart = useCallback(() => {
    if (shape.type !== 'line') return;
    const lineShape = shape as LineShape;
    dragStartPosRef.current = {
      x1: lineShape.x1,
      y1: lineShape.y1,
      x2: lineShape.x2,
      y2: lineShape.y2,
    };
    setIsLocalDragging(true);
    if (onDragStart) {
      onDragStart();
    }
  }, [shape, onDragStart]);

  const handleLineDragMove = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      if (!dragStartPosRef.current) return;

      const node = e.target as Konva.Group;
      const dx = node.x();
      const dy = node.y();

      const newX1 = dragStartPosRef.current.x1 + dx;
      const newY1 = dragStartPosRef.current.y1 + dy;
      const newX2 = dragStartPosRef.current.x2 + dx;
      const newY2 = dragStartPosRef.current.y2 + dy;

      const midX = (newX1 + newX2) / 2;
      const midY = (newY1 + newY2) / 2;

      if (onDragMove) {
        onDragMove(midX, midY);
      }
    },
    [onDragMove]
  );

  const handleLineDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      if (!dragStartPosRef.current) return;

      setIsLocalDragging(false);
      const node = e.target as Konva.Group;
      const dx = node.x();
      const dy = node.y();

      const newX1 = dragStartPosRef.current.x1 + dx;
      const newY1 = dragStartPosRef.current.y1 + dy;
      const newX2 = dragStartPosRef.current.x2 + dx;
      const newY2 = dragStartPosRef.current.y2 + dy;

      node.position({ x: 0, y: 0 });

      onDragEnd((newX1 + newX2) / 2, (newY1 + newY2) / 2);
      onTransformEnd({ x1: newX1, y1: newY1, x2: newX2, y2: newY2 });

      dragStartPosRef.current = null;
    },
    [onDragEnd, onTransformEnd]
  );

  const handleAnchorDrag = useCallback(
    (anchorType: 'start' | 'end', e: Konva.KonvaEventObject<DragEvent>) => {
      if (shape.type !== 'line') return;
      const lineShape = shape as LineShape;
      const circle = e.target as Konva.Circle;
      const newX = circle.x();
      const newY = circle.y();

      const currentX1 = anchorType === 'start' ? newX : lineShape.x1;
      const currentY1 = anchorType === 'start' ? newY : lineShape.y1;
      const currentX2 = anchorType === 'end' ? newX : lineShape.x2;
      const currentY2 = anchorType === 'end' ? newY : lineShape.y2;
      if (onTransform) {
        onTransform(0, 0, 0, undefined, undefined, undefined, undefined, currentX1, currentY1, currentX2, currentY2);
      }
    },
    [shape, onTransform]
  );

  const handleAnchorDragEnd = useCallback(
    (anchorType: 'start' | 'end', e: Konva.KonvaEventObject<DragEvent>) => {
      const circle = e.target as Konva.Circle;
      const newX = circle.x();
      const newY = circle.y();

      const updates: { x1?: number; y1?: number; x2?: number; y2?: number } = {};

      if (anchorType === 'start') {
        updates.x1 = newX;
        updates.y1 = newY;
      } else {
        updates.x2 = newX;
        updates.y2 = newY;
      }
      
      onTransformEnd(updates);
    },
    [onTransformEnd]
  );

  return {
    isLocalDragging,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleTransformEnd,
    handleTransform,
    handleLineDragStart,
    handleLineDragMove,
    handleLineDragEnd,
    handleAnchorDrag,
    handleAnchorDragEnd,
  };
}

