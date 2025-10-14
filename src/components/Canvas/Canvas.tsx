/**
 * Canvas Component
 * Main canvas with pan, zoom, shape creation, and manipulation
 * Uses Konva for high-performance 2D rendering
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Line, Rect, Circle } from 'react-konva';
import type Konva from 'konva';
import { useCanvasContext } from '../../contexts/CanvasContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  MIN_ZOOM,
  MAX_ZOOM,
  DEFAULT_ZOOM,
  DEFAULT_SHAPE_FILL,
  DEFAULT_SHAPE_STROKE,
  DEFAULT_SHAPE_STROKE_WIDTH,
  DEFAULT_CORNER_RADIUS,
  MIN_SHAPE_SIZE,
  DEFAULT_TEXT_SIZE,
  DEFAULT_TEXT_FONT,
  DEFAULT_TEXT_FILL,
} from '../../utils/constants';
import { screenToCanvas, normalizeRectangle } from '../../utils/helpers';
import { updateDragPosition, clearDragPosition } from '../../services/dragSync';
import { updateCursorPosition } from '../../services/presence';
import { CanvasControls } from './CanvasControls';
import { GridToggle } from './GridToggle';
import { ToolSelector, type Tool } from './ToolSelector';
import { Shape } from './Shape';
import { PropertiesPanel } from './PropertiesPanel';
import { LayersPanel } from './LayersPanel';
import { Cursor } from '../Collaboration/Cursor';
import { Tutorial } from './Tutorial';
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
  
  // Calculate initial size based on viewport - leaving room for panels and navbar
  // LayersPanel: 240px (w-60), PropertiesPanel: 256px (w-64), Navbar: 64px
  const [stageSize, setStageSize] = useState({ 
    width: Math.max(800, window.innerWidth - 240 - 256), 
    height: Math.max(600, window.innerHeight - 64) 
  });
  const [stageScale, setStageScale] = useState(DEFAULT_ZOOM);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [isInitialPositionSet, setIsInitialPositionSet] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [selectedTool, setSelectedTool] = useState<Tool>('select');
  
  // Shape creation state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [newShapePreview, setNewShapePreview] = useState<NewShapePreview | null>(null);
  
  // Text editing state
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [textAreaValue, setTextAreaValue] = useState('');
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  const { shapes, selectedId, selectShape, addShape, updateShape, deleteShape, reorderShapes, loading, onlineUsers } = useCanvasContext();
  const { currentUser } = useAuth();

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
   * Center canvas on initial load
   */
  useEffect(() => {
    if (!isInitialPositionSet && stageSize.width > 0 && stageSize.height > 0) {
      // Center the canvas so the middle of the 10000x5000 canvas is at the center of the viewport
      const centerX = stageSize.width / 2 - (CANVAS_WIDTH / 2) * stageScale;
      const centerY = stageSize.height / 2 - (CANVAS_HEIGHT / 2) * stageScale;
      
      setStagePosition({ x: centerX, y: centerY });
      setIsInitialPositionSet(true);
    }
  }, [stageSize, stageScale, isInitialPositionSet]);

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
          // Create text immediately at click position with default "Text" content
          const textShape: Omit<TextShape, 'id' | 'name' | 'isLocked' | 'lockedBy' | 'lockedByName'> = {
            type: 'text',
            x: canvasPos.x,
            y: canvasPos.y,
            rotation: 0,
            text: 'Text',
            fontSize: DEFAULT_TEXT_SIZE,
            fontFamily: DEFAULT_TEXT_FONT,
            fill: DEFAULT_TEXT_FILL,
          };
          
          // Add shape and enable editing immediately
          addShape(textShape).then(() => {
            // Small delay to ensure shape is added to context
            setTimeout(() => {
              // Access shapes from context after it updates
              const allShapes = shapes;
              const newShape = allShapes[allShapes.length];
              if (newShape) {
                setEditingTextId(newShape.id);
                setTextAreaValue('Text');
                // Focus the textarea and select all text for easy replacement
                requestAnimationFrame(() => {
                  textAreaRef.current?.focus();
                  textAreaRef.current?.select();
                });
              }
            }, 50);
          });
          
          setSelectedTool('select'); // Switch back to select tool
        }
      }
    },
    [stagePosition, stageScale, selectedTool, addShape, shapes]
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
          rotation: 0,
          fill: DEFAULT_SHAPE_FILL,
          stroke: DEFAULT_SHAPE_STROKE,
          strokeWidth: DEFAULT_SHAPE_STROKE_WIDTH,
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
          rotation: 0,
          fill: DEFAULT_SHAPE_FILL,
          stroke: DEFAULT_SHAPE_STROKE,
          strokeWidth: DEFAULT_SHAPE_STROKE_WIDTH,
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
   * Handle shape drag start - mark shape as being dragged
   * Also update cursor position at drag start
   */
  const handleShapeDragStart = useCallback(
    async (shapeId: string) => {
      if (!currentUser) return;
      
      try {
        // Mark shape as being dragged by current user
        await updateShape(shapeId, {
          isDragging: true,
          draggingBy: currentUser.uid,
          draggingByName: currentUser.displayName || 'Unknown User',
        });

        // Update cursor position at drag start
        const stage = stageRef.current;
        if (stage) {
          const pointer = stage.getPointerPosition();
          if (pointer) {
            const canvasPos = screenToCanvas(
              pointer.x,
              pointer.y,
              stagePosition.x,
              stagePosition.y,
              stageScale
            );
            updateCursorPosition(currentUser.uid, canvasPos.x, canvasPos.y);
          }
        }
      } catch (error) {
        console.error('Failed to mark shape as dragging:', error);
      }
    },
    [currentUser, updateShape, stagePosition, stageScale]
  );

  /**
   * Handle shape drag move - update position in real-time using RTDB
   * No throttling for sub-100ms latency
   * ALSO update cursor position during drag for smooth tracking
   */
  const handleShapeDragMove = useCallback(
    (shapeId: string, x: number, y: number) => {
      if (!currentUser) return;
      
      // Update shape position in RTDB
      updateDragPosition(
        'global-canvas-v1',
        shapeId,
        x,
        y,
        currentUser.uid,
        currentUser.displayName || 'Unknown User'
      ).catch(console.error);

      // ALSO update cursor position during drag
      // Get current mouse position from stage
      const stage = stageRef.current;
      if (stage) {
        const pointer = stage.getPointerPosition();
        if (pointer) {
          const canvasPos = screenToCanvas(
            pointer.x,
            pointer.y,
            stagePosition.x,
            stagePosition.y,
            stageScale
          );
          updateCursorPosition(currentUser.uid, canvasPos.x, canvasPos.y);
        }
      }
    },
    [currentUser, stagePosition, stageScale]
  );

  /**
   * Handle shape drag end - save final position to Firestore and clear RTDB
   * Also update cursor position at drag end
   */
  const handleShapeDragEnd = useCallback(
    async (shapeId: string, x: number, y: number) => {
      if (!currentUser) return;

      try {
        // Save final position to Firestore FIRST (prevents visual jump)
        await updateShape(shapeId, {
          x,
          y,
          isDragging: false,
          draggingBy: null,
          draggingByName: null,
        });
        
        // Then clear real-time drag position from RTDB
        await clearDragPosition('global-canvas-v1', shapeId);

        // Update cursor position at drag end
        const stage = stageRef.current;
        if (stage) {
          const pointer = stage.getPointerPosition();
          if (pointer) {
            const canvasPos = screenToCanvas(
              pointer.x,
              pointer.y,
              stagePosition.x,
              stagePosition.y,
              stageScale
            );
            updateCursorPosition(currentUser.uid, canvasPos.x, canvasPos.y);
          }
        }
      } catch (error) {
        console.error('Failed to update shape:', error);
      }
    },
    [currentUser, updateShape, stagePosition, stageScale]
  );

  /**
   * Handle shape transform end (resize/rotation)
   * Also update cursor position after transform and clear RTDB state
   */
  const handleShapeTransformEnd = useCallback(
    async (shapeId: string, updates: { x?: number; y?: number; width?: number; height?: number; radius?: number; fontSize?: number; rotation?: number }) => {
      if (!currentUser) return;

      try {
        // Save final state to Firestore
        await updateShape(shapeId, updates);
        
        // Clear real-time drag/rotation position from RTDB
        await clearDragPosition('global-canvas-v1', shapeId);

        // Update cursor position after transform
        const stage = stageRef.current;
        if (stage) {
          const pointer = stage.getPointerPosition();
          if (pointer) {
            const canvasPos = screenToCanvas(
              pointer.x,
              pointer.y,
              stagePosition.x,
              stagePosition.y,
              stageScale
            );
            updateCursorPosition(currentUser.uid, canvasPos.x, canvasPos.y);
          }
        }
      } catch (error) {
        console.error('Failed to update shape:', error);
      }
    },
    [updateShape, currentUser, stagePosition, stageScale]
  );

  /**
   * Handle shape rotation - update rotation in real-time using RTDB
   * Also update cursor position during rotation
   */
  const handleShapeRotation = useCallback(
    (shapeId: string, x: number, y: number, rotation: number) => {
      if (!currentUser) return;
      
      // Update shape position and rotation in RTDB
      updateDragPosition(
        'global-canvas-v1',
        shapeId,
        x,
        y,
        currentUser.uid,
        currentUser.displayName || 'Unknown User',
        rotation
      ).catch(console.error);

      // ALSO update cursor position during rotation
      // Get current mouse position from stage
      const stage = stageRef.current;
      if (stage) {
        const pointer = stage.getPointerPosition();
        if (pointer) {
          const canvasPos = screenToCanvas(
            pointer.x,
            pointer.y,
            stagePosition.x,
            stagePosition.y,
            stageScale
          );
          updateCursorPosition(currentUser.uid, canvasPos.x, canvasPos.y);
        }
      }
    },
    [currentUser, stagePosition, stageScale]
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

      // Delete selected shape (only Delete key, not Backspace)
      if (e.key === 'Delete') {
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

  /**
   * Start editing text shape
   */
  const handleTextDoubleClick = useCallback((textShape: TextShape) => {
    setEditingTextId(textShape.id);
    setTextAreaValue(textShape.text);
    setTimeout(() => textAreaRef.current?.focus(), 0);
  }, []);

  /**
   * Finish editing text and update shape
   */
  const handleTextEditEnd = useCallback(() => {
    if (editingTextId) {
      const trimmedText = textAreaValue.trim();
      if (trimmedText) {
        updateShape(editingTextId, { text: trimmedText });
      } else {
        // If text is empty, delete the shape
        deleteShape(editingTextId);
      }
      setEditingTextId(null);
      setTextAreaValue('');
    }
  }, [editingTextId, textAreaValue, updateShape, deleteShape]);

  /**
   * Auto-focus textarea when editing starts
   */
  useEffect(() => {
    if (editingTextId && textAreaRef.current) {
      textAreaRef.current.focus();
      textAreaRef.current.select();
    }
  }, [editingTextId]);

  /**
   * Get screen position for text editing overlay
   */
  const getTextEditPosition = useCallback(() => {
    if (!editingTextId) return null;
    
    const textShape = shapes.find(s => s.id === editingTextId);
    if (!textShape || textShape.type !== 'text') return null;
    
    // Convert canvas coordinates to screen coordinates relative to container
    const x = textShape.x * stageScale + stagePosition.x;
    const y = textShape.y * stageScale + stagePosition.y;
    
    return { x, y, shape: textShape };
  }, [editingTextId, shapes, stageScale, stagePosition]);

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
        selectedId={selectedId}
        onSelectShape={selectShape}
        onReorderShapes={reorderShapes}
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
            handleStageMouseDown(e);
            handleMouseDown(e);
          }}
          onMouseMove={() => {
            handleStageMouseMove();
            handleMouseMove();
            handleCursorTracking();
          }}
          onMouseUp={() => {
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

            {/* Render non-selected shapes first */}
            {shapes
              .filter(shape => shape.id !== selectedId)
              .map((shape) => (
                <Shape
                  key={shape.id}
                  shape={shape}
                  isSelected={false}
                  onSelect={() => selectShape(shape.id)}
                  onDragStart={() => handleShapeDragStart(shape.id)}
                  onDragMove={(x, y) => handleShapeDragMove(shape.id, x, y)}
                  onDragEnd={(x, y) => handleShapeDragEnd(shape.id, x, y)}
                  onTransformEnd={(updates) => handleShapeTransformEnd(shape.id, updates)}
                  onRotation={(x, y, rotation) => handleShapeRotation(shape.id, x, y, rotation)}
                  isDraggable={selectedTool === 'select'}
                  currentUserId={currentUser?.uid}
                  onDoubleClick={shape.type === 'text' ? () => handleTextDoubleClick(shape) : undefined}
                />
              ))}

            {/* Render selected shape last (on top) */}
            {selectedId && shapes.find(s => s.id === selectedId) && (
              <Shape
                key={selectedId}
                shape={shapes.find(s => s.id === selectedId)!}
                isSelected={true}
                onSelect={() => selectShape(selectedId)}
                onDragStart={() => handleShapeDragStart(selectedId)}
                onDragMove={(x, y) => handleShapeDragMove(selectedId, x, y)}
                onDragEnd={(x, y) => handleShapeDragEnd(selectedId, x, y)}
                onTransformEnd={(updates) => handleShapeTransformEnd(selectedId, updates)}
                onRotation={(x, y, rotation) => handleShapeRotation(selectedId, x, y, rotation)}
                isDraggable={selectedTool === 'select'}
                currentUserId={currentUser?.uid}
                onDoubleClick={shapes.find(s => s.id === selectedId)?.type === 'text' ? () => handleTextDoubleClick(shapes.find(s => s.id === selectedId) as TextShape) : undefined}
              />
            )}

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

            {/* Multiplayer Cursors - rendered within canvas */}
            {onlineUsers
              .filter((user) => user.uid !== currentUser?.uid && user.isOnline)
              .map((user) => (
                <Cursor
                  key={user.uid}
                  user={user}
                  scale={stageScale}
                />
              ))}
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
        onUpdate={handlePropertyUpdate}
      />

      {/* Tutorial Button */}
      <Tutorial />
    </div>
  );
}
