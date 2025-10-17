/**
 * Canvas Component
 * Main canvas with pan, zoom, shape creation, and manipulation
 * Uses Konva for high-performance 2D rendering
 */

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Stage, Layer, Rect, Circle, Line } from 'react-konva';
import type Konva from 'konva';
import { useCanvasContext } from '../../contexts/CanvasContext';
import { useAuth } from '../../contexts/AuthContext';
import { usePresenceContext } from '../../contexts/PresenceContext';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  CANVAS_BOUNDS,
  DEFAULT_SHAPE_FILL,
  DEFAULT_SHAPE_STROKE,
  MAX_ZOOM,
} from '../../utils/constants';
import { updateCursorPosition } from '../../services/presence';
import { screenToCanvas, normalizeRectangle, rectanglesIntersect, circleIntersectsRect, lineIntersectsRect } from '../../utils/helpers';
import { renderGrid } from '../../utils/gridRenderer';
import { GridToggle } from './GridToggle';
import { ToolSelector } from './ToolSelector';
import { Shape } from './Shape';
import { PropertiesPanel } from './PropertiesPanel';
import { LayersPanel } from './LayersPanel';
import { CursorsLayer } from './CursorsLayer';
import { FPSCounter } from './FPSCounter';
import { AICanvasIntegration } from '../AI/AICanvasIntegration';
import { useCanvasPanZoom } from '../../hooks/useCanvasPanZoom';
import { useShapeDrawing } from '../../hooks/useShapeDrawing';
import { useTextEditing } from '../../hooks/useTextEditing';
import { useShapeInteraction } from '../../hooks/useShapeInteraction';
import { useViewportCulling } from '../../hooks/useViewportCulling';
import type { TextShape, ShapeUpdate, SelectionRect as SelectionRectType } from '../../types';

// ============================================================================
// Performance Configuration
// ============================================================================

/**
 * Cursor update throttle in milliseconds
 * - Set to 0 to use RAF (requestAnimationFrame) - automatically ~16.67ms on 60Hz displays
 * - Set to a number (e.g., 16, 32, 50) for custom throttle timing
 * 
 * Recommended values:
 * - 0 (RAF): Best for smooth 60fps updates on most displays
 * - 16: Same as RAF on 60Hz displays, explicit timing
 * - 32: ~30fps updates, good balance of smoothness and network efficiency
 * - 50: ~20fps updates, more network-friendly but less smooth
 */
const CURSOR_THROTTLE_MS = 0; // 0 = use RAF (~16ms on 60Hz)

interface CanvasProps {
  onSetNavigateToUser?: (fn: (userId: string) => void) => void;
}

