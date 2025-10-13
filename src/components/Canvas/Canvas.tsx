/**
 * Canvas Component
 * Main canvas with pan, zoom, and shape rendering
 * Uses Konva for high-performance 2D rendering
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Line, Rect } from 'react-konva';
import type Konva from 'konva';
import { useCanvasContext } from '../../contexts/CanvasContext';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  MIN_ZOOM,
  MAX_ZOOM,
  DEFAULT_ZOOM,
} from '../../utils/constants';
import { CanvasControls } from './CanvasControls';
import { GridToggle } from './GridToggle';

export function Canvas() {
  const stageRef = useRef<Konva.Stage | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  const [stageSize, setStageSize] = useState({ width: 1200, height: 800 });
  const [stageScale, setStageScale] = useState(DEFAULT_ZOOM);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [showGrid, setShowGrid] = useState(true);

  const { shapes, selectShape } = useCanvasContext();

  /**
   * Constrain stage position to canvas boundaries
   */
  const constrainPosition = useCallback(
    (
      pos: { x: number; y: number },
      scale: number,
      viewportWidth: number,
      viewportHeight: number
    ) => {
      // When zoomed out (scale < 1), allow more panning
      // When zoomed in (scale > 1), restrict panning
      const canvasScaledWidth = CANVAS_WIDTH * scale;
      const canvasScaledHeight = CANVAS_HEIGHT * scale;

      let newX = pos.x;
      let newY = pos.y;

      // Constrain X
      if (canvasScaledWidth > viewportWidth) {
        // Canvas is larger than viewport - restrict panning
        const minX = viewportWidth - canvasScaledWidth;
        const maxX = 0;
        newX = Math.max(minX, Math.min(maxX, pos.x));
      } else {
        // Canvas is smaller than viewport - center it
        newX = (viewportWidth - canvasScaledWidth) / 2;
      }

      // Constrain Y
      if (canvasScaledHeight > viewportHeight) {
        // Canvas is larger than viewport - restrict panning
        const minY = viewportHeight - canvasScaledHeight;
        const maxY = 0;
        newY = Math.max(minY, Math.min(maxY, pos.y));
      } else {
        // Canvas is smaller than viewport - center it
        newY = (viewportHeight - canvasScaledHeight) / 2;
      }

      return { x: newX, y: newY };
    },
    []
  );

  /**
   * Handle window resize to update stage size
   */
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        const height = containerRef.current.offsetHeight;
        setStageSize({ width, height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  /**
   * Handle zoom with mousewheel
   * Zooms to cursor position with smooth scaling
   */
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();

      const stage = stageRef.current;
      if (!stage) return;

      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // Smooth zoom using multiplicative scaling
      const scaleBy = 1.1; // 2% change per scroll tick - very smooth
      const direction = e.evt.deltaY > 0 ? -1 : 1;
      
      // Calculate new scale
      let newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
      
      // Clamp to min/max zoom
      newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newScale));
      
      // If already at limit, don't process
      if (newScale === oldScale) return;

      // Calculate new position to zoom to cursor
      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };

      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };

      // Constrain the new position
      const constrainedPos = constrainPosition(
        newPos,
        newScale,
        stageSize.width,
        stageSize.height
      );

      setStageScale(newScale);
      setStagePosition(constrainedPos);
    },
    [stageSize, constrainPosition]
  );

  /**
   * Handle stage drag start
   * Only allow drag if Ctrl/Cmd is pressed
   */
  const handleDragStart = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    const isCtrlPressed = e.evt.ctrlKey || e.evt.metaKey;
    
    if (!isCtrlPressed) {
      // Cancel the drag if Ctrl is not pressed
      const stage = e.target as Konva.Stage;
      stage.stopDrag();
      return;
    }
    
    setIsDragging(true);
  }, []);

  /**
   * Handle stage drag end with boundary constraints
   */
  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      setIsDragging(false);
      
      const stage = e.target as Konva.Stage;
      const newPos = stage.position();

      // Constrain position based on current scale
      const constrainedPos = constrainPosition(
        newPos,
        stageScale,
        stageSize.width,
        stageSize.height
      );

      setStagePosition(constrainedPos);
    },
    [stageScale, stageSize, constrainPosition]
  );

  /**
   * Handle clicks on stage background to deselect
   */
  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Only deselect if clicking on stage (not on a shape)
      if (e.target === e.target.getStage()) {
        selectShape(null);
      }
    },
    [selectShape]
  );

  /**
   * Zoom in programmatically
   */
  const handleZoomIn = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    // Use 15% increment for button clicks (faster than scroll but still smooth)
    const scaleBy = 1.15;
    const newScale = Math.min(MAX_ZOOM, oldScale * scaleBy);
    
    // Zoom to center
    const center = {
      x: stageSize.width / 2,
      y: stageSize.height / 2,
    };

    const mousePointTo = {
      x: (center.x - stage.x()) / oldScale,
      y: (center.y - stage.y()) / oldScale,
    };

    const newPos = {
      x: center.x - mousePointTo.x * newScale,
      y: center.y - mousePointTo.y * newScale,
    };

    // Constrain the new position
    const constrainedPos = constrainPosition(
      newPos,
      newScale,
      stageSize.width,
      stageSize.height
    );

    setStageScale(newScale);
    setStagePosition(constrainedPos);
  }, [stageSize, constrainPosition]);

  /**
   * Zoom out programmatically
   */
  const handleZoomOut = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    // Use 15% decrement for button clicks (faster than scroll but still smooth)
    const scaleBy = 1.15;
    const newScale = Math.max(MIN_ZOOM, oldScale / scaleBy);
    
    // Zoom to center
    const center = {
      x: stageSize.width / 2,
      y: stageSize.height / 2,
    };

    const mousePointTo = {
      x: (center.x - stage.x()) / oldScale,
      y: (center.y - stage.y()) / oldScale,
    };

    const newPos = {
      x: center.x - mousePointTo.x * newScale,
      y: center.y - mousePointTo.y * newScale,
    };

    // Constrain the new position
    const constrainedPos = constrainPosition(
      newPos,
      newScale,
      stageSize.width,
      stageSize.height
    );

    setStageScale(newScale);
    setStagePosition(constrainedPos);
  }, [stageSize, constrainPosition]);

  /**
   * Reset view to default
   */
  const handleResetView = useCallback(() => {
    setStageScale(DEFAULT_ZOOM);
    setStagePosition({ x: 0, y: 0 });
  }, []);

  /**
   * Toggle grid visibility
   */
  const handleToggleGrid = useCallback(() => {
    setShowGrid((prev) => !prev);
  }, []);

  /**
   * Render grid lines
   */
  const renderGrid = useCallback(() => {
    if (!showGrid) return null;

    const gridSize = 50; // Grid spacing in pixels
    const lines = [];
    const gridColor = '#e0e0e0';
    const thickLineColor = '#d0d0d0';

    // Vertical lines
    for (let i = 0; i <= CANVAS_WIDTH; i += gridSize) {
      const isThick = i % (gridSize * 5) === 0; // Every 5th line is thicker
      lines.push(
        <Line
          key={`v-${i}`}
          points={[i, 0, i, CANVAS_HEIGHT]}
          stroke={isThick ? thickLineColor : gridColor}
          strokeWidth={isThick ? 1.5 : 0.5}
          listening={false}
        />
      );
    }

    // Horizontal lines
    for (let i = 0; i <= CANVAS_HEIGHT; i += gridSize) {
      const isThick = i % (gridSize * 5) === 0; // Every 5th line is thicker
      lines.push(
        <Line
          key={`h-${i}`}
          points={[0, i, CANVAS_WIDTH, i]}
          stroke={isThick ? thickLineColor : gridColor}
          strokeWidth={isThick ? 1.5 : 0.5}
          listening={false}
        />
      );
    }

    return lines;
  }, [showGrid]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-gray-100 overflow-hidden"
    >
      {/* Grid Toggle */}
      <GridToggle showGrid={showGrid} onToggle={handleToggleGrid} />

      {/* Canvas Controls */}
      <CanvasControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
        currentZoom={stageScale}
      />

      {/* Konva Stage */}
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        draggable={true}
        onWheel={handleWheel}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={handleStageClick}
        onTap={handleStageClick}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePosition.x}
        y={stagePosition.y}
        style={{ cursor: isDragging ? 'grabbing' : 'default' }}
      >
        <Layer>
          {/* Canvas background */}
          <Rect
            x={0}
            y={0}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            fill="white"
            shadowColor="rgba(0, 0, 0, 0.1)"
            shadowBlur={20}
            shadowOffset={{ x: 0, y: 0 }}
            listening={false}
          />

          {/* Grid lines */}
          {renderGrid()}

          {/* Shapes will be rendered here in PR #4 */}
        </Layer>
      </Stage>

      {/* Canvas info overlay (for debugging) */}
      <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 px-3 py-2 rounded-lg shadow-lg text-xs text-gray-600">
        <div className="font-semibold text-gray-700 mb-1">Canvas Info</div>
        <div>Size: {CANVAS_WIDTH}x{CANVAS_HEIGHT}px</div>
        <div>Zoom: {(stageScale * 100).toFixed(0)}%</div>
        <div>Position: ({Math.round(stagePosition.x)}, {Math.round(stagePosition.y)})</div>
        <div>Shapes: {shapes.length}</div>
        <div className="mt-2 pt-2 border-t border-gray-200 text-gray-500">
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">Ctrl</kbd>
            <span>+ Drag to Pan</span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">Scroll</kbd>
            <span>to Zoom</span>
          </div>
        </div>
      </div>
    </div>
  );
}

