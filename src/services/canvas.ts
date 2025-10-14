/**
 * Canvas Service - Firestore Operations
 * Handles all Firestore operations for canvas shapes including real-time sync and locking
 * 
 * Strategy:
 * - Single global canvas document: canvas/global-canvas-v1
 * - Lock objects on drag start (not on select)
 * - Auto-release locks on drag end or disconnect
 * - Real-time sync with <100ms latency
 */

import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { onDisconnect, ref, set, serverTimestamp as rtdbServerTimestamp } from 'firebase/database';
import { db, rtdb } from './firebase';
import type { Shape, CanvasDocument } from '../types';

// ============================================================================
// Constants
// ============================================================================

export const GLOBAL_CANVAS_ID = 'global-canvas-v1';
const CANVAS_COLLECTION = 'canvas';
const LOCK_TIMEOUT_MS = 5000; // Auto-release locks after 5 seconds

// ============================================================================
// Types
// ============================================================================

interface ShapeSubscriptionCallback {
  (shapes: Shape[]): void;
}

interface LockTimeoutMap {
  [shapeId: string]: NodeJS.Timeout;
}

// ============================================================================
// Lock Timeout Management
// ============================================================================

const lockTimeouts: LockTimeoutMap = {};

/**
 * Set a timeout to auto-release a lock
 */
function setLockTimeout(shapeId: string, callback: () => void): void {
  // Clear existing timeout if any
  if (lockTimeouts[shapeId]) {
    clearTimeout(lockTimeouts[shapeId]);
  }
  
  // Set new timeout
  lockTimeouts[shapeId] = setTimeout(callback, LOCK_TIMEOUT_MS);
}

/**
 * Clear a lock timeout
 */
function clearLockTimeout(shapeId: string): void {
  if (lockTimeouts[shapeId]) {
    clearTimeout(lockTimeouts[shapeId]);
    delete lockTimeouts[shapeId];
  }
}

// ============================================================================
// Initialize Canvas Document
// ============================================================================

/**
 * Ensures the global canvas document exists in Firestore
 * Creates it if it doesn't exist
 */
export async function initializeCanvas(): Promise<void> {
  try {
    const canvasRef = doc(db, CANVAS_COLLECTION, GLOBAL_CANVAS_ID);
    const canvasSnap = await getDoc(canvasRef);

    if (!canvasSnap.exists()) {
      const initialCanvas: CanvasDocument = {
        canvasId: GLOBAL_CANVAS_ID,
        shapes: [],
        lastUpdated: Date.now(),
      };
      
      await setDoc(canvasRef, {
        ...initialCanvas,
        lastUpdated: serverTimestamp(),
      });
      
      console.log('✅ Canvas initialized in Firestore');
    }
  } catch (error) {
    console.error('Failed to initialize canvas:', error);
    throw new Error('Failed to initialize canvas');
  }
}

// ============================================================================
// Real-Time Subscription
// ============================================================================

/**
 * Subscribe to real-time shape updates from Firestore
 * Returns an unsubscribe function to clean up the listener
 */
export function subscribeToShapes(
  callback: ShapeSubscriptionCallback
): Unsubscribe {
  const canvasRef = doc(db, CANVAS_COLLECTION, GLOBAL_CANVAS_ID);
  
  return onSnapshot(
    canvasRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as CanvasDocument;
        callback(data.shapes || []);
      } else {
        // Canvas doesn't exist yet, initialize it
        initializeCanvas().catch(console.error);
        callback([]);
      }
    },
    (error) => {
      console.error('Error listening to canvas updates:', error);
      throw new Error('Failed to sync canvas data');
    }
  );
}

// ============================================================================
// Shape CRUD Operations
// ============================================================================

/**
 * Add a new shape to the canvas
 */
