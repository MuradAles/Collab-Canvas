/**
 * Shape Component
 * Renders individual shapes with proper resizing and stroke positioning
 * Optimized with React.memo to prevent unnecessary re-renders
 */

import { useCallback, useRef, useEffect, memo } from 'react';
import { Rect, Circle, Text, Transformer } from 'react-konva';
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
  onDragEnd: (x: number, y: number) => void;
  onTransformEnd: (updates: { x?: number; y?: number; width?: number; height?: number; radius?: number; fontSize?: number }) => void;
  isDraggable: boolean;
  onDoubleClick?: () => void;
}

function ShapeComponent({ shape, isSelected, onSelect, onDragEnd, onTransformEnd, isDraggable, onDoubleClick }: ShapeProps) {
  const shapeRef = useRef<Konva.Rect | Konva.Circle | Konva.Text | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);

  // Attach transformer to shape when selected
  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const handleTransformEnd = useCallback(
    () => {
      const node = shapeRef.current;
      if (!node) return;

      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      // Reset scale
      node.scaleX(1);
      node.scaleY(1);

      if (shape.type === 'rectangle') {
        const newWidth = Math.max(5, node.width() * scaleX);
        const newHeight = Math.max(5, node.height() * scaleY);
        
        onTransformEnd({
          x: node.x(),
          y: node.y(),
          width: newWidth,
          height: newHeight,
        });
      } else if (shape.type === 'circle') {
        const circleNode = node as Konva.Circle;
        const newRadius = Math.max(5, circleNode.radius() * scaleX);
        
        onTransformEnd({
          x: node.x(),
          y: node.y(),
          radius: newRadius,
        });
      } else if (shape.type === 'text') {
        const newWidth = Math.max(5, node.width() * scaleX);
        // Scale fontSize based on the average of scaleX and scaleY
        const scale = (scaleX + scaleY) / 2;
        const currentFontSize = shape.type === 'text' ? shape.fontSize : 16;
        const newFontSize = Math.max(8, Math.round(currentFontSize * scale));
        
        onTransformEnd({
          x: node.x(),
          y: node.y(),
          width: newWidth,
          fontSize: newFontSize,
        });
      }
    },
    [shape, onTransformEnd]
  );

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      const node = e.target;
      let x = node.x();
      let y = node.y();

      // Adjust for stroke positioning offsets
      if (shape.type === 'rectangle' && shape.strokePosition === 'outside') {
        const offset = shape.strokeWidth / 2;
        x += offset;
        y += offset;
      } else if (shape.type === 'rectangle' && shape.strokePosition === 'inside') {
        const offset = shape.strokeWidth / 2;
        x -= offset;
        y -= offset;
      }

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
        const effectiveRadius = shape.strokePosition === 'outside' 
          ? shape.radius + shape.strokeWidth / 2
          : shape.radius;
        constrainedX = Math.max(effectiveRadius, Math.min(CANVAS_WIDTH - effectiveRadius, x));
        constrainedY = Math.max(effectiveRadius, Math.min(CANVAS_HEIGHT - effectiveRadius, y));
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

  // Determine stroke color and width
  const getStrokeColor = () => {
    if (isLocked) return LOCKED_STROKE;
    if (shape.type === 'rectangle' || shape.type === 'circle') {
      return shape.stroke === 'transparent' ? undefined : shape.stroke;
    }
    return undefined;
  };

  const getStrokeWidth = () => {
    if (isLocked) return LOCKED_STROKE_WIDTH;
    if (shape.type === 'rectangle' || shape.type === 'circle') {
      return shape.strokeWidth;
    }
    return 0;
  };

  if (shape.type === 'rectangle') {
    // Calculate position and size adjustments for stroke positioning
    let x = shape.x;
    let y = shape.y;
    let width = shape.width;
    let height = shape.height;
    const strokeWidth = getStrokeWidth();
    
    if (shape.strokePosition === 'inside') {
      // Offset inward and reduce size
      x += strokeWidth / 2;
      y += strokeWidth / 2;
      width = Math.max(1, shape.width - strokeWidth);
      height = Math.max(1, shape.height - strokeWidth);
    } else if (shape.strokePosition === 'outside') {
      // Offset outward and increase size
      x -= strokeWidth / 2;
      y -= strokeWidth / 2;
      width = shape.width + strokeWidth;
      height = shape.height + strokeWidth;
    }
    
    return (
      <>
        <Rect
          ref={shapeRef as React.Ref<Konva.Rect>}
          x={x}
          y={y}
          width={width}
          height={height}
          fill={shape.fill}
          stroke={getStrokeColor()}
          strokeWidth={strokeWidth}
          cornerRadius={shape.cornerRadius}
          draggable={canDrag}
          onClick={onSelect}
          onTap={onSelect}
          onDragEnd={handleDragEnd}
          opacity={isLocked ? 0.7 : 1}
          perfectDrawEnabled={false}
        />
        {isSelected && (
          <Transformer
            ref={transformerRef as React.Ref<Konva.Transformer>}
            enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'top-center', 'middle-right', 'middle-left', 'bottom-center']}
            rotateEnabled={false}
            borderStroke={SELECTION_STROKE}
            borderStrokeWidth={SELECTION_STROKE_WIDTH}
            anchorSize={8}
            anchorFill="white"
            anchorStroke={SELECTION_STROKE}
            anchorStrokeWidth={2}
            anchorCornerRadius={2}
            onTransformEnd={handleTransformEnd}
          />
        )}
      </>
    );
  }

  if (shape.type === 'circle') {
    // Calculate radius adjustment for stroke positioning
    let radius = shape.radius;
    const strokeWidth = getStrokeWidth();
    
    if (shape.strokePosition === 'inside') {
      radius = Math.max(1, shape.radius - strokeWidth / 2);
    } else if (shape.strokePosition === 'outside') {
      radius = shape.radius + strokeWidth / 2;
    }
    
    return (
      <>
        <Circle
          ref={shapeRef as React.Ref<Konva.Circle>}
          x={shape.x}
          y={shape.y}
          radius={radius}
          fill={shape.fill}
          stroke={getStrokeColor()}
          strokeWidth={strokeWidth}
          draggable={canDrag}
          onClick={onSelect}
          onTap={onSelect}
          onDragEnd={handleDragEnd}
          opacity={isLocked ? 0.7 : 1}
          perfectDrawEnabled={false}
        />
        {isSelected && (
          <Transformer
            ref={transformerRef as React.Ref<Konva.Transformer>}
            enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
            rotateEnabled={false}
            borderStroke={SELECTION_STROKE}
            borderStrokeWidth={SELECTION_STROKE_WIDTH}
            anchorSize={8}
            anchorFill="white"
            anchorStroke={SELECTION_STROKE}
            anchorStrokeWidth={2}
            anchorCornerRadius={2}
            onTransformEnd={handleTransformEnd}
          />
        )}
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
          draggable={canDrag}
          onClick={onSelect}
          onTap={onSelect}
          onDblClick={onDoubleClick}
          onDragEnd={handleDragEnd}
          opacity={isLocked ? 0.7 : 1}
          perfectDrawEnabled={false}
        />
        {isSelected && (
          <Transformer
            ref={transformerRef as React.Ref<Konva.Transformer>}
            enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right', 'top-center', 'bottom-center']}
            rotateEnabled={false}
            borderStroke={SELECTION_STROKE}
            borderStrokeWidth={SELECTION_STROKE_WIDTH}
            anchorSize={8}
            anchorFill="white"
            anchorStroke={SELECTION_STROKE}
            anchorStrokeWidth={2}
            anchorCornerRadius={2}
            onTransformEnd={handleTransformEnd}
          />
        )}
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
