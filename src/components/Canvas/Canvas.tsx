/**
 * Canvas Component
 * Main canvas with pan, zoom, shape creation, and manipulation
 * Uses Konva for high-performance 2D rendering
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Rect, Circle, Line } from 'react-konva';
import type Konva from 'konva';
import { useCanvasContext } from '../../contexts/CanvasContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  DEFAULT_SHAPE_FILL,
  DEFAULT_SHAPE_STROKE,
} from '../../utils/constants';
import { updateCursorPosition } from '../../services/presence';
import { screenToCanvas } from '../../utils/helpers';
import { renderGrid } from '../../utils/gridRenderer';
import { CanvasControls } from './CanvasControls';
import { GridToggle } from './GridToggle';
import { ToolSelector, type Tool } from './ToolSelector';
import { Shape } from './Shape';
import { PropertiesPanel } from './PropertiesPanel';
import { LayersPanel } from './LayersPanel';
import { CursorsLayer } from './CursorsLayer';
import { FPSCounter } from './FPSCounter';
import { useCanvasPanZoom } from '../../hooks/useCanvasPanZoom';
import { useShapeDrawing } from '../../hooks/useShapeDrawing';
import { useTextEditing } from '../../hooks/useTextEditing';
import { useShapeInteraction } from '../../hooks/useShapeInteraction';
import type { TextShape, ShapeUpdate } from '../../types';

export function Canvas() {
  const stageRef = useRef<Konva.Stage | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // Calculate initial size based on viewport - leaving room for panels and navbar
  // LayersPanel: 240px (w-60), PropertiesPanel: 256px (w-64), Navbar: 64px
  const [stageSize, setStageSize] = useState({ 
    width: Math.max(800, window.innerWidth - 240 - 256), 
    height: Math.max(600, window.innerHeight - 64) 
  });
  
  const [showGrid, setShowGrid] = useState(true);
  const [selectedTool, setSelectedTool] = useState<Tool>('select');

  const { shapes, selectedIds, selectShape, addShape, updateShape, deleteShape, reorderShapes, loading } = useCanvasContext();
  const { currentUser } = useAuth();

  const selectedShapes = shapes.filter(s => selectedIds.includes(s.id));
  const selectedShape = selectedShapes.length === 1 ? selectedShapes[0] : null;

  // Pan/Zoom Hook
  const {
    stageScale,
    stagePosition,
    isPanning,
    handleWheel,
    handlePanStart,
    handlePanMove,
    handlePanEnd,
    handleZoomIn,
    handleZoomOut,
    handleResetView,
  } = useCanvasPanZoom({ stageRef, stageSize });

  // Shape Drawing Hook
  const {
    isDrawing,
    newShapePreview,
    newLinePreview,
    handleDrawStart,
    handleDrawMove,
    handleDrawEnd,
  } = useShapeDrawing({
    stageRef,
    stagePosition,
    stageScale,
    selectedTool,
    setSelectedTool,
    addShape,
    onTextCreated: (shapeId) => {
      // Start editing the newly created text shape
      startEditingNewText(shapeId);
    },
  });

  // Text Editing Hook
  const {
    editingTextId,
    textAreaValue,
    textAreaRef,
    setTextAreaValue,
    handleTextDoubleClick,
    handleTextEditEnd,
    getTextEditPosition,
    startEditingNewText,
  } = useTextEditing({
    shapes,
    stageScale,
    stagePosition,
    updateShape,
    deleteShape,
  });

  // Shape Interaction Hook
  const {
    handleShapeDragStart,
    handleShapeDragMove,
    handleShapeDragEnd,
    handleShapeTransform,
    handleShapeTransformEnd,
  } = useShapeInteraction({
    stageRef,
    stagePosition,
    stageScale,
    currentUserId: currentUser?.uid,
    currentUserName: currentUser?.displayName || 'Unknown User',
    updateShape,
    selectedIds,
    shapes,
  });

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
   * Track mouse movements and update cursor position
   * NO THROTTLING - sends every update for insane speed like dragSync
   */
  const handleCursorTracking = useCallback(
    () => {
      const stage = stageRef.current;
      if (!stage || !currentUser) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // Convert screen coordinates to canvas-relative coordinates
      const canvasPos = screenToCanvas(
        pointer.x,
        pointer.y,
        stagePosition.x,
        stagePosition.y,
        stageScale
      );

      // Update cursor position in RTDB (no throttling - fire and forget)
      updateCursorPosition(currentUser.uid, canvasPos.x, canvasPos.y);
    },
    [currentUser, stagePosition, stageScale]
  );

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
   * Handle property updates from panel (only for single selection)
   */
  const handlePropertyUpdate = useCallback(
    (updates: ShapeUpdate, localOnly?: boolean) => {
      if (selectedIds.length === 1) {
        updateShape(selectedIds[0], updates, localOnly);
      }
    },
    [selectedIds, updateShape]
  );

  const handleToggleGrid = useCallback(() => {
    setShowGrid((prev) => !prev);
  }, []);

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

      // Delete selected shapes (only Delete key, not Backspace)
      if (e.key === 'Delete') {
        if (selectedIds.length > 0) {
          e.preventDefault();
          // Delete all selected shapes
          selectedIds.forEach(shapeId => {
            deleteShape(shapeId);
          });
        }
      }
      
      // Escape to deselect all
      if (e.key === 'Escape') {
        selectShape(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, deleteShape, selectShape]);

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

  // Show loading state while canvas initializes
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading canvas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full">
      {/* Layers Panel */}
      <LayersPanel
        shapes={shapes}
        selectedIds={selectedIds}
        onSelectShape={selectShape}
        onReorderShapes={reorderShapes}
        currentUserId={currentUser?.uid}
      />

      {/* Main Canvas Area */}
      <div
        ref={containerRef}
        className="flex-1 relative bg-gray-100 overflow-hidden min-w-0"
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
            handlePanStart(e);
            handleDrawStart(e);
          }}
          onMouseMove={() => {
            handlePanMove();
            handleDrawMove();
            handleCursorTracking();
          }}
          onMouseUp={() => {
            handlePanEnd();
            handleDrawEnd();
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
            {renderGrid({ showGrid })}

            {/* Render non-selected shapes first */}
            {shapes
              .filter(shape => !selectedIds.includes(shape.id))
              .map((shape) => (
                <Shape
                  key={shape.id}
                  shape={shape}
                  isSelected={false}
                  onSelect={(shiftKey) => selectShape(shape.id, shiftKey)}
                  onDragStart={() => handleShapeDragStart(shape.id)}
                  onDragMove={(x, y) => handleShapeDragMove(shape.id, x, y)}
                  onDragEnd={(x, y) => handleShapeDragEnd(shape.id, x, y)}
                  onTransformEnd={(updates) => handleShapeTransformEnd(shape.id, updates)}
                  onTransform={(x, y, rotation, width, height, radius, fontSize) => handleShapeTransform(shape.id, x, y, rotation, width, height, radius, fontSize)}
                  isDraggable={selectedTool === 'select'}
                  currentUserId={currentUser?.uid}
                  onDoubleClick={shape.type === 'text' ? () => handleTextDoubleClick(shape) : undefined}
                />
              ))}

            {/* Render selected shapes last (on top) with selection indicators */}
            {selectedIds.map(selectedId => {
              const shape = shapes.find(s => s.id === selectedId);
              if (!shape) return null;
              
              return (
                <Shape
                  key={selectedId}
                  shape={shape}
                  isSelected={true}
                  isMultiSelected={selectedIds.length > 1}
                  onSelect={(shiftKey) => selectShape(selectedId, shiftKey)}
                  onDragStart={() => handleShapeDragStart(selectedId)}
                  onDragMove={(x, y) => handleShapeDragMove(selectedId, x, y)}
                  onDragEnd={(x, y) => handleShapeDragEnd(selectedId, x, y)}
                  onTransformEnd={(updates) => handleShapeTransformEnd(selectedId, updates)}
                  onTransform={(x, y, rotation, width, height, radius, fontSize) => handleShapeTransform(selectedId, x, y, rotation, width, height, radius, fontSize)}
                  isDraggable={selectedTool === 'select'}
                  currentUserId={currentUser?.uid}
                  onDoubleClick={shape.type === 'text' ? () => handleTextDoubleClick(shape as TextShape) : undefined}
                />
              );
            })}

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

            {/* Line preview while drawing */}
            {isDrawing && newLinePreview && selectedTool === 'line' && (
              <Line
                points={[newLinePreview.x1, newLinePreview.y1, newLinePreview.x2, newLinePreview.y2]}
                stroke={DEFAULT_SHAPE_STROKE}
                strokeWidth={2}
                lineCap="round"
                dash={[5, 5]}
                opacity={0.7}
                listening={false}
              />
            )}

            {/* Multiplayer Cursors - isolated to prevent Canvas re-renders */}
            <CursorsLayer scale={stageScale} />
          </Layer>
        </Stage>

        {/* FPS Counter */}
        <FPSCounter />

        {/* Canvas info overlay */}
        <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 px-3 py-2 rounded-lg shadow-lg text-xs text-gray-600">
          <div className="font-semibold text-gray-700 mb-1">Canvas Info</div>
          <div>Tool: {selectedTool}</div>
          <div>Zoom: {(stageScale * 100).toFixed(0)}%</div>
          <div>Shapes: {shapes.length}</div>
          {selectedIds.length > 0 && (
            <div className="mt-1 text-blue-600 font-medium">
              Selected: {selectedIds.length}
            </div>
          )}
          <div className="mt-2 pt-2 border-t border-gray-200 text-gray-500">
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">Shift</kbd>
              <span>+ Click to Multi-Select</span>
            </div>
          </div>
        </div>
      </div>

      {/* Text Editing Overlay */}
      {editingTextId && getTextEditPosition() && (
        <textarea
          ref={textAreaRef}
          value={textAreaValue}
          onChange={(e) => setTextAreaValue(e.target.value)}
          onBlur={handleTextEditEnd}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              handleTextEditEnd();
            }
            // Don't close on Enter - allow multiline text
            e.stopPropagation();
          }}
          style={{
            position: 'absolute',
            left: `${getTextEditPosition()!.x}px`,
            top: `${getTextEditPosition()!.y}px`,
            fontSize: `${getTextEditPosition()!.shape.fontSize * stageScale}px`,
            fontFamily: getTextEditPosition()!.shape.fontFamily,
            color: getTextEditPosition()!.shape.fill,
            border: '2px solid #3b82f6',
            background: 'white',
            padding: '4px',
            resize: 'none',
            outline: 'none',
            minWidth: '100px',
            minHeight: `${getTextEditPosition()!.shape.fontSize * stageScale + 8}px`,
            lineHeight: '1.2',
            overflow: 'hidden',
            zIndex: 1000,
          }}
          autoFocus
        />
      )}

      {/* Properties Panel */}
      <PropertiesPanel
        selectedShape={selectedShape}
        selectedCount={selectedIds.length}
        onUpdate={handlePropertyUpdate}
        currentUserId={currentUser?.uid}
      />
    </div>
  );
}
