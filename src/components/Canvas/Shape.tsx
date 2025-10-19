/**
 * Shape Component
 * Renders individual shapes with proper resizing and stroke positioning
 * Optimized with React.memo to prevent unnecessary re-renders
 */

import { useCallback, useRef, useEffect, memo } from 'react';
import type Konva from 'konva';
import type { Shape as ShapeType, LineShape } from '../../types';
import { ShapeIndicators } from './ShapeIndicators';
import { RectangleShape } from './shapes/RectangleShape';
import { CircleShape } from './shapes/CircleShape';
import { TextShape } from './shapes/TextShape';
import { LineShape as LineShapeComponent } from './shapes/LineShape';
import { useShapeHandlers } from '../../hooks/useShapeHandlers';

interface ShapeProps {
  shape: ShapeType;
  isSelected: boolean;
  isMultiSelected?: boolean;
  onSelect: (shiftKey: boolean) => void;
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
  isDraggable: boolean;
  currentUserId?: string;
  onDoubleClick?: () => void;
  onNodeRef?: (shapeId: string, node: Konva.Node | null) => void;
  stageScale?: number;
}

function ShapeComponent({
  shape,
  isSelected,
  isMultiSelected,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
  onTransformEnd,
  onTransform,
  isDraggable,
  currentUserId,
  onDoubleClick,
  onNodeRef,
  stageScale = 1,
}: ShapeProps) {
  const shapeRef = useRef<Konva.Rect | Konva.Circle | Konva.Text | Konva.Group | null>(null);

  // Use custom hook for all event handlers
  const {
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
  } = useShapeHandlers({
    shape,
    onDragStart,
    onDragMove,
    onDragEnd,
    onTransformEnd,
    onTransform,
    shapeRef,
  });

  // Register shape node for direct updates
  useEffect(() => {
    if (onNodeRef && shapeRef.current) {
      onNodeRef(shape.id, shapeRef.current);
      return () => {
        onNodeRef(shape.id, null);
      };
    }
  }, [shape.id, onNodeRef]);

  // Update shape node rotation when it changes from external sources
  useEffect(() => {
    if (shapeRef.current && shape.type !== 'line') {
      const rotation = 'rotation' in shape ? shape.rotation : 0;
      shapeRef.current.rotation(rotation || 0);
      shapeRef.current.getLayer()?.batchDraw();
    }
  }, [shape]);

  // Calculate lock status
  const isLocked = (shape.isLocked ?? false) && shape.lockedBy !== null;
  const isLockedByOther = isLocked && shape.lockedBy !== currentUserId;
  const canDrag = isDraggable && !isLockedByOther && isSelected;

  // Check if shape is being dragged/rotated by another user
  const isDraggedByOther = (shape.isDragging ?? false) && shape.draggingBy !== currentUserId && !isLocalDragging;
  const isRotatedByOther = (shape.isDragging ?? false) && shape.draggingBy !== currentUserId && !isLocalDragging;

  // Handle shape click for selection
  const handleShapeClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (isLockedByOther) {
        return;
      }

      if (isSelected && !e.evt.shiftKey) {
        if (isMultiSelected) {
          onSelect(false);
        } else {
          return;
        }
      } else {
        onSelect(e.evt.shiftKey);
      }
    },
    [isLockedByOther, onSelect, isSelected, isMultiSelected]
  );

  // Determine stroke color and width
  const getStrokeColor = () => {
    if (shape.type === 'rectangle' || shape.type === 'circle') {
      return shape.stroke === 'transparent' ? undefined : shape.stroke;
    }
    return undefined;
  };

  const getStrokeWidth = () => {
    if (shape.type === 'rectangle' || shape.type === 'circle') {
      return shape.strokeWidth;
    }
    return 0;
  };

  // Determine opacity
  const getOpacity = () => {
    // Start with shape's opacity (default to 1 if not set)
    const baseOpacity = shape.opacity !== undefined ? shape.opacity : 1;
    
    // Apply dim effect if locked or being dragged by others
    if (isLockedByOther || isDraggedByOther || isRotatedByOther) {
      return Math.min(baseOpacity, 0.4); // Dim to 40% max, or use shape opacity if already lower
    }
    
    return baseOpacity;
  };

  const strokeColor = getStrokeColor();
  const strokeWidth = getStrokeWidth();
  const opacity = getOpacity();

  // Render appropriate shape type
  if (shape.type === 'rectangle') {
    return (
      <>
        <RectangleShape
          ref={shapeRef as React.RefObject<Konva.Rect>}
          shape={shape}
          isSelected={isSelected}
          canDrag={canDrag}
          opacity={opacity}
          isLockedByOther={isLockedByOther}
          strokeColor={strokeColor}
          strokeWidth={strokeWidth}
          onShapeClick={handleShapeClick}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          onTransform={handleTransform}
          onTransformEnd={handleTransformEnd}
        />
        <ShapeIndicators
          shape={shape}
          isDraggedByOther={isDraggedByOther}
          isLockedByOther={isLockedByOther}
        />
      </>
    );
  }

  if (shape.type === 'circle') {
    return (
      <>
        <CircleShape
          ref={shapeRef as React.RefObject<Konva.Circle>}
          shape={shape}
          isSelected={isSelected}
          canDrag={canDrag}
          opacity={opacity}
          isLockedByOther={isLockedByOther}
          strokeColor={strokeColor}
          strokeWidth={strokeWidth}
          onShapeClick={handleShapeClick}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          onTransform={handleTransform}
          onTransformEnd={handleTransformEnd}
        />
        <ShapeIndicators
          shape={shape}
          isDraggedByOther={isDraggedByOther}
          isLockedByOther={isLockedByOther}
        />
      </>
    );
  }

  if (shape.type === 'text') {
    return (
      <>
        <TextShape
          ref={shapeRef as React.RefObject<Konva.Text>}
          shape={shape}
          isSelected={isSelected}
          canDrag={canDrag}
          opacity={opacity}
          isLockedByOther={isLockedByOther}
          onShapeClick={handleShapeClick}
          onDoubleClick={onDoubleClick}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          onTransform={handleTransform}
          onTransformEnd={handleTransformEnd}
        />
        <ShapeIndicators
          shape={shape}
          isDraggedByOther={isDraggedByOther}
          isLockedByOther={isLockedByOther}
        />
      </>
    );
  }

  if (shape.type === 'line') {
    const lineShape = shape as LineShape;
    return (
      <>
        <LineShapeComponent
          ref={shapeRef as React.RefObject<Konva.Group>}
          shape={lineShape}
          isSelected={isSelected}
          canDrag={canDrag}
          opacity={opacity}
          isLockedByOther={isLockedByOther}
          onShapeClick={handleShapeClick}
          onLineDragStart={handleLineDragStart}
          onLineDragMove={handleLineDragMove}
          onLineDragEnd={handleLineDragEnd}
          onAnchorDrag={handleAnchorDrag}
          onAnchorDragEnd={handleAnchorDragEnd}
          stageScale={stageScale}
        />
        <ShapeIndicators
          shape={shape}
          isDraggedByOther={isDraggedByOther}
          isLockedByOther={isLockedByOther}
        />
      </>
    );
  }

  return null;
}

