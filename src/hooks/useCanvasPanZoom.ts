/**
 * useCanvasPanZoom Hook
 * Manages canvas pan, zoom, and viewport positioning
 * Updated for endless canvas - no pan limits!
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type Konva from 'konva';
import {
  CANVAS_BOUNDS,
  MIN_ZOOM,
  MAX_ZOOM,
  DEFAULT_ZOOM,
} from '../utils/constants';

interface UseCanvasPanZoomProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  stageSize: { width: number; height: number };
}

export function useCanvasPanZoom({ stageRef, stageSize }: UseCanvasPanZoomProps) {
  const [stageScale, setStageScale] = useState(DEFAULT_ZOOM);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [isInitialPositionSet, setIsInitialPositionSet] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);
  
  // Track if user is actively zooming/panning (for performance optimization)
  const [isInteracting, setIsInteracting] = useState(false);
  const interactionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Mark interaction as active and set debounced timeout to mark as inactive
  const markInteracting = useCallback(() => {
    setIsInteracting(true);
    
    // Clear existing timeout
    if (interactionTimeoutRef.current) {
      clearTimeout(interactionTimeoutRef.current);
    }
    
    // Set new timeout - mark as not interacting after 150ms of inactivity
    interactionTimeoutRef.current = setTimeout(() => {
      setIsInteracting(false);
    }, 150);
  }, []);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current);
      }
    };
  }, []);
  
  // Helper to only update position if it actually changed (prevents infinite loops)
  const updateStagePosition = useCallback((newPos: { x: number; y: number }) => {
    setStagePosition(prev => {
      // Only update if position changed by more than 0.01 pixels
      if (Math.abs(prev.x - newPos.x) < 0.01 && Math.abs(prev.y - newPos.y) < 0.01) {
        return prev; // Return same object reference to prevent re-render
      }
      return newPos;
    });
  }, []);

  /**
   * ENDLESS CANVAS: No position constraints!
   * Allow infinite panning in all directions
   * Note: Shapes themselves are still clamped to 0 to 100k bounds
   */
  const constrainPosition = useCallback(
    (pos: { x: number; y: number }) => {
      // No constraints - allow infinite panning!
      return pos;
    },
    []
  );

  /**
   * Center canvas on initial load - now centers on origin (0, 0)
   */
  useEffect(() => {
    if (!isInitialPositionSet && stageSize.width > 0 && stageSize.height > 0) {
      // Center on canvas center point at default zoom
      const centerX = stageSize.width / 2 - (CANVAS_BOUNDS.CENTER_X) * DEFAULT_ZOOM;
      const centerY = stageSize.height / 2 - (CANVAS_BOUNDS.CENTER_Y) * DEFAULT_ZOOM;
      
      updateStagePosition({ x: centerX, y: centerY });
      setIsInitialPositionSet(true);
    }
  }, [stageSize, isInitialPositionSet, updateStagePosition]);

  /**
   * Handle zoom with mousewheel
   */
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      
      // Mark as interacting for performance optimization
      markInteracting();

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

      const constrainedPos = constrainPosition(newPos);

      setStageScale(newScale);
      updateStagePosition(constrainedPos);
    },
    [stageRef, constrainPosition, updateStagePosition, markInteracting]
  );

  /**
   * Handle panning with Ctrl+drag
   */
  const handlePanStart = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const isCtrlPressed = e.evt.ctrlKey || e.evt.metaKey;
      
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
        e.evt.preventDefault();
      }
    },
    [stageRef, stagePosition]
  );

  const handlePanMove = useCallback(() => {
    if (!isPanning || !panStart) return;
    
    // Mark as interacting for performance optimization
    markInteracting();
    
    const stage = stageRef.current;
    if (!stage) return;
    
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    
    const newPos = {
      x: pointer.x - panStart.x,
      y: pointer.y - panStart.y
    };
    
    const constrainedPos = constrainPosition(newPos);
    
    updateStagePosition(constrainedPos);
  }, [isPanning, panStart, stageRef, constrainPosition, updateStagePosition, markInteracting]);

  const handlePanEnd = useCallback(() => {
    setIsPanning(false);
    setPanStart(null);
  }, []);

  /**
   * Zoom controls
   */
  const handleZoomIn = useCallback(() => {
    markInteracting();
    
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

    const constrainedPos = constrainPosition(newPos);

    setStageScale(newScale);
    updateStagePosition(constrainedPos);
  }, [stageRef, stageSize, constrainPosition, updateStagePosition, markInteracting]);

  const handleZoomOut = useCallback(() => {
    markInteracting();
    
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

    const constrainedPos = constrainPosition(newPos);

    setStageScale(newScale);
    updateStagePosition(constrainedPos);
  }, [stageRef, stageSize, constrainPosition, updateStagePosition, markInteracting]);

  const handleResetView = useCallback(() => {
    markInteracting();
    
    setStageScale(DEFAULT_ZOOM);
    // Center on canvas center point
    const centerX = stageSize.width / 2 - (CANVAS_BOUNDS.CENTER_X) * DEFAULT_ZOOM;
    const centerY = stageSize.height / 2 - (CANVAS_BOUNDS.CENTER_Y) * DEFAULT_ZOOM;
    updateStagePosition({ x: centerX, y: centerY });
  }, [stageSize, updateStagePosition, markInteracting]);

  return {
    stageScale,
    stagePosition,
    setStageScale,
    setStagePosition: updateStagePosition,
    isPanning,
    isInteracting, // NEW: True during zoom/pan, false after 150ms of inactivity
    handleWheel,
    handlePanStart,
    handlePanMove,
    handlePanEnd,
    handleZoomIn,
    handleZoomOut,
    handleResetView,
  };
}

