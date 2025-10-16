/**
 * TextShape Component
 * Renders a text shape with transformer
 */

import { useRef, useEffect, forwardRef } from 'react';
import { Text, Transformer } from 'react-konva';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { TextShape as TextShapeType } from '../../../types';
import { SELECTION_STROKE, SELECTION_STROKE_WIDTH } from '../../../utils/constants';

interface TextShapeProps {
  shape: TextShapeType;
  isSelected: boolean;
  canDrag: boolean;
  opacity: number;
  isLockedByOther: boolean;
  onShapeClick: (e: KonvaEventObject<MouseEvent>) => void;
  onDoubleClick?: () => void;
  onDragStart: () => void;
  onDragMove: (e: KonvaEventObject<DragEvent>) => void;
  onDragEnd: (e: KonvaEventObject<DragEvent>) => void;
  onTransform: () => void;
  onTransformEnd: () => void;
}

export const TextShape = forwardRef<Konva.Text, TextShapeProps>(
  (
    {
      shape,
      isSelected,
      canDrag,
      opacity,
      isLockedByOther,
      onShapeClick,
      onDoubleClick,
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

    const displayText = shape.text || 'Text';

    return (
      <>
        <Text
          ref={ref}
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
          onClick={onShapeClick}
          onTap={onShapeClick}
          onDblClick={isLockedByOther ? undefined : onDoubleClick}
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
              'middle-left',
              'middle-right',
              'top-center',
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

TextShape.displayName = 'TextShape';

