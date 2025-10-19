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

    // Apply blend mode directly to Konva node (react-konva doesn't support it as prop)
    useEffect(() => {
      if (ref && typeof ref !== 'function' && ref.current) {
        const node = ref.current;
        if (shape.blendMode) {
          node.globalCompositeOperation(shape.blendMode);
        } else {
          node.globalCompositeOperation('source-over');
        }
        node.getLayer()?.batchDraw();
      }
    }, [shape.blendMode, ref, shape.id]);

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

    // Ensure all numeric values are valid (not NaN or undefined)
    const safeX = typeof shape.x === 'number' && !isNaN(shape.x) ? shape.x : 0;
    const safeY = typeof shape.y === 'number' && !isNaN(shape.y) ? shape.y : 0;
    const safeFontSize = typeof shape.fontSize === 'number' && !isNaN(shape.fontSize) ? shape.fontSize : 16;
    const safeWidth = typeof shape.width === 'number' && !isNaN(shape.width) ? shape.width : 200;
    const safeRotation = typeof shape.rotation === 'number' && !isNaN(shape.rotation) ? shape.rotation : 0;

    return (
      <>
        <Text
          ref={ref}
          x={safeX}
          y={safeY}
          text={displayText}
          fontSize={safeFontSize}
          fontFamily={shape.fontFamily}
          fontStyle={shape.fontStyle || 'normal'}
          textDecoration={shape.textDecoration || ''}
          fill={shape.fill}
          width={safeWidth}
          rotation={safeRotation}
          lineHeight={1}
          align="left"
          verticalAlign="top"
          wrap="word"
          draggable={canDrag}
          onClick={onShapeClick}
          onTap={onShapeClick}
          onDblClick={isLockedByOther ? undefined : onDoubleClick}
          onDragStart={onDragStart}
          onDragMove={onDragMove}
          onDragEnd={onDragEnd}
          opacity={shape.opacity !== undefined ? shape.opacity : opacity}
          listening={!isLockedByOther}
          perfectDrawEnabled={false}
        />
        {isSelected && (
          <Transformer
            ref={transformerRef}
            enabledAnchors={[
              'middle-left',
              'middle-right',
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
            boundBoxFunc={(oldBox, newBox) => {
              // Only allow width changes, prevent scaling
              // Keep the same height, only change width
              return {
                ...newBox,
                height: oldBox.height,
              };
            }}
          />
        )}
      </>
    );
  }
);

TextShape.displayName = 'TextShape';

