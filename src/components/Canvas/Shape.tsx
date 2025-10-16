/**
 * Shape Component
 * Renders individual shapes with proper resizing and stroke positioning
 * Optimized with React.memo to prevent unnecessary re-renders
 */

import { useCallback, useRef, useEffect, memo, useState } from 'react';
import { Rect, Circle, Text, Line, Group, Transformer, Label, Tag } from 'react-konva';
import type Konva from 'konva';
import type { Shape as ShapeType, LineShape } from '../../types';
import {
  SELECTION_STROKE,
  SELECTION_STROKE_WIDTH,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
} from '../../utils/constants';
import { constrainRectangle } from '../../utils/helpers';

interface ShapeProps {
  shape: ShapeType;
  isSelected: boolean;
  isMultiSelected?: boolean;
  onSelect: (shiftKey: boolean) => void;
  onDragStart?: () => void;
  onDragMove?: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
  onTransformEnd: (updates: { x?: number; y?: number; width?: number; height?: number; radius?: number; fontSize?: number; rotation?: number; x1?: number; y1?: number; x2?: number; y2?: number }) => void;
  onTransform?: (x: number, y: number, rotation: number, width?: number, height?: number, radius?: number, fontSize?: number, x1?: number, y1?: number, x2?: number, y2?: number) => void;
  isDraggable: boolean;
  currentUserId?: string;
  onDoubleClick?: () => void;
}

