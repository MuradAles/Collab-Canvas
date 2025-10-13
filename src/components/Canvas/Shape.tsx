/**
 * Shape Component
 * Renders individual shapes with stroke position control
 */

import { useCallback, useRef, useEffect } from 'react';
import { Group, Rect, Circle, Text, Transformer } from 'react-konva';
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
  onTransformEnd: (updates: { x?: number; y?: number; width?: number; height?: number; scaleX?: number; scaleY?: number }) => void;
  isDraggable: boolean;
}

export function Shape({ shape, isSelected, onSelect, onDragEnd, onTransformEnd, isDraggable }: ShapeProps) {
  const groupRef = useRef<Konva.Group | null>(null);
  const shapeRef = useRef<Konva.Rect | Konva.Circle | Konva.Text | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);

  // Attach transformer to group when selected
  useEffect(() => {
    if (isSelected && transformerRef.current) {
      const node = groupRef.current || shapeRef.current;
      if (node) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer()?.batchDraw();
      }
    }
  }, [isSelected]);

  const handleTransformEnd = useCallback(
    (e: Konva.KonvaEventObject<Event>) => {
      const node = e.target;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      // Reset scale and apply it to width/height
      node.scaleX(1);
      node.scaleY(1);

      onTransformEnd({
        x: node.x(),
        y: node.y(),
        width: Math.max(5, node.width() * scaleX),
        height: Math.max(5, node.height() * scaleY),
      });
    },
    [onTransformEnd]
  );

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
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
        // For circles, constrain based on radius
        constrainedX = Math.max(shape.radius, Math.min(CANVAS_WIDTH - shape.radius, x));
        constrainedY = Math.max(shape.radius, Math.min(CANVAS_HEIGHT - shape.radius, y));
      } else {
        // For text, just ensure it stays within bounds
        constrainedX = Math.max(0, Math.min(CANVAS_WIDTH - 100, x));
        constrainedY = Math.max(0, Math.min(CANVAS_HEIGHT - 50, y));
      }

      node.position({ x: constrainedX, y: constrainedY });
      onDragEnd(constrainedX, constrainedY);
    },
    [shape, onDragEnd]
  );

  const isLocked = shape.isLocked && shape.lockedBy !== null;
  const canDrag = isDraggable && !isLocked;

  // Determine stroke color based on state
  const getStrokeColor = () => {
    if (isLocked) return LOCKED_STROKE;
    // Always show stroke for shapes with stroke property
    if (shape.type === 'rectangle' || shape.type === 'circle') {
      return shape.stroke === 'transparent' ? undefined : shape.stroke;
    }
    return undefined;
  };

  const getStrokeWidth = () => {
    if (isLocked) return LOCKED_STROKE_WIDTH;
    // Show actual stroke width for shapes with stroke property
    if (shape.type === 'rectangle' || shape.type === 'circle') {
      return shape.strokeWidth;
    }
    return 0;
  };

  if (shape.type === 'rectangle') {
    // Calculate adjusted dimensions and position based on stroke position
    let offsetX = 0;
    let offsetY = 0;
    let adjustedWidth = shape.width;
    let adjustedHeight = shape.height;
    const strokeWidth = getStrokeWidth();
    
    if (shape.strokePosition === 'inside') {
      // For inside stroke, shrink the shape so the outer boundary stays the same
      offsetX = strokeWidth / 2;
      offsetY = strokeWidth / 2;
      adjustedWidth = Math.max(1, shape.width - strokeWidth);
      adjustedHeight = Math.max(1, shape.height - strokeWidth);
    } else if (shape.strokePosition === 'outside') {
      // For outside stroke, expand the shape so the inner boundary stays the same
      offsetX = -strokeWidth / 2;
      offsetY = -strokeWidth / 2;
      adjustedWidth = shape.width + strokeWidth;
      adjustedHeight = shape.height + strokeWidth;
    }
    // For 'center', no adjustments needed (default Konva behavior)
    
    return (
      <>
        <Group
          ref={groupRef}
          x={shape.x}
          y={shape.y}
          draggable={canDrag}
          onClick={onSelect}
          onTap={onSelect}
          onDragEnd={handleDragEnd}
        >
          <Rect
            ref={shapeRef as React.Ref<Konva.Rect>}
            x={offsetX}
            y={offsetY}
            width={adjustedWidth}
            height={adjustedHeight}
            fill={shape.fill}
            stroke={getStrokeColor()}
            strokeWidth={strokeWidth}
            cornerRadius={shape.cornerRadius}
            opacity={isLocked ? 0.7 : 1}
          />
        </Group>
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
    // Calculate adjusted radius based on stroke position
    let adjustedRadius = shape.radius;
    const strokeWidth = getStrokeWidth();
    
    if (shape.strokePosition === 'inside') {
      // For inside stroke, shrink radius to keep outer bounds the same
      adjustedRadius = Math.max(1, shape.radius - strokeWidth / 2);
    } else if (shape.strokePosition === 'outside') {
      // For outside stroke, expand radius to keep inner bounds the same
      adjustedRadius = shape.radius + strokeWidth / 2;
    }
    // For 'center', no adjustments needed
    
    return (
      <>
        <Group
          ref={groupRef}
          x={shape.x}
          y={shape.y}
          draggable={canDrag}
          onClick={onSelect}
          onTap={onSelect}
          onDragEnd={handleDragEnd}
        >
          <Circle
            ref={shapeRef as React.Ref<Konva.Circle>}
            x={0}
            y={0}
            radius={adjustedRadius}
            fill={shape.fill}
            stroke={getStrokeColor()}
            strokeWidth={strokeWidth}
            opacity={isLocked ? 0.7 : 1}
          />
        </Group>
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
    return (
      <>
        <Text
          ref={shapeRef as React.Ref<Konva.Text>}
          x={shape.x}
          y={shape.y}
          text={shape.text}
          fontSize={shape.fontSize}
          fontFamily={shape.fontFamily}
          fill={shape.fill}
          width={shape.width}
          draggable={canDrag}
          onClick={onSelect}
          onTap={onSelect}
          onDragEnd={handleDragEnd}
          stroke={isSelected ? SELECTION_STROKE : undefined}
          strokeWidth={isSelected ? 1 : 0}
          shadowColor={isSelected ? 'rgba(0, 102, 255, 0.3)' : undefined}
          shadowBlur={isSelected ? 10 : 0}
          opacity={isLocked ? 0.7 : 1}
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

  return null;
}
