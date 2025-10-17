/**
 * SelectionDragIndicator Component
 * Shows a bounding box indicator when remote users drag multiple shapes (10+)
 * Optimizes performance by avoiding individual shape rendering during drag
 */

import { Rect, Text, Group } from 'react-konva';
import type { SelectionDrag } from '../../services/dragSync';

interface SelectionDragIndicatorProps {
  selectionDrag: SelectionDrag;
  scale: number;
}

export function SelectionDragIndicator({ selectionDrag, scale }: SelectionDragIndicatorProps) {
  const { userName, userColor, shapeCount, boundingBox } = selectionDrag;
  const { x, y, width, height } = boundingBox;

  // Calculate scaled stroke width and dash (so they stay consistent at any zoom)
  const strokeWidth = 2 / scale;
  const dashSize = 8 / scale;
  const gapSize = 4 / scale;

  // Label dimensions
  const labelPadding = 8 / scale;
  const labelFontSize = 14 / scale;
  const labelHeight = labelFontSize + labelPadding * 2;
  const labelText = `${userName} • ${shapeCount} shapes`;
  
  // Estimate label width (rough approximation)
  const labelWidth = labelText.length * (labelFontSize * 0.6) + labelPadding * 2;

  return (
    <Group>
      {/* Bounding box rectangle */}
      <Rect
        x={x}
        y={y}
        width={width}
        height={height}
        stroke={userColor}
        strokeWidth={strokeWidth}
        dash={[dashSize, gapSize]}
        fill="transparent"
        listening={false}
        shadowColor={userColor}
        shadowBlur={10 / scale}
        shadowOpacity={0.3}
      />

      {/* Label background */}
      <Rect
        x={x}
        y={y - labelHeight - 4 / scale}
        width={labelWidth}
        height={labelHeight}
        fill={userColor}
        cornerRadius={4 / scale}
        listening={false}
        shadowColor="rgba(0, 0, 0, 0.2)"
        shadowBlur={4 / scale}
        shadowOffsetY={2 / scale}
      />

      {/* Label text */}
      <Text
        x={x + labelPadding}
        y={y - labelHeight - 4 / scale + labelPadding}
        text={labelText}
        fontSize={labelFontSize}
        fontFamily="Arial"
        fill="white"
        fontStyle="bold"
        listening={false}
      />

      {/* Optional: Corner indicators for better visibility */}
      {[
        { x: x, y: y }, // Top-left
        { x: x + width, y: y }, // Top-right
        { x: x, y: y + height }, // Bottom-left
        { x: x + width, y: y + height }, // Bottom-right
      ].map((corner, index) => (
        <Rect
          key={index}
          x={corner.x - 3 / scale}
          y={corner.y - 3 / scale}
          width={6 / scale}
          height={6 / scale}
          fill={userColor}
          listening={false}
        />
      ))}
    </Group>
  );
}

