/**
 * Canvas Component
 * Main canvas with pan, zoom, shape creation, and manipulation
 * Uses Konva for high-performance 2D rendering
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Line, Rect, Circle } from 'react-konva';
import type Konva from 'konva';
import { useCanvasContext } from '../../contexts/CanvasContext';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  MIN_ZOOM,
  MAX_ZOOM,
  DEFAULT_ZOOM,
  DEFAULT_SHAPE_FILL,
  DEFAULT_SHAPE_STROKE,
  DEFAULT_SHAPE_STROKE_WIDTH,
  DEFAULT_STROKE_POSITION,
  DEFAULT_CORNER_RADIUS,
  MIN_SHAPE_SIZE,
  DEFAULT_TEXT_CONTENT,
  DEFAULT_TEXT_SIZE,
  DEFAULT_TEXT_FONT,
  DEFAULT_TEXT_FILL,
} from '../../utils/constants';
import { screenToCanvas, normalizeRectangle } from '../../utils/helpers';
import { CanvasControls } from './CanvasControls';
import { GridToggle } from './GridToggle';
import { ToolSelector, type Tool } from './ToolSelector';
import { Shape } from './Shape';
import { PropertiesPanel } from './PropertiesPanel';
import { LayersPanel } from './LayersPanel';
import type { RectangleShape, CircleShape, TextShape, ShapeUpdate } from '../../types';

interface NewShapePreview {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function Canvas() {
  const stageRef = useRef<Konva.Stage | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  const [stageSize, setStageSize] = useState({ width: 1200, height: 800 });
  const [stageScale, setStageScale] = useState(DEFAULT_ZOOM);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [selectedTool, setSelectedTool] = useState<Tool>('select');
  
  // Shape creation state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [newShapePreview, setNewShapePreview] = useState<NewShapePreview | null>(null);

  const { shapes, selectedId, selectShape, addShape, updateShape, deleteShape, reorderShapes } = useCanvasContext();

  const selectedShape = shapes.find(s => s.id === selectedId) || null;

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
      const canvasScaledWidth = CANVAS_WIDTH * scale;
      const canvasScaledHeight = CANVAS_HEIGHT * scale;

      let newX = pos.x;
      let newY = pos.y;

      // Constrain X
      if (canvasScaledWidth > viewportWidth) {
        const minX = viewportWidth - canvasScaledWidth;
        const maxX = 0;
        newX = Math.max(minX, Math.min(maxX, pos.x));
      } else {
        newX = (viewportWidth - canvasScaledWidth) / 2;
      }

      // Constrain Y
      if (canvasScaledHeight > viewportHeight) {
        const minY = viewportHeight - canvasScaledHeight;
        const maxY = 0;
        newY = Math.max(minY, Math.min(maxY, pos.y));
      } else {
        newY = (viewportHeight - canvasScaledHeight) / 2;
      }

      return { x: newX, y: newY };
    },
    []
  );

  /**
   * Handle window resize
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
   */
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();

      const stage = stageRef.current;
      if (!stage) return;

      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const scaleBy = 1.1;
      const direction = e.evt.deltaY > 0 ? -1 : 1;
      
      let newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
      newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newScale));
      
      if (newScale === oldScale) return;

      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };

      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };

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
   * Handle panning with Ctrl+drag
   */
  const handleStageMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const isCtrlPressed = e.evt.ctrlKey || e.evt.metaKey;
    
    // Start panning if Ctrl is pressed (allow panning from anywhere)
    if (isCtrlPressed) {
      setIsPanning(true);
      const stage = stageRef.current;
      if (stage) {
        const pointer = stage.getPointerPosition();
        if (pointer) {
          setPanStart({
            x: pointer.x - stagePosition.x,
            y: pointer.y - stagePosition.y
          });
        }
      }
      // Prevent default behavior when Ctrl is pressed
      e.evt.preventDefault();
    }
  }, [stagePosition]);

  const handleStageMouseMove = useCallback(() => {
    if (!isPanning || !panStart) return;
    
    const stage = stageRef.current;
    if (!stage) return;
    
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    
    const newPos = {
      x: pointer.x - panStart.x,
      y: pointer.y - panStart.y
    };
    
    const constrainedPos = constrainPosition(
      newPos,
      stageScale,
      stageSize.width,
      stageSize.height
    );
    
    setStagePosition(constrainedPos);
  }, [isPanning, panStart, stageScale, stageSize, constrainPosition]);

  const handleStageMouseUp = useCallback(() => {
    setIsPanning(false);
    setPanStart(null);
  }, []);

  /**
   * Handle mouse down - start shape creation
   */
  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const isCtrlPressed = e.evt.ctrlKey || e.evt.metaKey;
      
      // If Ctrl is pressed, panning is handled by handleStageMouseDown
      if (isCtrlPressed) {
        return;
      }

      // Only start drawing if a shape or text tool is selected
      if (selectedTool === 'rectangle' || selectedTool === 'circle' || selectedTool === 'text') {
        const stage = stageRef.current;
        if (!stage) return;

        const pointer = stage.getPointerPosition();
        if (!pointer) return;

        // Convert screen coordinates to canvas coordinates
        const canvasPos = screenToCanvas(
          pointer.x,
          pointer.y,
          stagePosition.x,
          stagePosition.y,
          stageScale
        );

        if (selectedTool === 'rectangle' || selectedTool === 'circle') {
          setIsDrawing(true);
          setDrawStart(canvasPos);
          setNewShapePreview({
            x: canvasPos.x,
            y: canvasPos.y,
            width: 0,
            height: 0,
          });
        } else if (selectedTool === 'text') {
          // Create text immediately at click position
          const textShape: Omit<TextShape, 'id' | 'isLocked' | 'lockedBy' | 'lockedByName'> = {
            type: 'text',
            x: canvasPos.x,
            y: canvasPos.y,
            text: DEFAULT_TEXT_CONTENT,
            fontSize: DEFAULT_TEXT_SIZE,
            fontFamily: DEFAULT_TEXT_FONT,
            fill: DEFAULT_TEXT_FILL,
          };
          addShape(textShape);
          setSelectedTool('select'); // Switch back to select tool
        }
      }
    },
    [stagePosition, stageScale, selectedTool, addShape]
  );

  /**
   * Handle mouse move - update shape preview while drawing
   */
  const handleMouseMove = useCallback(
    () => {
      if (!isDrawing || !drawStart || (selectedTool !== 'rectangle' && selectedTool !== 'circle')) return;

      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const canvasPos = screenToCanvas(
        pointer.x,
        pointer.y,
        stagePosition.x,
        stagePosition.y,
        stageScale
      );

      const normalized = normalizeRectangle(
        drawStart.x,
        drawStart.y,
        canvasPos.x,
        canvasPos.y
      );

      setNewShapePreview(normalized);
    },
    [isDrawing, drawStart, stagePosition, stageScale, selectedTool]
  );

  /**
   * Handle mouse up - finish drawing a shape
   */
  const handleMouseUp = useCallback(async () => {
    if (!isDrawing || !newShapePreview || (selectedTool !== 'rectangle' && selectedTool !== 'circle')) {
      setIsDrawing(false);
      setDrawStart(null);
      setNewShapePreview(null);
      return;
    }

    // Only create shape if it's large enough
    if (
      newShapePreview.width >= MIN_SHAPE_SIZE &&
      newShapePreview.height >= MIN_SHAPE_SIZE
    ) {
      if (selectedTool === 'rectangle') {
        const rectShape: Omit<RectangleShape, 'id' | 'name' | 'isLocked' | 'lockedBy' | 'lockedByName'> = {
          type: 'rectangle',
          x: newShapePreview.x,
          y: newShapePreview.y,
          width: newShapePreview.width,
          height: newShapePreview.height,
          fill: DEFAULT_SHAPE_FILL,
          stroke: DEFAULT_SHAPE_STROKE,
          strokeWidth: DEFAULT_SHAPE_STROKE_WIDTH,
          strokePosition: DEFAULT_STROKE_POSITION,
          cornerRadius: DEFAULT_CORNER_RADIUS,
        };
        await addShape(rectShape);
      } else if (selectedTool === 'circle') {
        // Create circle based on drag size
        const radius = Math.max(newShapePreview.width, newShapePreview.height) / 2;
        const circleShape: Omit<CircleShape, 'id' | 'name' | 'isLocked' | 'lockedBy' | 'lockedByName'> = {
          type: 'circle',
          x: newShapePreview.x + newShapePreview.width / 2,
          y: newShapePreview.y + newShapePreview.height / 2,
          radius: radius,
          fill: DEFAULT_SHAPE_FILL,
          stroke: DEFAULT_SHAPE_STROKE,
          strokeWidth: DEFAULT_SHAPE_STROKE_WIDTH,
          strokePosition: DEFAULT_STROKE_POSITION,
        };
        await addShape(circleShape);
      }
    }

    // Reset drawing state
    setIsDrawing(false);
    setDrawStart(null);
    setNewShapePreview(null);
  }, [isDrawing, newShapePreview, addShape, selectedTool]);

  /**
   * Handle clicks on stage background to deselect
   */
  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.target === e.target.getStage()) {
        selectShape(null);
      }
    },
    [selectShape]
  );

  /**
   * Handle shape drag end
   */
  const handleShapeDragEnd = useCallback(
    (shapeId: string, x: number, y: number) => {
      updateShape(shapeId, { x, y });
    },
    [updateShape]
  );

  /**
   * Handle shape transform end (resize)
   */
  const handleShapeTransformEnd = useCallback(
    (shapeId: string, updates: { x?: number; y?: number; width?: number; height?: number }) => {
      updateShape(shapeId, updates);
    },
    [updateShape]
  );

  /**
   * Handle property updates from panel
   */
  const handlePropertyUpdate = useCallback(
    (updates: ShapeUpdate) => {
      if (selectedId) {
        updateShape(selectedId, updates);
      }
    },
    [selectedId, updateShape]
  );

  /**
   * Zoom controls
   */
  const handleZoomIn = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const scaleBy = 1.15;
    const newScale = Math.min(MAX_ZOOM, oldScale * scaleBy);
    
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

    const constrainedPos = constrainPosition(
      newPos,
      newScale,
      stageSize.width,
      stageSize.height
    );

    setStageScale(newScale);
    setStagePosition(constrainedPos);
  }, [stageSize, constrainPosition]);

  const handleZoomOut = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const scaleBy = 1.15;
    const newScale = Math.max(MIN_ZOOM, oldScale / scaleBy);
    
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

    const constrainedPos = constrainPosition(
      newPos,
      newScale,
      stageSize.width,
      stageSize.height
    );

    setStageScale(newScale);
    setStagePosition(constrainedPos);
  }, [stageSize, constrainPosition]);

  const handleResetView = useCallback(() => {
    setStageScale(DEFAULT_ZOOM);
    setStagePosition({ x: 0, y: 0 });
  }, []);

  const handleToggleGrid = useCallback(() => {
    setShowGrid((prev) => !prev);
  }, []);

  /**
   * Render grid lines
   */
  const renderGrid = useCallback(() => {
    if (!showGrid) return null;

    const gridSize = 50;
    const lines = [];
    const gridColor = '#e0e0e0';
    const thickLineColor = '#d0d0d0';

    for (let i = 0; i <= CANVAS_WIDTH; i += gridSize) {
      const isThick = i % (gridSize * 5) === 0;
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

    for (let i = 0; i <= CANVAS_HEIGHT; i += gridSize) {
      const isThick = i % (gridSize * 5) === 0;
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

  /**
   * Keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Tool shortcuts
      if (e.key === 'v' || e.key === 'V') {
        setSelectedTool('select');
        return;
      }
      if (e.key === 'r' || e.key === 'R') {
        setSelectedTool('rectangle');
        return;
      }
      if (e.key === 'c' || e.key === 'C') {
        setSelectedTool('circle');
        return;
      }
      if (e.key === 't' || e.key === 'T') {
        setSelectedTool('text');
        return;
      }

      // Delete selected shape
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) {
          e.preventDefault();
          deleteShape(selectedId);
        }
      }
      
      // Escape to deselect
      if (e.key === 'Escape') {
        selectShape(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, deleteShape, selectShape]);

  const getCursorStyle = useCallback(() => {
    if (isPanning) return 'grabbing';
    if (isDrawing) return 'crosshair';
    if (selectedTool === 'rectangle' || selectedTool === 'circle' || selectedTool === 'text') return 'crosshair';
    return 'default';
  }, [isPanning, isDrawing, selectedTool]);

  // Track Ctrl key state for cursor feedback
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Control' || e.key === 'Meta') && !isPanning) {
        const stage = stageRef.current;
        if (stage) {
          stage.container().style.cursor = 'grab';
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if ((e.key === 'Control' || e.key === 'Meta') && !isPanning) {
        const stage = stageRef.current;
        if (stage) {
          stage.container().style.cursor = getCursorStyle();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPanning, getCursorStyle]);

  return (
    <div className="flex h-full">
      {/* Layers Panel */}
      <LayersPanel
        shapes={shapes}
        selectedId={selectedId}
        onSelectShape={selectShape}
        onReorderShapes={reorderShapes}
      />

      {/* Main Canvas Area */}
      <div
        ref={containerRef}
        className="flex-1 relative bg-gray-100 overflow-hidden"
      >
        {/* Grid Toggle */}
        <GridToggle showGrid={showGrid} onToggle={handleToggleGrid} />

        {/* Tool Selector */}
        <ToolSelector selectedTool={selectedTool} onToolChange={setSelectedTool} />

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
          draggable={false}
          onWheel={handleWheel}
          onMouseDown={(e) => {
            handleStageMouseDown(e);
            handleMouseDown(e);
          }}
          onMouseMove={(e) => {
            handleStageMouseMove();
            handleMouseMove();
          }}
          onMouseUp={(e) => {
            handleStageMouseUp();
            handleMouseUp();
          }}
          onClick={handleStageClick}
          onTap={handleStageClick}
          scaleX={stageScale}
          scaleY={stageScale}
          x={stagePosition.x}
          y={stagePosition.y}
          style={{ cursor: getCursorStyle() }}
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

            {/* Render all shapes */}
            {shapes.map((shape) => (
              <Shape
                key={shape.id}
                shape={shape}
                isSelected={shape.id === selectedId}
                onSelect={() => selectShape(shape.id)}
                onDragEnd={(x, y) => handleShapeDragEnd(shape.id, x, y)}
                onTransformEnd={(updates) => handleShapeTransformEnd(shape.id, updates)}
                isDraggable={selectedTool === 'select'}
              />
            ))}

            {/* Shape preview while drawing */}
            {isDrawing && newShapePreview && newShapePreview.width > 0 && newShapePreview.height > 0 && (
              <>
                {selectedTool === 'rectangle' && (
                  <Rect
                    x={newShapePreview.x}
                    y={newShapePreview.y}
                    width={newShapePreview.width}
                    height={newShapePreview.height}
                    fill={DEFAULT_SHAPE_FILL}
                    opacity={0.5}
                    stroke={DEFAULT_SHAPE_STROKE}
                    strokeWidth={2}
                    dash={[5, 5]}
                    listening={false}
                  />
                )}
                {selectedTool === 'circle' && (
                  <Circle
                    x={newShapePreview.x + newShapePreview.width / 2}
                    y={newShapePreview.y + newShapePreview.height / 2}
                    radius={Math.max(newShapePreview.width, newShapePreview.height) / 2}
                    fill={DEFAULT_SHAPE_FILL}
                    opacity={0.5}
                    stroke={DEFAULT_SHAPE_STROKE}
                    strokeWidth={2}
                    dash={[5, 5]}
                    listening={false}
                  />
                )}
              </>
            )}
          </Layer>
        </Stage>

        {/* Canvas info overlay */}
        <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 px-3 py-2 rounded-lg shadow-lg text-xs text-gray-600">
          <div className="font-semibold text-gray-700 mb-1">Canvas Info</div>
          <div>Tool: {selectedTool}</div>
          <div>Zoom: {(stageScale * 100).toFixed(0)}%</div>
          <div>Shapes: {shapes.length}</div>
          <div className="mt-2 pt-2 border-t border-gray-200 text-gray-500">
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">Ctrl</kbd>
              <span>+ Drag to Pan</span>
            </div>
          </div>
        </div>
      </div>

      {/* Properties Panel */}
      <PropertiesPanel
        selectedShape={selectedShape}
        onUpdate={handlePropertyUpdate}
      />
    </div>
  );
}
