/**
 * LineShape Component
 * Renders a line shape with draggable anchors
 */

import { forwardRef, useEffect, useRef } from 'react';
import { Group, Line, Rect } from 'react-konva';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { LineShape as LineShapeType } from '../../../types';
import { SELECTION_STROKE } from '../../../utils/constants';

interface LineShapeProps {
  shape: LineShapeType;
  isSelected: boolean;
  canDrag: boolean;
  opacity: number;
  isLockedByOther: boolean;
  onShapeClick: (e: KonvaEventObject<MouseEvent>) => void;
  onLineDragStart: () => void;
  onLineDragMove: (e: KonvaEventObject<DragEvent>) => void;
  onLineDragEnd: (e: KonvaEventObject<DragEvent>) => void;
  onAnchorDrag: (anchorType: 'start' | 'end', e: KonvaEventObject<DragEvent>) => void;
  onAnchorDragEnd: (anchorType: 'start' | 'end', e: KonvaEventObject<DragEvent>) => void;
  stageScale?: number;
}

export const LineShape = forwardRef<Konva.Group, LineShapeProps>(
  (
    {
      shape,
      isSelected,
      canDrag,
      opacity,
      isLockedByOther,
      onShapeClick,
      onLineDragStart,
      onLineDragMove,
      onLineDragEnd,
      onAnchorDrag,
      onAnchorDragEnd,
      stageScale = 1,
    },
    ref
  ) => {
    const lineRef = useRef<Konva.Line | null>(null);
    
    // Match transformer anchor size (8x8 box matching Transformer anchorSize)
    // Apply inverse scale to make anchors scale-invariant (constant screen size)
    const baseAnchorSize = 8;
    const anchorSize = baseAnchorSize / stageScale;
    const anchorOffset = anchorSize / 2; // Offset to center the square on the point
    
    // Also scale the stroke width to maintain consistent visual appearance
    const anchorStrokeWidth = 2 / stageScale;
    
    // Apply blend mode directly to Konva Line node (react-konva doesn't support it as prop)
    useEffect(() => {
      if (lineRef.current) {
        const node = lineRef.current;
        if (shape.blendMode) {
          node.globalCompositeOperation(shape.blendMode);
        } else {
          node.globalCompositeOperation('source-over');
        }
        node.getLayer()?.batchDraw();
      }
    }, [shape.blendMode, shape.id]);
    
    // Ensure Group stays at (0, 0) - Konva drag will move it, but we reset it
    useEffect(() => {
      if (ref && typeof ref !== 'function' && ref.current) {
        const group = ref.current;
        // Reset group position on shape coordinate changes
        if (group.x() !== 0 || group.y() !== 0) {
          group.position({ x: 0, y: 0 });
          group.getLayer()?.batchDraw();
        }
      }
    }, [shape.x1, shape.y1, shape.x2, shape.y2, ref]);

    return (
      <Group
        ref={ref}
        x={0}
        y={0}
        draggable={canDrag && isSelected}
        onDragStart={onLineDragStart}
        onDragMove={onLineDragMove}
        onDragEnd={onLineDragEnd}
      >
      {/* Invisible wider line for easier clicking/selection */}
      <Line
        points={[shape.x1, shape.y1, shape.x2, shape.y2]}
        stroke="transparent"
        strokeWidth={Math.max(20, shape.strokeWidth + 10)}
        lineCap={shape.lineCap}
        listening={!isLockedByOther}
        onClick={onShapeClick}
        onTap={onShapeClick}
        perfectDrawEnabled={false}
      />
      {/* Visible line */}
      <Line
        ref={lineRef}
        points={[shape.x1, shape.y1, shape.x2, shape.y2]}
        stroke={shape.stroke}
        strokeWidth={shape.strokeWidth}
        lineCap={shape.lineCap}
        opacity={shape.opacity !== undefined ? shape.opacity : opacity}
        listening={false}
        perfectDrawEnabled={false}
      />
      {isSelected && !isLockedByOther && (
        <>
          {/* Start anchor - square matching Transformer style, scale-invariant */}
          <Rect
            x={shape.x1 - anchorOffset}
            y={shape.y1 - anchorOffset}
            width={anchorSize}
            height={anchorSize}
            fill="white"
            stroke={SELECTION_STROKE}
            strokeWidth={anchorStrokeWidth}
            cornerRadius={2 / stageScale}
            draggable={true}
            hitStrokeWidth={0}
            onDragStart={(e) => {
              e.cancelBubble = true; // Prevent parent Group drag
            }}
            onDragMove={(e) => {
              e.cancelBubble = true; // Prevent parent Group drag
              onAnchorDrag('start', e);
            }}
            onDragEnd={(e) => {
              e.cancelBubble = true; // Prevent parent Group drag
              onAnchorDragEnd('start', e);
            }}
            onMouseEnter={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = 'move';
            }}
            onMouseLeave={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = 'default';
            }}
          />
          {/* End anchor - square matching Transformer style, scale-invariant */}
          <Rect
            x={shape.x2 - anchorOffset}
            y={shape.y2 - anchorOffset}
            width={anchorSize}
            height={anchorSize}
            fill="white"
            stroke={SELECTION_STROKE}
            strokeWidth={anchorStrokeWidth}
            cornerRadius={2 / stageScale}
            draggable={true}
            hitStrokeWidth={0}
            onDragStart={(e) => {
              e.cancelBubble = true; // Prevent parent Group drag
            }}
            onDragMove={(e) => {
              e.cancelBubble = true; // Prevent parent Group drag
              onAnchorDrag('end', e);
            }}
            onDragEnd={(e) => {
              e.cancelBubble = true; // Prevent parent Group drag
              onAnchorDragEnd('end', e);
            }}
            onMouseEnter={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = 'move';
            }}
            onMouseLeave={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = 'default';
            }}
          />
        </>
      )}
    </Group>
  );
});

LineShape.displayName = 'LineShape';
