/**
 * Cursor Component
 * Displays another user's cursor position with their name label
 * Rendered as Konva shapes within the canvas (not HTML overlay)
 * Maintains constant size regardless of zoom level
 */

import React, { useMemo } from 'react';
import { Group, Path, Text, Rect } from 'react-konva';
import type { PresenceData } from '../../services/presence';

interface CursorProps {
  user: PresenceData;
  scale: number; // Current canvas scale for inverse scaling
}

export const Cursor = React.memo<CursorProps>(({ user, scale }) => {
  if (!user.isOnline) return null;

  const { cursorX, cursorY, displayName } = user;

  // Orange color for all cursors
  const cursorColor = '#FF6B35'; // Vibrant orange

  // Inverse scale to maintain constant size regardless of zoom
  const inverseScale = 1 / scale;

  // Better cursor SVG path (more polished arrow design)
  // This creates a sleek cursor pointer with a nice tail
  const cursorPath = 'M 0 0 L 0 16 L 4.5 12 L 7 18 L 9 17 L 6.5 11 L 12 11 Z';

  // Calculate text width for background sizing
  const textWidth = useMemo(() => {
    // Rough estimation: 7 pixels per character + padding
    return displayName.length * 7 + 16;
  }, [displayName]);

  return (
    <Group
      x={cursorX}
      y={cursorY}
      scaleX={inverseScale}
      scaleY={inverseScale}
      listening={false} // Don't capture mouse events
    >
      {/* Cursor pointer with white outline */}
      <Path
        data={cursorPath}
        fill={cursorColor}
        stroke="white"
        strokeWidth={1.5}
        shadowColor="rgba(0,0,0,0.4)"
        shadowBlur={3}
        shadowOffset={{ x: 1, y: 1 }}
        shadowOpacity={0.6}
      />

      {/* Name label background */}
      <Rect
        x={14}
        y={2}
        width={textWidth}
        height={20}
        fill={cursorColor}
        cornerRadius={4}
        shadowColor="rgba(0,0,0,0.25)"
        shadowBlur={4}
        shadowOffset={{ x: 0, y: 2 }}
        shadowOpacity={0.8}
      />

      {/* Name label text */}
      <Text
        x={22}
        y={6}
        text={displayName}
        fontSize={12}
        fontFamily="'Inter', 'Segoe UI', 'Arial', sans-serif"
        fontStyle="600"
        fill="white"
        align="left"
      />
    </Group>
  );
});

Cursor.displayName = 'Cursor';

