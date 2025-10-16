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
  width?: number;        // For rectangles and text
  height?: number;       // For rectangles
  radius?: number;       // For circles
  fontSize?: number;     // For text
  x1?: number;           // For lines
  y1?: number;           // For lines
  x2?: number;           // For lines
  y2?: number;           // For lines
  draggingBy: string;
  draggingByName: string;
  timestamp: number;
}

/**
 * Update shape position and transformation in real-time during drag/resize/rotate
 * Called by useShapeInteraction hook which throttles updates using RAF (~60fps)
 * This function itself is fire-and-forget for maximum speed
 */
export async function updateDragPosition(
  canvasId: string,
  shapeId: string,
  x: number,
  y: number,
  userId: string,
  userName: string,
  rotation?: number,
  width?: number,
  height?: number,
  radius?: number,
  fontSize?: number,
  x1?: number,
  y1?: number,
  x2?: number,
  y2?: number
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
    
    if (width !== undefined) {
      data.width = width;
    }
    
    if (height !== undefined) {
      data.height = height;
    }
    
    if (radius !== undefined) {
      data.radius = radius;
    }
    
    if (fontSize !== undefined) {
      data.fontSize = fontSize;
    }
    
    if (x1 !== undefined) {
      data.x1 = x1;
    }
    
    if (y1 !== undefined) {
      data.y1 = y1;
    }
    
    if (x2 !== undefined) {
      data.x2 = x2;
    }
    
    if (y2 !== undefined) {
      data.y2 = y2;
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

