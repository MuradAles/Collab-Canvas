/**
 * Canvas Initialization Hook
 * Handles Firestore subscriptions, real-time sync, and cleanup
 */

import { useEffect, useRef, useState } from 'react';
import type { Shape, User } from '../../types';
import type { DragPosition, SelectionDrag } from '../../services/dragSync';
import {
  initializeCanvas,
  subscribeToShapes,
  cleanupUserLocks,
} from '../../services/canvas';
import {
  subscribeToDragPositions,
  subscribeToSelectionDrags,
} from '../../services/dragSync';

export function useCanvasInitialization(
  currentUser: User | null,
  setShapes: React.Dispatch<React.SetStateAction<Shape[]>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setDragPositions: React.Dispatch<React.SetStateAction<Map<string, DragPosition>>>,
  setSelectionDrags: React.Dispatch<React.SetStateAction<Map<string, SelectionDrag>>>,
  setLocalUpdates: React.Dispatch<React.SetStateAction<Map<string, Partial<Shape>>>>,
  shapeCounterRef: React.MutableRefObject<{ [key: string]: number }>,
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting',
  setConnectionStatus: React.Dispatch<React.SetStateAction<'connected' | 'disconnected' | 'reconnecting'>>,
  setIsReconnecting: React.Dispatch<React.SetStateAction<boolean>>
) {
  // RAF throttling for incoming drag updates to prevent FPS drops
  const dragUpdateRafRef = useRef<number | null>(null);
  const pendingDragPositionsRef = useRef<Map<string, DragPosition> | null>(null);
  
  // Store current user ID in a ref for cleanup (persists even after currentUser becomes null)
  const currentUserIdRef = useRef<string | null>(null);
  
  // Update the ref whenever currentUser changes
  useEffect(() => {
    currentUserIdRef.current = currentUser?.uid || null;
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    let unsubscribeShapes: (() => void) | null = null;
    let unsubscribeDrag: (() => void) | null = null;
    let unsubscribeSelectionDrag: (() => void) | null = null;

    const setupCanvas = async () => {
      try {
        // Initialize canvas document in Firestore
        await initializeCanvas();

        // Subscribe to real-time shape updates (persistent state from Firestore)
        unsubscribeShapes = subscribeToShapes((updatedShapes) => {
          setShapes(updatedShapes);
          setLoading(false);
          
          // Mark as connected when we receive data
          if (connectionStatus !== 'connected') {
            setConnectionStatus('connected');
            setIsReconnecting(false);
          }
          
          // Clear local updates for shapes that have been synced to Firestore
          setLocalUpdates((prev) => {
            const newMap = new Map(prev);
            updatedShapes.forEach((shape) => {
              const localUpdate = prev.get(shape.id);
              if (localUpdate) {
                // Clear local updates if Firestore data matches our local changes
                let allMatch = true;
                for (const key in localUpdate) {
                  const localVal = localUpdate[key as keyof typeof localUpdate];
                  const firestoreVal = shape[key as keyof typeof shape];
                  if (typeof localVal === 'number' && typeof firestoreVal === 'number') {
                    if (Math.abs(localVal - firestoreVal) > 0.01) {
                      allMatch = false;
                      break;
                    }
                  } else if (localVal !== firestoreVal) {
                    allMatch = false;
                    break;
                  }
                }
                if (allMatch) {
                  newMap.delete(shape.id);
                }
              }
            });
            return newMap;
          });
          
          // Update shape counters based on existing shapes
          const counters = { rectangle: 0, circle: 0, text: 0, line: 0 };
          updatedShapes.forEach((shape) => {
            const match = shape.name.match(/(\d+)$/);
            if (match) {
              const num = parseInt(match[1], 10);
              if (num > counters[shape.type]) {
                counters[shape.type] = num;
              }
            }
          });
          shapeCounterRef.current = counters;
        });

        // Subscribe to real-time drag positions (ephemeral state from RTDB)
        unsubscribeDrag = subscribeToDragPositions('global-canvas-v1', (positions) => {
          // Cancel any pending RAF
          if (dragUpdateRafRef.current !== null) {
            cancelAnimationFrame(dragUpdateRafRef.current);
          }
          
          // Store the latest positions
          pendingDragPositionsRef.current = positions;
          
          // Schedule update on next frame (max 60fps)
          dragUpdateRafRef.current = requestAnimationFrame(() => {
            if (pendingDragPositionsRef.current) {
              setDragPositions(prev => {
                const newPositions = pendingDragPositionsRef.current;
                if (!newPositions) return prev;
                
                // Quick check: if sizes are different, definitely update
                if (prev.size !== newPositions.size) return newPositions;
                
                // Check if any position actually changed
                let hasChanges = false;
                newPositions.forEach((pos, id) => {
                  const prevPos = prev.get(id);
                  if (!prevPos || prevPos.x !== pos.x || prevPos.y !== pos.y) {
                    hasChanges = true;
                  }
                });
                
                return hasChanges ? newPositions : prev;
              });
              pendingDragPositionsRef.current = null;
            }
            dragUpdateRafRef.current = null;
          });
        });

        // Subscribe to real-time selection drag updates
        unsubscribeSelectionDrag = subscribeToSelectionDrags('global-canvas-v1', (selections) => {
          setSelectionDrags(selections);
        });

      } catch (error) {
        console.error('Failed to setup canvas:', error);
        setLoading(false);
        
        // Handle connection errors
        if (error instanceof Error && (error.message.includes('unavailable') || error.message.includes('deadline-exceeded'))) {
          setConnectionStatus('disconnected');
          setIsReconnecting(true);
          
          // Attempt reconnection after a delay
          setTimeout(() => {
            setConnectionStatus('reconnecting');
            setupCanvas(); // Retry setup
          }, 2000);
        }
      }
    };

    setupCanvas();

    // Cleanup: unsubscribe and release locks on unmount
    return () => {
      if (unsubscribeShapes) {
        unsubscribeShapes();
      }
      if (unsubscribeDrag) {
        unsubscribeDrag();
      }
      if (unsubscribeSelectionDrag) {
        unsubscribeSelectionDrag();
      }
      // Cancel any pending drag RAF
      if (dragUpdateRafRef.current !== null) {
        cancelAnimationFrame(dragUpdateRafRef.current);
      }
      // Use the ref to get userId for cleanup, even if currentUser is already null
      const userId = currentUserIdRef.current;
      if (userId) {
        cleanupUserLocks(userId).catch(console.error);
      }
    };
  }, [currentUser, connectionStatus, setShapes, setLoading, setDragPositions, setSelectionDrags, setLocalUpdates, shapeCounterRef, setConnectionStatus, setIsReconnecting]);
}