export function Canvas({ onSetNavigateToUser }: CanvasProps = {}) {
  const stageRef = useRef<Konva.Stage | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // Calculate initial size based on viewport - full size since panels are absolute
  const [stageSize, setStageSize] = useState({ 
    width: Math.max(800, window.innerWidth), 
    height: Math.max(600, window.innerHeight) 
  });
  
  const [showGrid, setShowGrid] = useState(true);
  const [aiPanelMessage, setAIPanelMessage] = useState<string | undefined>();
  const [aiPanelOpen, setAIPanelOpen] = useState(false);
  
  // Box selection state
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionRect, setSelectionRect] = useState<SelectionRectType | null>(null);

  // Throttling for cursor position updates
  // Supports both RAF (requestAnimationFrame) and time-based throttling
  const cursorRafRef = useRef<number | null>(null);
  const cursorTimeoutRef = useRef<number | null>(null);
  const lastCursorUpdateRef = useRef<number>(0);
  const pendingCursorUpdateRef = useRef<{ x: number; y: number } | null>(null);

  const { shapes, selectedIds, selectShape, selectMultipleShapes, addShape, updateShape, deleteShape, deleteShapes, reorderShapes, duplicateShapes, loading, currentTool, setCurrentTool, clearLocalUpdates } = useCanvasContext();
  const { currentUser } = useAuth();
  const { onlineUsers } = usePresenceContext();
  
  // Use ref to track latest onlineUsers without causing callback recreations
  const onlineUsersRef = useRef(onlineUsers);
  useEffect(() => {
    onlineUsersRef.current = onlineUsers;
  }, [onlineUsers]);

  const selectedShapes = shapes.filter(s => selectedIds.includes(s.id));
  const selectedShape = selectedShapes.length === 1 ? selectedShapes[0] : null;

  // Pan/Zoom Hook
  const {
    stageScale,
    stagePosition,
    setStageScale,
    setStagePosition,
    isPanning,
    handleWheel,
    handlePanStart,
    handlePanMove,
    handlePanEnd,
    handleZoomIn,
    handleZoomOut,
    handleResetView,
  } = useCanvasPanZoom({ stageRef, stageSize });

  // Viewport Culling Hook - only render visible shapes for performance
  const { visibleShapes, cullingStats } = useViewportCulling({
    shapes,
    stagePosition,
    stageScale,
    stageSize,
    bufferMultiplier: 2, // Render 2x viewport in each direction (5x5 grid total)
  });

  // Memoize selected IDs Set for O(1) lookups instead of O(n) includes()
  const selectedIdsSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  
  // Memoize non-selected visible shapes for efficient rendering
  const nonSelectedVisibleShapes = useMemo(() => {
    return visibleShapes.filter(shape => !selectedIdsSet.has(shape.id));
  }, [visibleShapes, selectedIdsSet]);
  
  // Memoize selected shapes Map for O(1) lookups instead of O(n) find()
  const shapesMap = useMemo(() => {
    const map = new Map<string, typeof shapes[0]>();
    shapes.forEach(shape => map.set(shape.id, shape));
    return map;
  }, [shapes]);

  // Shape Drawing Hook
  const {
    isDrawing,
    newShapePreview,
    newLinePreview,
    handleDrawStart,
    handleDrawMove,
    handleDrawEnd,
    handleTextClick,
  } = useShapeDrawing({
    stageRef,
    stagePosition,
    stageScale,
    selectedTool: currentTool,
    setSelectedTool: setCurrentTool,
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
    selectedIds,
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
    clearLocalUpdates,
  });

  /**
   * Cleanup timers on unmount
   */
  useEffect(() => {
    return () => {
      if (cursorRafRef.current !== null) {
        cancelAnimationFrame(cursorRafRef.current);
      }
      if (cursorTimeoutRef.current !== null) {
        clearTimeout(cursorTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Handle window resize
   */
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        const height = containerRef.current.offsetHeight;
        setStageSize(prev => {
          // Only update if dimensions actually changed
          if (Math.abs(prev.width - width) < 0.5 && Math.abs(prev.height - height) < 0.5) {
            return prev; // Return same reference to prevent re-render
          }
          return { width, height };
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  /**
   * Track mouse movements and update cursor position
   * Supports both RAF throttling and time-based throttling based on CURSOR_THROTTLE_MS
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

      // Mode 1: RAF throttling (when CURSOR_THROTTLE_MS === 0)
      // Best for smooth 60fps updates aligned with display refresh
      if (CURSOR_THROTTLE_MS === 0) {
        // Cancel any pending RAF
        if (cursorRafRef.current !== null) {
          cancelAnimationFrame(cursorRafRef.current);
        }

        // Store pending cursor update
        pendingCursorUpdateRef.current = { x: canvasPos.x, y: canvasPos.y };

        // Schedule update on next animation frame (max 60fps = ~16.67ms on 60Hz displays)
        cursorRafRef.current = requestAnimationFrame(() => {
          const pending = pendingCursorUpdateRef.current;
          if (pending && currentUser) {
            // Fire-and-forget for maximum speed - don't await
            updateCursorPosition(currentUser.uid, pending.x, pending.y);
            pendingCursorUpdateRef.current = null;
          }
          cursorRafRef.current = null;
        });
      } 
      // Mode 2: Time-based throttling (when CURSOR_THROTTLE_MS > 0)
      // Allows precise control over update frequency
      else {
        const now = Date.now();
        const timeSinceLastUpdate = now - lastCursorUpdateRef.current;

        // Store the latest position
        pendingCursorUpdateRef.current = { x: canvasPos.x, y: canvasPos.y };

        // If enough time has passed, update immediately
        if (timeSinceLastUpdate >= CURSOR_THROTTLE_MS) {
          updateCursorPosition(currentUser.uid, canvasPos.x, canvasPos.y);
          lastCursorUpdateRef.current = now;
          pendingCursorUpdateRef.current = null;
          
          // Clear any pending timeout
          if (cursorTimeoutRef.current !== null) {
            clearTimeout(cursorTimeoutRef.current);
            cursorTimeoutRef.current = null;
          }
        } 
        // Otherwise, schedule an update if not already scheduled
        else if (cursorTimeoutRef.current === null) {
          const remainingTime = CURSOR_THROTTLE_MS - timeSinceLastUpdate;
          cursorTimeoutRef.current = window.setTimeout(() => {
            const pending = pendingCursorUpdateRef.current;
            if (pending && currentUser) {
              updateCursorPosition(currentUser.uid, pending.x, pending.y);
              lastCursorUpdateRef.current = Date.now();
              pendingCursorUpdateRef.current = null;
            }
            cursorTimeoutRef.current = null;
          }, remainingTime);
        }
      }
    },
    [currentUser, stagePosition, stageScale]
  );

  /**
   * Handle clicks on stage background to deselect and handle text creation
   * CRITICAL: Don't deselect if we just finished box selecting!
   */
  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Don't clear selection if we just finished a box selection
      // (isSelecting would have been true during the mouseup)
      const wasSelecting = selectionRect !== null;
      
      if (e.target === e.target.getStage() && !wasSelecting) {
        // If currently editing text, end editing
        if (editingTextId) {
          handleTextEditEnd();
        }
        
        // Handle text creation (if text tool is active)
        handleTextClick(e);
        
        // Deselect shapes (unless text tool is active - text creation handles selection)
        if (currentTool !== 'text') {
          selectShape(null);
        }
      }
    },
    [selectShape, selectionRect, editingTextId, handleTextEditEnd, handleTextClick, currentTool]
  );

  /**
   * Handle box selection start
   */
  const handleSelectionStart = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Only start box selection if:
      // 1. Select tool is active
      // 2. Not panning (Ctrl/Cmd not pressed)
      // 3. Clicking on stage background (not a shape)
      if (currentTool !== 'select' || e.evt.ctrlKey || e.evt.metaKey || e.target !== e.target.getStage()) {
        return;
      }

      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // Convert to canvas coordinates
      const canvasPos = screenToCanvas(
        pointer.x,
        pointer.y,
        stagePosition.x,
        stagePosition.y,
        stageScale
      );

      setIsSelecting(true);
      setSelectionStart(canvasPos);
      setSelectionRect(null);
    },
    [currentTool, stagePosition, stageScale]
  );

  /**
   * Handle box selection move
   */
  const handleSelectionMove = useCallback(() => {
    if (!isSelecting || !selectionStart) return;

    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // Convert to canvas coordinates
    const canvasPos = screenToCanvas(
      pointer.x,
      pointer.y,
      stagePosition.x,
      stagePosition.y,
      stageScale
    );

    // Create normalized rectangle
    const rect = normalizeRectangle(
      selectionStart.x,
      selectionStart.y,
      canvasPos.x,
      canvasPos.y
    );

    setSelectionRect(rect);
  }, [isSelecting, selectionStart, stagePosition, stageScale]);

  /**
   * Handle box selection end - find and select intersecting shapes
   * ⚡ ATOMIC: Selects all shapes at once to prevent race conditions
   * NOTE: Box selection checks all shapes, not just visible ones
   */
  const handleSelectionEnd = useCallback(async () => {
    if (!isSelecting || !selectionRect || !currentUser) {
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionRect(null);
      return;
    }

    // Find all shapes that intersect with the selection rectangle
    // Use ALL shapes (not just visible ones) for selection
    const intersectingShapes = shapes.filter((shape) => {
      // Skip locked shapes by other users (selectMultipleShapes will also filter)
      if (shape.isLocked && shape.lockedBy && shape.lockedBy !== currentUser.uid) {
        return false;
      }

      if (shape.type === 'rectangle' || shape.type === 'text') {
        // For rectangles and text, check bounding box intersection
        const shapeRect = {
          x: shape.x,
          y: shape.y,
          width: shape.width || 100,
          height: shape.type === 'rectangle' ? shape.height : (shape.fontSize || 16),
        };
        return rectanglesIntersect(selectionRect, shapeRect);
      } else if (shape.type === 'circle') {
        // For circles, check circle-rectangle intersection
        const circle = {
          x: shape.x,
          y: shape.y,
          radius: shape.radius,
        };
        return circleIntersectsRect(circle, selectionRect);
      } else if (shape.type === 'line') {
        // For lines, check line-rectangle intersection
        const line = {
          x1: shape.x1,
          y1: shape.y1,
          x2: shape.x2,
          y2: shape.y2,
        };
        return lineIntersectsRect(line, selectionRect);
      }
      return false;
    });

    // Get IDs of intersecting shapes
    const intersectingIds = intersectingShapes.map((s) => s.id);

    // Check if Shift is pressed for additive selection
    const shiftPressed = window.event && (window.event as KeyboardEvent).shiftKey;

    if (intersectingIds.length > 0) {
      // ⚡ ATOMIC: Select all at once
      await selectMultipleShapes(intersectingIds, shiftPressed);
    } else if (!shiftPressed) {
      selectShape(null);
    }

    // Clear selection rectangle
    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionRect(null);
  }, [isSelecting, selectionRect, shapes, currentUser, selectShape, selectMultipleShapes]);

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
   * Navigate to a shape - zoom and pan to center it in viewport
   */
  const handleNavigateToShape = useCallback((shapeId: string) => {
    const shape = shapes.find(s => s.id === shapeId);
    if (!shape || !stageRef.current) return;

    // Calculate shape center and bounds
    let shapeX = 0, shapeY = 0, shapeWidth = 0, shapeHeight = 0;

    if (shape.type === 'rectangle' || shape.type === 'text') {
      shapeX = shape.x;
      shapeY = shape.y;
      shapeWidth = shape.width || 100;
      shapeHeight = shape.type === 'rectangle' ? (shape.height || 100) : (shape.fontSize || 16);
    } else if (shape.type === 'circle') {
      shapeX = shape.x - shape.radius;
      shapeY = shape.y - shape.radius;
      shapeWidth = shape.radius * 2;
      shapeHeight = shape.radius * 2;
    } else if (shape.type === 'line') {
      shapeX = Math.min(shape.x1, shape.x2);
      shapeY = Math.min(shape.y1, shape.y2);
      shapeWidth = Math.abs(shape.x2 - shape.x1);
      shapeHeight = Math.abs(shape.y2 - shape.y1);
    }

    // Calculate zoom to fit shape with 20% padding
    const paddingFactor = 1.4; // 20% padding on each side = 1.4x total
    const scaleX = stageSize.width / (shapeWidth * paddingFactor);
    const scaleY = stageSize.height / (shapeHeight * paddingFactor);
    const newScale = Math.min(scaleX, scaleY, MAX_ZOOM); // Don't exceed max zoom

    // Calculate center of shape
    const shapeCenterX = shapeX + shapeWidth / 2;
    const shapeCenterY = shapeY + shapeHeight / 2;

    // Calculate new stage position to center the shape
    const newX = stageSize.width / 2 - shapeCenterX * newScale;
    const newY = stageSize.height / 2 - shapeCenterY * newScale;

    // Set position and zoom immediately
    setStageScale(newScale);
    setStagePosition({ x: newX, y: newY });

    // Select the shape
    selectShape(shapeId);
  }, [shapes, stageSize, selectShape, setStageScale, setStagePosition]);

  /**
   * Navigate to a user - pan to their cursor position
   * Exposed via props for Navbar to use
   */
  const handleNavigateToUser = useCallback((userId: string) => {
    // Use ref to get latest users without causing callback recreations
    const user = onlineUsersRef.current.find(u => u.uid === userId);
    if (!user || !stageRef.current) return;

    // User cursor is in canvas coordinates
    const userX = user.cursorX;
    const userY = user.cursorY;

    // Calculate new stage position to center the user's cursor
    const newX = stageSize.width / 2 - userX * stageScale;
    const newY = stageSize.height / 2 - userY * stageScale;

    // Pan to user's cursor position
    setStagePosition({ x: newX, y: newY });
  }, [stageSize, stageScale, setStagePosition]);

  /**
   * Expose navigation function to parent via callback
   */
  useEffect(() => {
    if (onSetNavigateToUser) {
      onSetNavigateToUser(handleNavigateToUser);
    }
  }, [handleNavigateToUser, onSetNavigateToUser]);

  /**
   * Keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Tool shortcuts
      if (e.key === 'v' || e.key === 'V') {
        setCurrentTool('select');
        return;
      }
      if (e.key === 'r' || e.key === 'R') {
        setCurrentTool('rectangle');
        return;
      }
      if (e.key === 'c' || e.key === 'C') {
        setCurrentTool('circle');
        return;
      }
      if (e.key === 't' || e.key === 'T') {
        setCurrentTool('text');
        return;
      }
      if (e.key === 'l' || e.key === 'L') {
        setCurrentTool('line');
        return;
      }

      // Delete selected shapes (only Delete key, not Backspace)
      if (e.key === 'Delete') {
        if (selectedIds.length > 0) {
          e.preventDefault();
          // ⚡ BATCH DELETE - all shapes delete at once!
          deleteShapes(selectedIds).catch(error => {
            console.error('Failed to delete shapes:', error);
          });
        }
      }
      
      // Duplicate selected shapes (Ctrl+Shift+D / Cmd+Shift+D)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        if (selectedIds.length > 0 && !e.repeat) {
          e.preventDefault();
          // Duplicate all selected shapes
          duplicateShapes(selectedIds).catch(error => {
            console.error('Failed to duplicate shapes:', error);
          });
        }
      }
      
      // Escape to deselect all
      if (e.key === 'Escape') {
        selectShape(null);
      }

      // Zoom shortcuts
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
        return;
      }
      if (e.key === '-') {
        e.preventDefault();
        handleZoomOut();
        return;
      }
      
      // Reset view (Ctrl/Cmd + 0)
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        handleResetView();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, deleteShapes, selectShape, duplicateShapes, setCurrentTool, handleZoomIn, handleZoomOut, handleResetView]);

  const getCursorStyle = useCallback(() => {
    if (isPanning) return 'grabbing';
    if (isDrawing) return 'crosshair';
    if (isSelecting) return 'crosshair';
    if (currentTool === 'rectangle' || currentTool === 'circle' || currentTool === 'text' || currentTool === 'line') return 'crosshair';
    return 'default';
  }, [isPanning, isDrawing, isSelecting, currentTool]);

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
    <div className="relative h-full w-full">
      {/* AI Integration */}
      <AICanvasIntegration 
        initialMessage={aiPanelMessage} 
        forceOpen={aiPanelOpen}
        onOpenPanel={() => setAIPanelOpen(false)}
      />
      
      {/* Layers Panel - Absolute positioned, full height */}
      <div className="absolute left-0 top-0 h-full z-20">
        <LayersPanel
          shapes={shapes}
          selectedIds={selectedIds}
          onSelectShape={selectShape}
          onReorderShapes={reorderShapes}
          currentUserId={currentUser?.uid}
          cullingStats={cullingStats}
          onNavigateToShape={handleNavigateToShape}
        />
      </div>

      {/* Main Canvas Area - Full width and height */}
      <div
        ref={containerRef}
        className="w-full h-full relative bg-gray-100 overflow-hidden"
      >
        {/* Text Editing Overlay - positioned within canvas container */}
        {editingTextId && getTextEditPosition() && (
          <textarea
            ref={textAreaRef}
            value={textAreaValue}
            onChange={(e) => {
              const newValue = e.target.value;
              setTextAreaValue(newValue);
              // Update canvas text in real-time (local only, no Firebase)
              if (editingTextId) {
                updateShape(editingTextId, { text: newValue }, true);
              }
              // Auto-resize textarea height to fit content
              if (textAreaRef.current) {
                textAreaRef.current.style.height = 'auto';
                textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
              }
            }}
            onBlur={handleTextEditEnd}
            onClick={(e) => {
              // Prevent clicks on textarea from propagating to canvas
              e.stopPropagation();
            }}
            onMouseDown={(e) => {
              // Prevent mouse down events from propagating to canvas
              e.stopPropagation();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault(); // Prevent new line
                handleTextEditEnd(); // Submit on Enter
              } else if (e.key === 'Escape') {
                handleTextEditEnd();
              }
              e.stopPropagation();
            }}
            style={{
              position: 'absolute',
              left: `${getTextEditPosition()!.x}px`,
              top: `${getTextEditPosition()!.y}px`,
              width: `${getTextEditPosition()!.width}px`,
              height: 'auto',
              fontSize: `${getTextEditPosition()!.shape.fontSize * stageScale}px`,
              fontFamily: getTextEditPosition()!.shape.fontFamily,
              fontStyle: getTextEditPosition()!.shape.fontStyle || 'normal',
              textDecoration: getTextEditPosition()!.shape.textDecoration || 'none',
              color: 'transparent',
              border: 'none',
              background: 'transparent',
              padding: '0',
              margin: '0',
              resize: 'none',
              outline: 'none',
              boxShadow: 'none',
              lineHeight: '1',
              textAlign: 'left',
              verticalAlign: 'top',
              overflow: 'hidden',
              overflowY: 'hidden',
              zIndex: 1000,
              boxSizing: 'border-box',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              caretColor: getTextEditPosition()!.shape.fill,
            }}
            autoFocus
            onInput={(e) => {
              // Auto-resize on input as well
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${target.scrollHeight}px`;
            }}
          />
        )}

        {/* Grid Toggle */}
        <GridToggle showGrid={showGrid} onToggle={handleToggleGrid} />


        {/* Tool Selector - Moved to bottom */}
        <ToolSelector 
          selectedTool={currentTool} 
          onToolChange={setCurrentTool}
          onOpenAIPanel={() => {
            setAIPanelMessage(undefined);
            setAIPanelOpen(true);
          }}
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
            handleSelectionStart(e);
          }}
          onMouseMove={() => {
            handlePanMove();
            handleDrawMove();
            handleSelectionMove();
            handleCursorTracking();
          }}
          onMouseUp={() => {
            handlePanEnd();
            handleDrawEnd();
            handleSelectionEnd();
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
            {/* Canvas background - full 100k x 100k canvas (0 to 100,000) */}
            <Rect
              x={CANVAS_BOUNDS.MIN_X}
              y={CANVAS_BOUNDS.MIN_Y}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              fill="white"
              shadowColor="rgba(0, 0, 0, 0.1)"
              shadowBlur={20}
              shadowOffset={{ x: 0, y: 0 }}
              listening={false}
            />

            {/* Grid lines - viewport-based rendering */}
            {renderGrid({ 
              showGrid,
              viewport: {
                minX: -stagePosition.x / stageScale,
                maxX: (-stagePosition.x + stageSize.width) / stageScale,
                minY: -stagePosition.y / stageScale,
                maxY: (-stagePosition.y + stageSize.height) / stageScale,
              }
            })}

            {/* Render non-selected shapes first - using viewport culling */}
            {nonSelectedVisibleShapes.map((shape) => (
              <Shape
                key={shape.id}
                shape={shape}
                isSelected={false}
                onSelect={(shiftKey) => selectShape(shape.id, shiftKey)}
                onDragStart={() => handleShapeDragStart(shape.id)}
                onDragMove={(x, y) => handleShapeDragMove(shape.id, x, y)}
                onDragEnd={(x, y) => handleShapeDragEnd(shape.id, x, y)}
                onTransformEnd={(updates) => handleShapeTransformEnd(shape.id, updates)}
                onTransform={(x, y, rotation, width, height, radius, fontSize, x1, y1, x2, y2) => handleShapeTransform(shape.id, x, y, rotation, width, height, radius, fontSize, x1, y1, x2, y2)}
                isDraggable={currentTool === 'select'}
                currentUserId={currentUser?.uid}
                onDoubleClick={shape.type === 'text' ? () => handleTextDoubleClick(shape) : undefined}
              />
            ))}

            {/* Render selected shapes last (on top) - always render even if off-screen */}
            {selectedIds.map(selectedId => {
              const shape = shapesMap.get(selectedId);
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
                  onTransform={(x, y, rotation, width, height, radius, fontSize, x1, y1, x2, y2) => handleShapeTransform(selectedId, x, y, rotation, width, height, radius, fontSize, x1, y1, x2, y2)}
                  isDraggable={currentTool === 'select'}
                  currentUserId={currentUser?.uid}
                  onDoubleClick={shape.type === 'text' ? () => handleTextDoubleClick(shape as TextShape) : undefined}
                />
              );
            })}

            {/* Shape preview while drawing */}
            {isDrawing && newShapePreview && newShapePreview.width > 0 && newShapePreview.height > 0 && (
              <>
                {currentTool === 'rectangle' && (
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
                {currentTool === 'circle' && (
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
            {isDrawing && newLinePreview && currentTool === 'line' && (
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

            {/* Selection rectangle while box selecting */}
            {isSelecting && selectionRect && (
              <Rect
                x={selectionRect.x}
                y={selectionRect.y}
                width={selectionRect.width}
                height={selectionRect.height}
                fill="rgba(59, 130, 246, 0.1)"
                stroke="#3b82f6"
                strokeWidth={2 / stageScale}
                dash={[10 / stageScale, 5 / stageScale]}
                listening={false}
              />
            )}

            {/* Multiplayer Cursors - isolated to prevent Canvas re-renders */}
            <CursorsLayer scale={stageScale} />
          </Layer>
        </Stage>

        {/* FPS Counter */}
        <FPSCounter />


      {/* Properties Panel - Absolute positioned, full height */}
      <div className="absolute right-0 top-0 h-full z-20">
           <PropertiesPanel
             selectedShape={selectedShape}
             selectedCount={selectedIds.length}
             onUpdate={handlePropertyUpdate}
             currentUserId={currentUser?.uid}
           />
      </div>
      </div>
    </div>
  );
}
