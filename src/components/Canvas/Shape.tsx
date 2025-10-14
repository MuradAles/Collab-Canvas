/**
 * Shape Component
 * Renders individual shapes with proper resizing and stroke positioning
 * Optimized with React.memo to prevent unnecessary re-renders
 */

import { useCallback, useRef, useEffect, memo, useState } from 'react';
import { Rect, Circle, Text, Transformer, Label, Tag } from 'react-konva';
import type Konva from 'konva';
import type { Shape as ShapeType } from '../../types';
import {
  SELECTION_STROKE,
  SELECTION_STROKE_WIDTH,
  LOCKED_STROKE,
  LOCKED_STROKE_WIDTH,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
} from '../../utils/constants';
import { constrainRectangle } from '../../utils/helpers';

interface ShapeProps {
  shape: ShapeType;
  isSelected: boolean;
  onSelect: () => void;
  onDragStart?: () => void;
  onDragMove?: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
  onTransformEnd: (updates: { x?: number; y?: number; width?: number; height?: number; radius?: number; fontSize?: number; rotation?: number }) => void;
  onRotation?: (x: number, y: number, rotation: number) => void;
  isDraggable: boolean;
  currentUserId?: string;
  onDoubleClick?: () => void;
}

function ShapeComponent({ shape, isSelected, onSelect, onDragStart, onDragMove, onDragEnd, onTransformEnd, onRotation, isDraggable, currentUserId, onDoubleClick }: ShapeProps) {
  const shapeRef = useRef<Konva.Rect | Konva.Circle | Konva.Text | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const [isLocalDragging, setIsLocalDragging] = useState(false);

  // Attach transformer to shape when selected and update rotation
  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      // Ensure transformer reflects current rotation
      transformerRef.current.rotation(shape.rotation || 0);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, shape.rotation]);

  // Update shape node rotation when it changes from external sources
  useEffect(() => {
    if (shapeRef.current) {
      shapeRef.current.rotation(shape.rotation || 0);
      shapeRef.current.getLayer()?.batchDraw();
    }
  }, [shape.rotation]);

  const handleTransformEnd = useCallback(
    () => {
      const node = shapeRef.current;
      if (!node) return;

      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      const rotation = node.rotation();

      // Calculate new dimensions before resetting scale to prevent flicker
      let newWidth = 0;
      let newHeight = 0;
      let newRadius = 0;
      let newFontSize = 0;

      if (shape.type === 'rectangle') {
        newWidth = Math.max(5, node.width() * scaleX);
        newHeight = Math.max(5, node.height() * scaleY);
      } else if (shape.type === 'circle') {
        const circleNode = node as Konva.Circle;
        newRadius = Math.max(5, circleNode.radius() * scaleX);
      } else if (shape.type === 'text') {
        newWidth = Math.max(5, node.width() * scaleX);
        // Scale fontSize based on the average of scaleX and scaleY
        const scale = (scaleX + scaleY) / 2;
        const currentFontSize = shape.type === 'text' ? shape.fontSize : 16;
        newFontSize = Math.max(8, Math.round(currentFontSize * scale));
      }

      // Reset scale immediately to prevent visual flicker (but keep rotation)
      node.scaleX(1);
      node.scaleY(1);
      // Don't reset rotation - it should stay at the final rotation value

      // Update the node dimensions immediately to match the new size
      if (shape.type === 'rectangle') {
        node.width(newWidth);
        node.height(newHeight);
      } else if (shape.type === 'circle') {
        const circleNode = node as Konva.Circle;
        circleNode.radius(newRadius);
      } else if (shape.type === 'text') {
        node.width(newWidth);
      }

      // Force a redraw to show the updated dimensions immediately
      node.getLayer()?.batchDraw();

      // Now send the updates to the context
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
          fontSize: newFontSize,
          rotation: rotation,
        });
      }
    },
    [shape, onTransformEnd]
  );

  const handleTransform = useCallback(
    () => {
      const node = shapeRef.current;
      if (!node || !onRotation) return;

      const rotation = node.rotation();
      
      // Send rotation updates for any change (very responsive for real-time updates)
      // Use a very small threshold to avoid excessive updates but still be smooth
      if (Math.abs(rotation - (shape.rotation || 0)) > 0.1) {
        onRotation(node.x(), node.y(), rotation);
      }
    },
    [shape.rotation, onRotation]
  );

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
        const constrained = constrainRectangle(
          x,
          y,
          shape.width,
          shape.height,
          { minX: 0, minY: 0, maxX: CANVAS_WIDTH, maxY: CANVAS_HEIGHT }
        );
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

  const isLocked = shape.isLocked && shape.lockedBy !== null;
  const canDrag = isDraggable && !isLocked;
  
  // Check if this shape is being dragged by another user
  const isDraggedByOther = shape.isDragging && shape.draggingBy !== currentUserId && !isLocalDragging;
  
  // Check if this shape is being rotated by another user (we'll add this to the shape type)
  const isRotatedByOther = shape.isDragging && shape.draggingBy !== currentUserId && !isLocalDragging;

  // Determine stroke color and width
  const getStrokeColor = () => {
    if (isLocked) return LOCKED_STROKE;
    if (isDraggedByOther || isRotatedByOther) return '#f59e0b'; // Amber color for shapes being dragged/rotated by others
    if (shape.type === 'rectangle' || shape.type === 'circle') {
      return shape.stroke === 'transparent' ? undefined : shape.stroke;
    }
    return undefined;
  };

  const getStrokeWidth = () => {
    if (isLocked) return LOCKED_STROKE_WIDTH;
    if (isDraggedByOther || isRotatedByOther) return 3; // Thicker border for shapes being dragged/rotated by others
    if (shape.type === 'rectangle' || shape.type === 'circle') {
      return shape.strokeWidth;
    }
    return 0;
  };
  
  // Determine opacity - slightly transparent if being dragged by another user
  const getOpacity = () => {
    if (isLocked) return 0.7;
    if (isDraggedByOther || isRotatedByOther) return 0.85;
    return 1;
  };

  /**
   * Render indicator showing who is currently interacting with the shape
   */
  const renderIndicator = () => {
    // Show dragging indicator for shapes being dragged by others
    if (isDraggedByOther && shape.draggingByName) {
      let labelX = shape.x;
      let labelY = shape.y - 25;

      if (shape.type === 'circle') {
        labelY = shape.y - shape.radius - 25;
      }

      return (
        <Label x={labelX} y={labelY} opacity={0.95}>
          <Tag
            fill="#f59e0b"
            pointerDirection="down"
            pointerWidth={8}
            pointerHeight={6}
            lineJoin="round"
            shadowColor="black"
            shadowBlur={5}
            shadowOffsetX={2}
            shadowOffsetY={2}
            shadowOpacity={0.3}
          />
          <Text
            text={`✋ ${shape.draggingByName} is moving`}
            fontFamily="Arial"
            fontSize={12}
            padding={6}
            fill="white"
            fontStyle="bold"
          />
        </Label>
      );
    }
    
    return null;
  };
  
  const renderLockIndicator = () => {
    if (!isLocked || !shape.lockedByName) return null;

    // Position the label above the shape
    let labelX = shape.x;
    let labelY = shape.y - 25; // 25px above shape

    if (shape.type === 'circle') {
      labelY = shape.y - shape.radius - 25;
    }

    return (
      <Label x={labelX} y={labelY} opacity={0.95}>
        <Tag
          fill="#ff6b6b"
          pointerDirection="down"
          pointerWidth={8}
          pointerHeight={6}
          lineJoin="round"
          shadowColor="black"
          shadowBlur={5}
          shadowOffsetX={2}
          shadowOffsetY={2}
          shadowOpacity={0.3}
        />
        <Text
          text={`🔒 ${shape.lockedByName} is editing`}
          fontFamily="Arial"
          fontSize={12}
          padding={6}
          fill="white"
          fontStyle="bold"
        />
      </Label>
    );
  };

  if (shape.type === 'rectangle') {
    return (
      <>
        <Rect
          ref={shapeRef as React.Ref<Konva.Rect>}
          x={shape.x}
          y={shape.y}
          width={shape.width}
          height={shape.height}
          fill={shape.fill}
          stroke={getStrokeColor()}
          strokeWidth={getStrokeWidth()}
          cornerRadius={shape.cornerRadius}
          rotation={shape.rotation || 0}
          draggable={canDrag}
          onClick={onSelect}
          onTap={onSelect}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          opacity={getOpacity()}
          perfectDrawEnabled={false}
        />
        {isSelected && (
          <Transformer
            ref={transformerRef as React.Ref<Konva.Transformer>}
            enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'top-center', 'middle-right', 'middle-left', 'bottom-center']}
            rotateEnabled={true}
            borderStroke={SELECTION_STROKE}
            borderStrokeWidth={SELECTION_STROKE_WIDTH}
            anchorSize={8}
            anchorFill="white"
            anchorStroke={SELECTION_STROKE}
            anchorStrokeWidth={2}
            anchorCornerRadius={2}
            onTransform={handleTransform}
            onTransformEnd={handleTransformEnd}
          />
        )}
        {renderLockIndicator()}
      </>
    );
  }

  if (shape.type === 'circle') {
    return (
      <>
        <Circle
          ref={shapeRef as React.Ref<Konva.Circle>}
          x={shape.x}
          y={shape.y}
          radius={shape.radius}
          fill={shape.fill}
          stroke={getStrokeColor()}
          strokeWidth={getStrokeWidth()}
          rotation={shape.rotation || 0}
          draggable={canDrag}
          onClick={onSelect}
          onTap={onSelect}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          opacity={getOpacity()}
          perfectDrawEnabled={false}
        />
        {isSelected && (
          <Transformer
            ref={transformerRef as React.Ref<Konva.Transformer>}
            enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
            rotateEnabled={true}
            borderStroke={SELECTION_STROKE}
            borderStrokeWidth={SELECTION_STROKE_WIDTH}
            anchorSize={8}
            anchorFill="white"
            anchorStroke={SELECTION_STROKE}
            anchorStrokeWidth={2}
            anchorCornerRadius={2}
            onTransform={handleTransform}
            onTransformEnd={handleTransformEnd}
          />
        )}
        {renderIndicator()}
        {renderLockIndicator()}
      </>
    );
  }

  if (shape.type === 'text') {
    // Show placeholder if text is empty
    const displayText = shape.text || 'Text';
    
    return (
      <>
        <Text
          ref={shapeRef as React.Ref<Konva.Text>}
          x={shape.x}
          y={shape.y}
          text={displayText}
          fontSize={shape.fontSize}
          fontFamily={shape.fontFamily}
          fill={shape.fill}
          width={shape.width}
          rotation={shape.rotation || 0}
          draggable={canDrag}
          onClick={onSelect}
          onTap={onSelect}
          onDblClick={onDoubleClick}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          opacity={getOpacity()}
          perfectDrawEnabled={false}
        />
        {isSelected && (
          <Transformer
            ref={transformerRef as React.Ref<Konva.Transformer>}
            enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right', 'top-center', 'bottom-center']}
            rotateEnabled={true}
            borderStroke={SELECTION_STROKE}
            borderStrokeWidth={SELECTION_STROKE_WIDTH}
            anchorSize={8}
            anchorFill="white"
            anchorStroke={SELECTION_STROKE}
            anchorStrokeWidth={2}
            anchorCornerRadius={2}
            onTransform={handleTransform}
            onTransformEnd={handleTransformEnd}
          />
        )}
        {renderIndicator()}
        {renderLockIndicator()}
      </>
    );
  }

  return null;
}

// Export memoized component to prevent unnecessary re-renders
export const Shape = memo(ShapeComponent, (prevProps, nextProps) => {
  // Custom comparison function for optimal performance
  return (
    prevProps.shape.id === nextProps.shape.id &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isDraggable === nextProps.isDraggable &&
    // Deep compare shape properties
    JSON.stringify(prevProps.shape) === JSON.stringify(nextProps.shape)
  );
});
