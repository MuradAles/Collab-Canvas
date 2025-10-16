/**
 * RectangleShape Component
 * Renders a rectangle shape with transformer
 */

import { useRef, useEffect, forwardRef } from 'react';
import { Rect, Transformer } from 'react-konva';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { RectangleShape as RectangleShapeType } from '../../../types';
import { SELECTION_STROKE, SELECTION_STROKE_WIDTH } from '../../../utils/constants';

interface RectangleShapeProps {
  shape: RectangleShapeType;
  isSelected: boolean;
  canDrag: boolean;
  opacity: number;
  isLockedByOther: boolean;
  strokeColor?: string;
  strokeWidth: number;
  onShapeClick: (e: KonvaEventObject<MouseEvent>) => void;
  onDragStart: () => void;
  onDragMove: (e: KonvaEventObject<DragEvent>) => void;
  onDragEnd: (e: KonvaEventObject<DragEvent>) => void;
  onTransform: () => void;
  onTransformEnd: () => void;
}

export const RectangleShape = forwardRef<Konva.Rect, RectangleShapeProps>(
  (
    {
      shape,
      isSelected,
      canDrag,
      opacity,
      isLockedByOther,
      strokeColor,
      strokeWidth,
      onShapeClick,
      onDragStart,
      onDragMove,
      onDragEnd,
      onTransform,
      onTransformEnd,
    },
    ref
  ) => {
    const transformerRef = useRef<Konva.Transformer | null>(null);

    // Attach transformer when selected
    useEffect(() => {
      if (isSelected && transformerRef.current && ref && typeof ref !== 'function') {
        const shapeNode = ref.current;
        if (shapeNode) {
          transformerRef.current.nodes([shapeNode]);
          transformerRef.current.rotation(shape.rotation || 0);
          transformerRef.current.getLayer()?.batchDraw();
        }
      }
    }, [isSelected, shape.rotation, ref]);

    return (
      <>
        <Rect
          ref={ref}
          x={shape.x}
          y={shape.y}
          width={shape.width}
          height={shape.height}
          fill={shape.fill}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          cornerRadius={shape.cornerRadius}
          rotation={shape.rotation || 0}
          draggable={canDrag}
          onClick={onShapeClick}
          onTap={onShapeClick}
          onDragStart={onDragStart}
          onDragMove={onDragMove}
          onDragEnd={onDragEnd}
          opacity={opacity}
          listening={!isLockedByOther}
          perfectDrawEnabled={false}
        />
        {isSelected && (
          <Transformer
            ref={transformerRef}
            enabledAnchors={[
              'top-left',
              'top-right',
              'bottom-left',
              'bottom-right',
              'top-center',
              'middle-right',
              'middle-left',
              'bottom-center',
            ]}
            rotateEnabled={true}
            borderStroke={SELECTION_STROKE}
            borderStrokeWidth={SELECTION_STROKE_WIDTH}
            anchorSize={8}
            anchorFill="white"
            anchorStroke={SELECTION_STROKE}
            anchorStrokeWidth={2}
            anchorCornerRadius={2}
            onTransform={onTransform}
            onTransformEnd={onTransformEnd}
          />
        )}
      </>
    );
  }
);

RectangleShape.displayName = 'RectangleShape';

