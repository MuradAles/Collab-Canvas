/**
 * Cursor Tracking Hook
 * Handles real-time cursor position updates with throttling
 */

import { useRef, useEffect, useCallback } from 'react';
import type Konva from 'konva';
import { screenToCanvas } from '../utils/helpers';
import { updateCursorPosition } from '../services/presence';

interface UseCursorTrackingProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  currentUser: { uid: string } | null;
  stagePosition: { x: number; y: number };
  stageScale: number;
  throttleMs?: number; // 0 = use RAF, >0 = time-based throttle
}

export function useCursorTracking({
  stageRef,
  currentUser,
  stagePosition,
  stageScale,
  throttleMs = 0,
}: UseCursorTrackingProps) {
  // Throttling refs
  const cursorRafRef = useRef<number | null>(null);
  const cursorTimeoutRef = useRef<number | null>(null);
  const lastCursorUpdateRef = useRef<number>(0);
  const pendingCursorUpdateRef = useRef<{ x: number; y: number } | null>(null);

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
   * Track mouse movements and update cursor position
   * Supports both RAF throttling and time-based throttling
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

      // Mode 1: RAF throttling (when throttleMs === 0)
      // Best for smooth 60fps updates aligned with display refresh
      if (throttleMs === 0) {
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
      // Mode 2: Time-based throttling (when throttleMs > 0)
      // Allows precise control over update frequency
      else {
        const now = Date.now();
        const timeSinceLastUpdate = now - lastCursorUpdateRef.current;

        // Store the latest position
        pendingCursorUpdateRef.current = { x: canvasPos.x, y: canvasPos.y };

        // If enough time has passed, update immediately
        if (timeSinceLastUpdate >= throttleMs) {
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
          const remainingTime = throttleMs - timeSinceLastUpdate;
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
    [currentUser, stagePosition, stageScale, throttleMs, stageRef]
  );

  return { handleCursorTracking };
}