// Export memoized component to prevent unnecessary re-renders
export const Shape = memo(ShapeComponent, (prevProps, nextProps) => {
  if (prevProps.shape.id !== nextProps.shape.id) return false;
  if (prevProps.isSelected !== nextProps.isSelected) return false;
  if (prevProps.isDraggable !== nextProps.isDraggable) return false;
  if (prevProps.currentUserId !== nextProps.currentUserId) return false;
  if (prevProps.stageScale !== nextProps.stageScale) return false;

  const prev = prevProps.shape;
  const next = nextProps.shape;

  // Compare critical properties
  if (prev.type !== 'line' && next.type !== 'line') {
    if (prev.x !== next.x || prev.y !== next.y) return false;
    if (prev.rotation !== next.rotation) return false;
  }

  if (prev.name !== next.name) return false;
  if (prev.isLocked !== next.isLocked) return false;
  if (prev.lockedBy !== next.lockedBy) return false;
  if (prev.isDragging !== next.isDragging) return false;
  if (prev.draggingBy !== next.draggingBy) return false;

  // Type-specific comparisons
  if (prev.type !== next.type) return false;

  if (prev.type === 'rectangle' && next.type === 'rectangle') {
    return (
      prev.width === next.width &&
      prev.height === next.height &&
      prev.fill === next.fill &&
      prev.stroke === next.stroke &&
      prev.strokeWidth === next.strokeWidth &&
      prev.cornerRadius === next.cornerRadius &&
      (prev.rotation ?? 0) === (next.rotation ?? 0) &&
      (prev.opacity ?? 1) === (next.opacity ?? 1) &&
      (prev.blendMode ?? 'source-over') === (next.blendMode ?? 'source-over')
    );
  }

  if (prev.type === 'circle' && next.type === 'circle') {
    return (
      prev.radius === next.radius &&
      prev.fill === next.fill &&
      prev.stroke === next.stroke &&
      prev.strokeWidth === next.strokeWidth &&
      (prev.rotation ?? 0) === (next.rotation ?? 0) &&
      (prev.opacity ?? 1) === (next.opacity ?? 1) &&
      (prev.blendMode ?? 'source-over') === (next.blendMode ?? 'source-over')
    );
  }

  if (prev.type === 'text' && next.type === 'text') {
    return (
      prev.text === next.text &&
      prev.fontSize === next.fontSize &&
      prev.fontFamily === next.fontFamily &&
      (prev.fontStyle ?? 'normal') === (next.fontStyle ?? 'normal') &&
      (prev.textDecoration ?? '') === (next.textDecoration ?? '') &&
      prev.fill === next.fill &&
      (prev.width || 0) === (next.width || 0) &&
      (prev.rotation ?? 0) === (next.rotation ?? 0) &&
      (prev.opacity ?? 1) === (next.opacity ?? 1) &&
      (prev.blendMode ?? 'source-over') === (next.blendMode ?? 'source-over')
    );
  }

  if (prev.type === 'line' && next.type === 'line') {
    return (
      prev.x1 === next.x1 &&
      prev.y1 === next.y1 &&
      prev.x2 === next.x2 &&
      prev.y2 === next.y2 &&
      prev.stroke === next.stroke &&
      prev.strokeWidth === next.strokeWidth &&
      prev.lineCap === next.lineCap &&
      (prev.opacity ?? 1) === (next.opacity ?? 1) &&
      (prev.blendMode ?? 'source-over') === (next.blendMode ?? 'source-over')
    );
  }

  return true;
});
