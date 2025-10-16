/**
 * ShapeIndicators Component
 * Renders lock and drag indicators for shapes
 */

import { Label, Tag, Text } from 'react-konva';
import type { Shape as ShapeType, LineShape } from '../../types';

interface ShapeIndicatorsProps {
  shape: ShapeType;
  isDraggedByOther: boolean;
  isLockedByOther: boolean;
}

export function ShapeIndicators({ shape, isDraggedByOther, isLockedByOther }: ShapeIndicatorsProps) {
  // Calculate label position based on shape type
  const getLabelPosition = () => {
    if (shape.type === 'line') {
      const lineShape = shape as LineShape;
      return {
        x: (lineShape.x1 + lineShape.x2) / 2,
        y: Math.min(lineShape.y1, lineShape.y2) - 25,
      };
    } else if (shape.type === 'circle') {
      return {
        x: shape.x,
        y: shape.y - shape.radius - 25,
      };
    } else {
      // Rectangle, text
      return {
        x: shape.x,
        y: shape.y - 25,
      };
    }
  };

  const position = getLabelPosition();

  // Show dragging indicator for shapes being dragged by others
  if (isDraggedByOther && shape.draggingByName) {
    return (
      <Label x={position.x} y={position.y} opacity={0.95}>
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

  // Show lock indicator if locked by another user
  if (isLockedByOther && shape.lockedByName) {
    return (
      <Label x={position.x} y={position.y} opacity={0.95}>
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
  }

  return null;
}