export async function createShape(shape: Shape): Promise<void> {
  try {
    const canvasRef = doc(db, CANVAS_COLLECTION, GLOBAL_CANVAS_ID);
    const canvasSnap = await getDoc(canvasRef);
    
    if (!canvasSnap.exists()) {
      await initializeCanvas();
    }
    
    const currentData = canvasSnap.exists() 
      ? (canvasSnap.data() as CanvasDocument)
      : { canvasId: GLOBAL_CANVAS_ID, shapes: [], lastUpdated: Date.now() };
    
    const updatedShapes = [...currentData.shapes, shape];
    
    await updateDoc(canvasRef, {
      shapes: updatedShapes,
      lastUpdated: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to create shape:', error);
    throw new Error('Failed to create shape');
  }
}

/**
 * Update an existing shape
 */
export async function updateShape(
  shapeId: string,
  updates: Partial<Shape>
): Promise<void> {
  try {
    const canvasRef = doc(db, CANVAS_COLLECTION, GLOBAL_CANVAS_ID);
    const canvasSnap = await getDoc(canvasRef);
    
    if (!canvasSnap.exists()) {
      throw new Error('Canvas not found');
    }
    
    const currentData = canvasSnap.data() as CanvasDocument;
    const updatedShapes = currentData.shapes.map((shape) =>
      shape.id === shapeId ? { ...shape, ...updates } : shape
    );
    
    await updateDoc(canvasRef, {
      shapes: updatedShapes,
      lastUpdated: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to update shape:', error);
    throw new Error('Failed to update shape');
  }
}

/**
 * Delete a shape from the canvas
 * Only allows deletion if shape is not locked by another user
 */
export async function deleteShape(
  shapeId: string,
  currentUserId: string
): Promise<void> {
  try {
    const canvasRef = doc(db, CANVAS_COLLECTION, GLOBAL_CANVAS_ID);
    const canvasSnap = await getDoc(canvasRef);
    
    if (!canvasSnap.exists()) {
      throw new Error('Canvas not found');
    }
    
    const currentData = canvasSnap.data() as CanvasDocument;
    const shapeToDelete = currentData.shapes.find((s) => s.id === shapeId);
    
    // Check if shape is locked by another user
    if (
      shapeToDelete?.isLocked &&
      shapeToDelete.lockedBy &&
      shapeToDelete.lockedBy !== currentUserId
    ) {
      throw new Error(
        `Cannot delete shape locked by ${shapeToDelete.lockedByName || 'another user'}`
      );
    }
    
    const updatedShapes = currentData.shapes.filter((s) => s.id !== shapeId);
    
    await updateDoc(canvasRef, {
      shapes: updatedShapes,
      lastUpdated: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to delete shape:', error);
    throw error;
  }
}

/**
 * Reorder shapes (for z-index management)
 */
export async function reorderShapes(shapes: Shape[]): Promise<void> {
  try {
    const canvasRef = doc(db, CANVAS_COLLECTION, GLOBAL_CANVAS_ID);
    
    await updateDoc(canvasRef, {
      shapes: shapes,
      lastUpdated: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to reorder shapes:', error);
    throw new Error('Failed to reorder shapes');
  }
}

// ============================================================================
// Shape Locking
// ============================================================================

/**
 * Lock a shape when user starts dragging
 * Sets up auto-release on disconnect using Realtime Database
 */
export async function lockShape(
  shapeId: string,
  userId: string,
  userName: string
): Promise<void> {
  try {
    // Update Firestore with lock
    const canvasRef = doc(db, CANVAS_COLLECTION, GLOBAL_CANVAS_ID);
    const canvasSnap = await getDoc(canvasRef);
    
    if (!canvasSnap.exists()) {
      throw new Error('Canvas not found');
    }
    
    const currentData = canvasSnap.data() as CanvasDocument;
    const shapeToLock = currentData.shapes.find((s) => s.id === shapeId);
    
    // Check if already locked by another user
    if (
      shapeToLock?.isLocked &&
      shapeToLock.lockedBy &&
      shapeToLock.lockedBy !== userId
    ) {
      throw new Error(
        `Shape is already locked by ${shapeToLock.lockedByName || 'another user'}`
      );
    }
    
    const updatedShapes = currentData.shapes.map((shape) =>
      shape.id === shapeId
        ? {
            ...shape,
            isLocked: true,
            lockedBy: userId,
            lockedByName: userName,
          }
        : shape
    );
    
    await updateDoc(canvasRef, {
      shapes: updatedShapes,
      lastUpdated: serverTimestamp(),
    });
    
    // Set up auto-release in Realtime Database using onDisconnect
    const lockRef = ref(rtdb, `locks/${GLOBAL_CANVAS_ID}/${shapeId}`);
    await set(lockRef, {
      userId,
      userName,
      timestamp: rtdbServerTimestamp(),
    });
    
    // Auto-release lock on disconnect
    await onDisconnect(lockRef).remove();
    
    // Set timeout to auto-release lock after 5 seconds
    setLockTimeout(shapeId, () => {
      unlockShape(shapeId, userId).catch(console.error);
    });
  } catch (error) {
    console.error('Failed to lock shape:', error);
    throw error;
  }
}

/**
 * Unlock a shape when user stops dragging
 */
export async function unlockShape(
  shapeId: string,
  userId: string
): Promise<void> {
  try {
    // Clear timeout
    clearLockTimeout(shapeId);
    
    // Update Firestore
    const canvasRef = doc(db, CANVAS_COLLECTION, GLOBAL_CANVAS_ID);
    const canvasSnap = await getDoc(canvasRef);
    
    if (!canvasSnap.exists()) {
      throw new Error('Canvas not found');
    }
    
    const currentData = canvasSnap.data() as CanvasDocument;
    const shapeToUnlock = currentData.shapes.find((s) => s.id === shapeId);
    
    // Only unlock if locked by current user
    if (shapeToUnlock?.lockedBy !== userId) {
      return; // Silently return if not locked by this user
    }
    
    const updatedShapes = currentData.shapes.map((shape) =>
      shape.id === shapeId
        ? {
            ...shape,
            isLocked: false,
            lockedBy: null,
            lockedByName: null,
          }
        : shape
    );
    
    await updateDoc(canvasRef, {
      shapes: updatedShapes,
      lastUpdated: serverTimestamp(),
    });
    
    // Remove lock from Realtime Database
    const lockRef = ref(rtdb, `locks/${GLOBAL_CANVAS_ID}/${shapeId}`);
    await set(lockRef, null);
  } catch (error) {
    console.error('Failed to unlock shape:', error);
    throw error;
  }
}

/**
 * Clean up all locks for a specific user (call on disconnect)
 */
export async function cleanupUserLocks(userId: string): Promise<void> {
  try {
    const canvasRef = doc(db, CANVAS_COLLECTION, GLOBAL_CANVAS_ID);
    const canvasSnap = await getDoc(canvasRef);
    
    if (!canvasSnap.exists()) {
      return;
    }
    
    const currentData = canvasSnap.data() as CanvasDocument;
    const updatedShapes = currentData.shapes.map((shape) =>
      shape.lockedBy === userId
        ? {
            ...shape,
            isLocked: false,
            lockedBy: null,
            lockedByName: null,
          }
        : shape
    );
    
    await updateDoc(canvasRef, {
      shapes: updatedShapes,
      lastUpdated: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to cleanup user locks:', error);
  }
}