function ShapeComponent({ shape, isSelected, isMultiSelected, onSelect, onDragStart, onDragMove, onDragEnd, onTransformEnd, onTransform, isDraggable, currentUserId, onDoubleClick }: ShapeProps) {
  const shapeRef = useRef<Konva.Rect | Konva.Circle | Konva.Text | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const [isLocalDragging, setIsLocalDragging] = useState(false);
  
  // Line-specific state (always declared, but only used for lines)
  const dragStartPosRef = useRef<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const lineShape = shape.type === 'line' ? (shape as LineShape) : null;
  
  // Extract rotation safely (lines don't have rotation)
  const shapeRotation = shape.type !== 'line' ? shape.rotation : undefined;

  // Attach transformer to shape when selected and update rotation
  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      // Ensure transformer reflects current rotation (lines don't have rotation)
      if (shape.type !== 'line' && shapeRotation !== undefined) {
        transformerRef.current.rotation(shapeRotation || 0);
      }
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, shape.type, shapeRotation]);

  // Update shape node rotation when it changes from external sources (lines don't have rotation)
  useEffect(() => {
    if (shapeRef.current && shape.type !== 'line' && shapeRotation !== undefined) {
      shapeRef.current.rotation(shapeRotation || 0);
      shapeRef.current.getLayer()?.batchDraw();
    }
  }, [shape.type, shapeRotation]);

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
      if (!node || !onTransform) return;

      const x = node.x();
      const y = node.y();
      const rotation = node.rotation();
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      
      // Calculate current dimensions based on scale
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
        width = node.width() * scaleX;
        const scale = (scaleX + scaleY) / 2;
        const currentFontSize = shape.type === 'text' ? shape.fontSize : 16;
        fontSize = currentFontSize * scale;
      }
      
      // Send all transformation data for real-time updates
      onTransform(x, y, rotation, width, height, radius, fontSize);
    },
    [shape, onTransform]
  );

  // Calculate lock status before using in callbacks
  const isLocked = shape.isLocked && shape.lockedBy !== null;
  const isLockedByOther = isLocked && shape.lockedBy !== currentUserId;
  // IMPROVEMENT: Only allow dragging if shape is selected (PR #10)
  const canDrag = isDraggable && !isLockedByOther && isSelected;

  // Handle shape click - check if shape is locked before allowing selection (PR #10)
  // NEW (PR #12): Detect Shift key from the actual click event for multi-selection
  // IMPORTANT: Don't change selection if clicking an already-selected shape (prevents clearing multi-selection when starting to drag)
  // UNLESS: Multiple shapes are selected - then clicking one without Shift should make it the only selection
  const handleShapeClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isLockedByOther) {
      // Shape is locked by another user - prevent selection silently
      return;
    }
    
    // If clicking an already-selected shape without Shift
    if (isSelected && !e.evt.shiftKey) {
      // If multiple shapes are selected, this should make only this one selected
      if (isMultiSelected) {
        onSelect(false);
      } else {
        // Only this shape is selected - don't change selection (prevents clearing when starting drag)
        return;
      }
    } else {
      // Normal selection behavior
      onSelect(e.evt.shiftKey);
    }
  }, [isLockedByOther, onSelect, isSelected, isMultiSelected]);

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
  
  // Check if this shape is being dragged by another user
  const isDraggedByOther = shape.isDragging && shape.draggingBy !== currentUserId && !isLocalDragging;
  
  // Check if this shape is being rotated by another user (we'll add this to the shape type)
  const isRotatedByOther = shape.isDragging && shape.draggingBy !== currentUserId && !isLocalDragging;

  // Determine stroke color and width
  const getStrokeColor = () => {
    // Don't show special stroke for locked shapes - transparency is enough feedback
    if (shape.type === 'rectangle' || shape.type === 'circle') {
      return shape.stroke === 'transparent' ? undefined : shape.stroke;
    }
    return undefined;
  };

  const getStrokeWidth = () => {
    // Don't show special stroke for locked shapes - transparency is enough feedback
    if (shape.type === 'rectangle' || shape.type === 'circle') {
      return shape.strokeWidth;
    }
    return 0;
  };
  
  // Determine opacity - 60% transparent (0.4) if locked by another user
  const getOpacity = () => {
    if (isLockedByOther) return 0.4; // 60% transparent for locked shapes (PR #10)
    if (isDraggedByOther || isRotatedByOther) return 0.4; // Same transparency for shapes being moved by others
    return 1;
  };

  // Line-specific callbacks (always declared, only used when shape.type === 'line')
  const handleAnchorDrag = useCallback(
    (anchorType: 'start' | 'end', e: Konva.KonvaEventObject<DragEvent>) => {
      if (!lineShape) return;
      const circle = e.target as Konva.Circle;
      const newX = circle.x();
      const newY = circle.y();
      
      // Get current line coordinates
      const currentX1 = anchorType === 'start' ? newX : lineShape.x1;
      const currentY1 = anchorType === 'start' ? newY : lineShape.y1;
      const currentX2 = anchorType === 'end' ? newX : lineShape.x2;
      const currentY2 = anchorType === 'end' ? newY : lineShape.y2;
      
      // Send real-time update via onTransform
      if (onTransform) {
        onTransform(
          0, // x - not used for lines
          0, // y - not used for lines
          0, // rotation - lines don't have rotation
          undefined, // width
          undefined, // height
          undefined, // radius
          undefined, // fontSize
          currentX1,
          currentY1,
          currentX2,
          currentY2
        );
      }
    },
    [lineShape, onTransform]
  );
  
  const handleAnchorDragEnd = useCallback(
    (anchorType: 'start' | 'end', e: Konva.KonvaEventObject<DragEvent>) => {
      const circle = e.target as Konva.Circle;
      const newX = circle.x();
      const newY = circle.y();
      
      // Prepare updates for only the changing endpoint
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

  const handleLineDragStart = useCallback(() => {
    if (!lineShape) return;
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
  }, [lineShape, onDragStart]);

  const handleLineDragMove = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    if (!dragStartPosRef.current) return;
    
    const node = e.target as Konva.Group;
    const dx = node.x();
    const dy = node.y();
    
    // Calculate new endpoint positions
    const newX1 = dragStartPosRef.current.x1 + dx;
    const newY1 = dragStartPosRef.current.y1 + dy;
    const newX2 = dragStartPosRef.current.x2 + dx;
    const newY2 = dragStartPosRef.current.y2 + dy;
    
    // Calculate midpoint for drag tracking
    const midX = (newX1 + newX2) / 2;
    const midY = (newY1 + newY2) / 2;
    
    // DON'T reset position during drag - it confuses Konva's drag calculations
    // Let Konva handle the visual dragging with its offset on the Group
    // We'll reset and apply final position at drag end
    
    // CRITICAL: Call onDragMove with midpoint position for multi-select support
    // This allows lines to participate in multi-select dragging
    // NOTE: We only use onDragMove for whole-line dragging, not onTransform
    // onTransform is reserved for anchor dragging (resizing) to avoid conflicts
    if (onDragMove) {
      onDragMove(midX, midY);
    }
  }, [onDragMove]);

  const handleLineDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    if (!dragStartPosRef.current) return;
    
    setIsLocalDragging(false);
    const node = e.target as Konva.Group;
    const dx = node.x();
    const dy = node.y();

    // Calculate new endpoint positions
    const newX1 = dragStartPosRef.current.x1 + dx;
    const newY1 = dragStartPosRef.current.y1 + dy;
    const newX2 = dragStartPosRef.current.x2 + dx;
    const newY2 = dragStartPosRef.current.y2 + dy;

    // Reset Group position to 0,0
    node.position({ x: 0, y: 0 });

    // Update with new coordinates
    onDragEnd((newX1 + newX2) / 2, (newY1 + newY2) / 2);
    onTransformEnd({ x1: newX1, y1: newY1, x2: newX2, y2: newY2 });
    
    dragStartPosRef.current = null;
  }, [onDragEnd, onTransformEnd]);

  /**
   * Render indicator showing who is currently interacting with the shape
   */
  const renderIndicator = () => {
    // Show dragging indicator for shapes being dragged by others
    if (isDraggedByOther && shape.draggingByName) {
      let labelX = 0;
      let labelY = -25;
      
      if (shape.type === 'line') {
        // Position label at midpoint of line, slightly above
        const lineShape = shape as LineShape;
        labelX = (lineShape.x1 + lineShape.x2) / 2;
        labelY = Math.min(lineShape.y1, lineShape.y2) - 25;
      } else if (shape.type === 'circle') {
        labelX = shape.x;
        labelY = shape.y - shape.radius - 25;
      } else {
        // Rectangle, text have x, y
        labelX = shape.x;
        labelY = shape.y - 25;
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
    // Only show lock indicator if locked by another user (PR #10)
    if (!isLockedByOther || !shape.lockedByName) return null;

    // Position the label above the shape
    let labelX = 0;
    let labelY = -25; // 25px above shape
    
    if (shape.type === 'line') {
      // Position label at midpoint of line, slightly above
      const lineShape = shape as LineShape;
      labelX = (lineShape.x1 + lineShape.x2) / 2;
      labelY = Math.min(lineShape.y1, lineShape.y2) - 25;
    } else if (shape.type === 'circle') {
      labelX = shape.x;
      labelY = shape.y - shape.radius - 25;
    } else {
      // Rectangle, text have x, y
      labelX = shape.x;
      labelY = shape.y - 25;
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
          onClick={handleShapeClick}
          onTap={handleShapeClick}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          opacity={getOpacity()}
          listening={!isLockedByOther} // Disable interaction if locked by another user
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
          onClick={handleShapeClick}
          onTap={handleShapeClick}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          opacity={getOpacity()}
          listening={!isLockedByOther} // Disable interaction if locked by another user
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
          fontStyle={shape.fontStyle || 'normal'}
          textDecoration={shape.textDecoration || ''}
          fill={shape.fill}
          width={shape.width}
          rotation={shape.rotation || 0}
          draggable={canDrag}
          onClick={handleShapeClick}
          onTap={handleShapeClick}
          onDblClick={isLockedByOther ? undefined : onDoubleClick} // Prevent double-click if locked
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          opacity={getOpacity()}
          listening={!isLockedByOther} // Disable interaction if locked by another user
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

  if (shape.type === 'line' && lineShape) {
    const anchorRadiusLarge = 8;

    return (
      <Group
        draggable={canDrag && isSelected}
        onDragStart={handleLineDragStart}
        onDragMove={handleLineDragMove}
        onDragEnd={handleLineDragEnd}
      >
        {/* Invisible wider line for easier clicking/selection */}
        <Line
          points={[lineShape.x1, lineShape.y1, lineShape.x2, lineShape.y2]}
          stroke="transparent"
          strokeWidth={Math.max(20, lineShape.strokeWidth + 10)}
          lineCap={lineShape.lineCap}
          listening={!isLockedByOther}
          onClick={handleShapeClick}
          onTap={handleShapeClick}
          perfectDrawEnabled={false}
        />
        {/* Visible line */}
        <Line
          points={[lineShape.x1, lineShape.y1, lineShape.x2, lineShape.y2]}
          stroke={lineShape.stroke}
          strokeWidth={lineShape.strokeWidth}
          lineCap={lineShape.lineCap}
          opacity={getOpacity()}
          listening={false}
          perfectDrawEnabled={false}
        />
        {isSelected && !isLockedByOther && (
          <>
            <Circle
              x={lineShape.x1}
              y={lineShape.y1}
              radius={anchorRadiusLarge}
              fill="white"
              stroke={SELECTION_STROKE}
              strokeWidth={2}
              draggable={true}
              onDragMove={(e) => handleAnchorDrag('start', e)}
              onDragEnd={(e) => handleAnchorDragEnd('start', e)}
              onMouseEnter={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'move';
              }}
              onMouseLeave={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'default';
              }}
            />
            <Circle
              x={lineShape.x2}
              y={lineShape.y2}
              radius={anchorRadiusLarge}
              fill="white"
              stroke={SELECTION_STROKE}
              strokeWidth={2}
              draggable={true}
              onDragMove={(e) => handleAnchorDrag('end', e)}
              onDragEnd={(e) => handleAnchorDragEnd('end', e)}
              onMouseEnter={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'move';
              }}
              onMouseLeave={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'default';
              }}
            />
            {/* Rotation anchor at midpoint */}
            <Circle
              x={(lineShape.x1 + lineShape.x2) / 2}
              y={(lineShape.y1 + lineShape.y2) / 2}
              radius={anchorRadiusLarge}
              fill={SELECTION_STROKE}
              stroke="white"
              strokeWidth={2}
              draggable={true}
              onDragMove={(e) => {
                const node = e.target;
                const centerX = (lineShape.x1 + lineShape.x2) / 2;
                const centerY = (lineShape.y1 + lineShape.y2) / 2;
                
                // Calculate angle from center to mouse
                const angle = Math.atan2(node.y() - centerY, node.x() - centerX);
                
                // Calculate current line length and perpendicular offset
                const dx = lineShape.x2 - lineShape.x1;
                const dy = lineShape.y2 - lineShape.y1;
                const length = Math.sqrt(dx * dx + dy * dy);
                const halfLength = length / 2;
                
                // Calculate new endpoints rotated around center
                const newX1 = centerX - halfLength * Math.cos(angle);
                const newY1 = centerY - halfLength * Math.sin(angle);
                const newX2 = centerX + halfLength * Math.cos(angle);
                const newY2 = centerY + halfLength * Math.sin(angle);
                
                onTransformEnd({ x1: newX1, y1: newY1, x2: newX2, y2: newY2 });
              }}
              onDragEnd={(e) => {
                const node = e.target;
                const centerX = (lineShape.x1 + lineShape.x2) / 2;
                const centerY = (lineShape.y1 + lineShape.y2) / 2;
                
                const angle = Math.atan2(node.y() - centerY, node.x() - centerX);
                const dx = lineShape.x2 - lineShape.x1;
                const dy = lineShape.y2 - lineShape.y1;
                const length = Math.sqrt(dx * dx + dy * dy);
                const halfLength = length / 2;
                
                const newX1 = centerX - halfLength * Math.cos(angle);
                const newY1 = centerY - halfLength * Math.sin(angle);
                const newX2 = centerX + halfLength * Math.cos(angle);
                const newY2 = centerY + halfLength * Math.sin(angle);
                
                onTransformEnd({ x1: newX1, y1: newY1, x2: newX2, y2: newY2 });
              }}
              onMouseEnter={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'crosshair';
              }}
              onMouseLeave={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'default';
              }}
            />
          </>
        )}
        {renderIndicator()}
        {renderLockIndicator()}
      </Group>
    );
  }

  return null;
}

