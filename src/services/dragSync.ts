/**
 * Real-time Drag Synchronization Service
 * Uses Firebase Realtime Database for ultra-low latency position updates (<100ms)
 * during shape dragging across users
 */

import { ref, set, update, onValue, off, remove } from 'firebase/database';
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
 * Selection drag data for multi-shape dragging optimization
 * Uses delta-based positioning for efficient multi-shape dragging
 */
export interface SelectionDrag {
  userId: string;
  userName: string;
  userColor: string;
  shapeIds: string[];     // IDs of shapes being dragged
  shapeCount: number;     // Number of shapes
  // Initial positions of all shapes (stored at drag start)
  initialPositions: Record<string, { x: number; y: number; x1?: number; y1?: number; x2?: number; y2?: number }>;
  // Delta from initial position (updated during drag)
  deltaX: number;
  deltaY: number;
  timestamp: number;
}

/**
 * Update shape position and transformation in real-time during drag/resize/rotate
 * Called by useShapeInteraction hook which throttles updates using RAF (~60fps)
 * This function itself is fire-and-forget for maximum speed
 * NOTE: Firebase batches writes automatically, so multiple rapid calls are efficient
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
    
    console.log(`🔥 [FIREBASE WRITE] Individual Shape Drag - ShapeID: ${shapeId}`);
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
      const shapeIds = Object.keys(data);
      console.log(`📥 [FIREBASE READ] Individual drag positions - ${shapeIds.length} shape(s)`);
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

// ============================================================================
// Selection Drag (Multi-Shape Optimization)
// ============================================================================

/**
 * Initialize selection drag (sent once at drag start)
 * Stores initial positions of all shapes
 */
export async function initializeSelectionDrag(
  canvasId: string,
  userId: string,
  userName: string,
  userColor: string,
  shapeIds: string[],
  initialPositions: Record<string, { x: number; y: number; x1?: number; y1?: number; x2?: number; y2?: number }>
): Promise<void> {
  const selectionRef = ref(rtdb, `selection-drag/${canvasId}/${userId}`);
  
  try {
    const data: SelectionDrag = {
      userId,
      userName,
      userColor,
      shapeIds,
      shapeCount: shapeIds.length,
      initialPositions,
      deltaX: 0,
      deltaY: 0,
      timestamp: Date.now(),
    };
    
    console.log(`🔥 [FIREBASE WRITE] Selection Drag INIT - Shapes: ${shapeIds.length}`, data);
    await set(selectionRef, data);
    console.log(`✅ [FIREBASE WRITE] Complete`);
  } catch (error) {
    console.error('Failed to initialize selection drag:', error);
    throw error;
  }
}

/**
 * Update selection drag delta (throttled to 50ms)
 * Only updates the delta values, not the entire data structure
 */
export async function updateSelectionDragDelta(
  canvasId: string,
  userId: string,
  deltaX: number,
  deltaY: number
): Promise<void> {
  const selectionRef = ref(rtdb, `selection-drag/${canvasId}/${userId}`);
  
  try {
    const deltaData = {
      deltaX,
      deltaY,
      timestamp: Date.now(),
    };
    
    console.log(`🔥 [FIREBASE WRITE] Selection Drag DELTA`, deltaData);
    // CRITICAL: Use update() not set() to merge with existing data
    await update(selectionRef, deltaData);
  } catch (error) {
    console.error('Failed to update selection drag delta:', error);
  }
}

/**
 * Clear selection drag when drag ends
 */
export async function clearSelectionDrag(
  canvasId: string,
  userId: string
): Promise<void> {
  const selectionRef = ref(rtdb, `selection-drag/${canvasId}/${userId}`);
  
  try {
    console.log(`🔥 [FIREBASE WRITE] Selection Drag CLEAR`);
    await remove(selectionRef);
  } catch (error) {
    console.error('Failed to clear selection drag:', error);
  }
}

/**
 * Subscribe to real-time selection drag updates for all users
 */
export function subscribeToSelectionDrags(
  canvasId: string,
  callback: (updates: Map<string, SelectionDrag>) => void
): () => void {
  const selectionRef = ref(rtdb, `selection-drag/${canvasId}`);
  
  const handleSelectionUpdate = (snapshot: any) => {
    const data = snapshot.val();
    const updates = new Map<string, SelectionDrag>();
    
    if (data) {
      console.log(`📥 [FIREBASE READ] Selection drag update received`, data);
      Object.entries(data).forEach(([userId, selection]) => {
        const selectionData = selection as SelectionDrag;
        updates.set(userId, selectionData);
      });
    }
    
    callback(updates);
  };
  
  onValue(selectionRef, handleSelectionUpdate, (error) => {
    console.error('Error subscribing to selection drags:', error);
  });
  
  return () => {
    off(selectionRef);
  };
}

