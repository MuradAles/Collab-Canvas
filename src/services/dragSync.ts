/**
 * Real-time Drag Synchronization Service
 * Uses Firebase Realtime Database for ultra-low latency position updates (<100ms)
 * during shape dragging across users
 */

import { ref, set, onValue, off, remove } from 'firebase/database';
import { rtdb } from './firebase';

export interface DragPosition {
  x: number;
  y: number;
  rotation?: number;
  draggingBy: string;
  draggingByName: string;
  timestamp: number;
}

/**
 * Update shape position in real-time during drag
 * No throttling - sends every position update for smooth movement
 */
export async function updateDragPosition(
  canvasId: string,
  shapeId: string,
  x: number,
  y: number,
  userId: string,
  userName: string,
  rotation?: number
): Promise<void> {
  const dragRef = ref(rtdb, `drag/${canvasId}/${shapeId}`);
  
  try {
    const data: DragPosition = {
      x,
      y,
      draggingBy: userId,
      draggingByName: userName,
      timestamp: Date.now(),
    };
    
    if (rotation !== undefined) {
      data.rotation = rotation;
    }
    
    await set(dragRef, data);
  } catch (error) {
    console.error('Failed to update drag position:', error);
    throw error;
  }
}

/**
 * Clear drag position when drag ends
 */
export async function clearDragPosition(
  canvasId: string,
  shapeId: string
): Promise<void> {
  const dragRef = ref(rtdb, `drag/${canvasId}/${shapeId}`);
  
  try {
    await remove(dragRef);
  } catch (error) {
    console.error('Failed to clear drag position:', error);
  }
}

/**
 * Subscribe to real-time drag position updates for all shapes
 */
export function subscribeToDragPositions(
  canvasId: string,
  callback: (updates: Map<string, DragPosition>) => void
): () => void {
  const dragRef = ref(rtdb, `drag/${canvasId}`);
  
  const handleDragUpdate = (snapshot: any) => {
    const data = snapshot.val();
    const updates = new Map<string, DragPosition>();
    
    if (data) {
      Object.entries(data).forEach(([shapeId, position]) => {
        updates.set(shapeId, position as DragPosition);
      });
    }
    
    callback(updates);
  };
  
  onValue(dragRef, handleDragUpdate, (error) => {
    console.error('Error subscribing to drag positions:', error);
  });
  
  return () => {
    off(dragRef);
  };
}