// Export memoized component to prevent unnecessary re-renders
export const Shape = memo(ShapeComponent, (prevProps, nextProps) => {
  // Optimized comparison - check only essential properties
  // Avoid expensive JSON.stringify for better performance
  
  if (prevProps.shape.id !== nextProps.shape.id) return false;
  if (prevProps.isSelected !== nextProps.isSelected) return false;
  if (prevProps.isDraggable !== nextProps.isDraggable) return false;
  if (prevProps.currentUserId !== nextProps.currentUserId) return false;
  
  const prev = prevProps.shape;
  const next = nextProps.shape;
  
  // Compare critical properties that affect rendering
  // Note: Lines don't have x, y, or rotation - they use x1, y1, x2, y2
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
      prev.cornerRadius === next.cornerRadius
    );
  }
  
  if (prev.type === 'circle' && next.type === 'circle') {
    return (
      prev.radius === next.radius &&
      prev.fill === next.fill &&
      prev.stroke === next.stroke &&
      prev.strokeWidth === next.strokeWidth
    );
  }
  
  if (prev.type === 'text' && next.type === 'text') {
    return (
      prev.text === next.text &&
      prev.fontSize === next.fontSize &&
      prev.fontFamily === next.fontFamily &&
      prev.fontStyle === next.fontStyle &&
      prev.textDecoration === next.textDecoration &&
      prev.fill === next.fill &&
      (prev.width || 0) === (next.width || 0)
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
      prev.lineCap === next.lineCap
    );
  }
  
  return true;
});
