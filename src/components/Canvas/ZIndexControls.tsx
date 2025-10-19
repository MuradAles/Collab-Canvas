/**
 * Z-Index Controls
 * Floating buttons for layer management (bring to front, send to back, etc.)
 */

import type { Shape } from '../../types';

interface ZIndexControlsProps {
  selectedShape: Shape;
  shapes: Shape[];
  stageScale: number;
  stagePosition: { x: number; y: number };
  onReorderShapes: (newOrder: Shape[]) => void;
}

export function ZIndexControls({
  selectedShape,
  shapes,
  stageScale,
  stagePosition,
  onReorderShapes,
}: ZIndexControlsProps) {
  // Hide controls during drag or transform operations
  if (selectedShape.isDragging) return null;

  // Calculate shape center position
  let shapeCenterX = 0, shapeCenterY = 0;
  let estimatedRadius = 0;
  
  if (selectedShape.type === 'line') {
    shapeCenterX = (selectedShape.x1 + selectedShape.x2) / 2;
    shapeCenterY = (selectedShape.y1 + selectedShape.y2) / 2;
    estimatedRadius = Math.max(
      Math.abs(selectedShape.x2 - selectedShape.x1),
      Math.abs(selectedShape.y2 - selectedShape.y1)
    ) / 2;
  } else if (selectedShape.type === 'circle') {
    shapeCenterX = selectedShape.x;
    shapeCenterY = selectedShape.y;
    estimatedRadius = selectedShape.radius;
  } else if (selectedShape.type === 'rectangle') {
    shapeCenterX = selectedShape.x + selectedShape.width / 2;
    shapeCenterY = selectedShape.y + selectedShape.height / 2;
    estimatedRadius = Math.sqrt(selectedShape.width ** 2 + selectedShape.height ** 2) / 2;
  } else if (selectedShape.type === 'text') {
    const textWidth = selectedShape.width || 100;
    const textHeight = selectedShape.fontSize || 16;
    shapeCenterX = selectedShape.x + textWidth / 2;
    shapeCenterY = selectedShape.y + textHeight / 2;
    estimatedRadius = Math.sqrt(textWidth ** 2 + textHeight ** 2) / 2;
  }

  // Convert canvas coordinates to screen coordinates
  const screenCenterX = shapeCenterX * stageScale + stagePosition.x;
  const screenCenterY = shapeCenterY * stageScale + stagePosition.y;
  const screenY = screenCenterY + estimatedRadius * stageScale + 20;

  // Get current index
  const currentIndex = shapes.findIndex(s => s.id === selectedShape.id);
  const canMoveUp = currentIndex < shapes.length - 1;
  const canMoveDown = currentIndex > 0;

  const handleMoveUp = () => {
    if (canMoveUp) {
      const newShapes = [...shapes];
      [newShapes[currentIndex], newShapes[currentIndex + 1]] = [newShapes[currentIndex + 1], newShapes[currentIndex]];
      onReorderShapes(newShapes);
    }
  };

  const handleMoveDown = () => {
    if (canMoveDown) {
      const newShapes = [...shapes];
      [newShapes[currentIndex], newShapes[currentIndex - 1]] = [newShapes[currentIndex - 1], newShapes[currentIndex]];
      onReorderShapes(newShapes);
    }
  };

  const handleBringToFront = () => {
    const newShapes = shapes.filter(s => s.id !== selectedShape.id);
    newShapes.push(selectedShape);
    onReorderShapes(newShapes);
  };

  const handleSendToBack = () => {
    const newShapes = shapes.filter(s => s.id !== selectedShape.id);
    newShapes.unshift(selectedShape);
    onReorderShapes(newShapes);
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: `${screenCenterX}px`,
        top: `${screenY}px`,
        transform: 'translateX(-50%)',
        zIndex: 100,
        pointerEvents: 'none',
      }}
      className="flex items-center gap-1 bg-theme-surface rounded-lg shadow-lg border border-theme p-1"
    >
      {/* Bring to Front */}
      <button
        onClick={handleBringToFront}
        disabled={!canMoveUp}
        style={{ pointerEvents: 'auto' }}
        className={`p-1.5 rounded hover:bg-theme-surface-hover transition-colors ${
          !canMoveUp ? 'opacity-30 cursor-not-allowed' : ''
        }`}
        title="Bring to Front"
      >
        <svg className="w-4 h-4 text-theme-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 9l7-7 7 7" />
        </svg>
      </button>

      {/* Move Up */}
      <button
        onClick={handleMoveUp}
        disabled={!canMoveUp}
        style={{ pointerEvents: 'auto' }}
        className={`p-1.5 rounded hover:bg-theme-surface-hover transition-colors ${
          !canMoveUp ? 'opacity-30 cursor-not-allowed' : ''
        }`}
        title="Move Up"
      >
        <svg className="w-4 h-4 text-theme-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>

      {/* Move Down */}
      <button
        onClick={handleMoveDown}
        disabled={!canMoveDown}
        style={{ pointerEvents: 'auto' }}
        className={`p-1.5 rounded hover:bg-theme-surface-hover transition-colors ${
          !canMoveDown ? 'opacity-30 cursor-not-allowed' : ''
        }`}
        title="Move Down"
      >
        <svg className="w-4 h-4 text-theme-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Send to Back */}
      <button
        onClick={handleSendToBack}
        disabled={!canMoveDown}
        style={{ pointerEvents: 'auto' }}
        className={`p-1.5 rounded hover:bg-theme-surface-hover transition-colors ${
          !canMoveDown ? 'opacity-30 cursor-not-allowed' : ''
        }`}
        title="Send to Back"
      >
        <svg className="w-4 h-4 text-theme-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 15l-7 7-7-7" />
        </svg>
      </button>
    </div>
  );
}

