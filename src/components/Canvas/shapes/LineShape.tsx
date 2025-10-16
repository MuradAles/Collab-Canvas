/**
 * LineShape Component
 * Renders a line shape with draggable anchors
 */

import { Group, Line, Circle } from 'react-konva';
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
}

export function LineShape({
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
}: LineShapeProps) {
  // Match transformer anchor size (anchorSize=8 means 8x8 box, so radius=4 for circle)
  const anchorRadius = 4;

  return (
    <Group
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
        points={[shape.x1, shape.y1, shape.x2, shape.y2]}
        stroke={shape.stroke}
        strokeWidth={shape.strokeWidth}
        lineCap={shape.lineCap}
        opacity={opacity}
        listening={false}
        perfectDrawEnabled={false}
      />
      {isSelected && !isLockedByOther && (
        <>
          {/* Start anchor */}
          <Circle
            x={shape.x1}
            y={shape.y1}
            radius={anchorRadius}
            fill="white"
            stroke={SELECTION_STROKE}
            strokeWidth={2}
            draggable={true}
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
          {/* End anchor */}
          <Circle
            x={shape.x2}
            y={shape.y2}
            radius={anchorRadius}
            fill="white"
            stroke={SELECTION_STROKE}
            strokeWidth={2}
            draggable={true}
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
}

