/**
 * useCanvasPanZoom Hook
 * Manages canvas pan, zoom, and viewport positioning
 */

import { useState, useEffect, useCallback } from 'react';
import type Konva from 'konva';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
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
   * Center canvas on initial load
   */
  useEffect(() => {
    if (!isInitialPositionSet && stageSize.width > 0 && stageSize.height > 0) {
      const centerX = stageSize.width / 2 - (CANVAS_WIDTH / 2) * stageScale;
      const centerY = stageSize.height / 2 - (CANVAS_HEIGHT / 2) * stageScale;
      
      setStagePosition({ x: centerX, y: centerY });
      setIsInitialPositionSet(true);
    }
  }, [stageSize, stageScale, isInitialPositionSet]);

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
    [stageRef, stageSize, constrainPosition]
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
  }, [isPanning, panStart, stageRef, stageScale, stageSize, constrainPosition]);

  const handlePanEnd = useCallback(() => {
    setIsPanning(false);
    setPanStart(null);
  }, []);

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
  }, [stageRef, stageSize, constrainPosition]);

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
  }, [stageRef, stageSize, constrainPosition]);

  const handleResetView = useCallback(() => {
    setStageScale(DEFAULT_ZOOM);
    // Center the canvas in the viewport
    const centerX = (stageSize.width - CANVAS_WIDTH * DEFAULT_ZOOM) / 2;
    const centerY = (stageSize.height - CANVAS_HEIGHT * DEFAULT_ZOOM) / 2;
    setStagePosition({ x: centerX, y: centerY });
  }, [stageSize]);

  return {
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
  };
}

