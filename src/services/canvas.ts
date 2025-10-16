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
  collection,
  query,
  orderBy,
  getDocs,
  deleteDoc,
  writeBatch,
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
const SHAPES_SUBCOLLECTION = 'shapes';

// ============================================================================
// Types
// ============================================================================

interface ShapeSubscriptionCallback {
  (shapes: Shape[]): void;
}

interface LockTimeoutMap {
  [shapeId: string]: number;
}

// ============================================================================
// Lock Timeout Management
// ============================================================================

const lockTimeouts: LockTimeoutMap = {};

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
 * Subscribe to real-time shape updates from Firestore subcollection
 * Returns an unsubscribe function to clean up the listener
 * NEW: Each shape is now a separate document for efficient updates
 */
export function subscribeToShapes(
  callback: ShapeSubscriptionCallback
): Unsubscribe {
  const shapesRef = collection(db, CANVAS_COLLECTION, GLOBAL_CANVAS_ID, SHAPES_SUBCOLLECTION);
  const shapesQuery = query(shapesRef, orderBy('zIndex', 'asc'));
  
  return onSnapshot(
    shapesQuery,
    (snapshot) => {
      const shapes: Shape[] = [];
      snapshot.forEach((doc) => {
        shapes.push(doc.data() as Shape);
      });
      callback(shapes);
    },
    (error: any) => {
      // Silently ignore permission errors (happens during logout)
      if (error?.code === 'permission-denied') {
        // User logged out, just return empty shapes
        callback([]);
        return;
      }
      console.error('Error listening to shapes updates:', error);
      throw new Error('Failed to sync shapes data');
    }
  );
}

// ============================================================================
// Shape CRUD Operations
// ============================================================================

/**
 * Add a new shape to the canvas
 * NEW: Creates a separate document for the shape (efficient!)
 */
export async function createShape(shape: Shape): Promise<void> {
  try {
    // Ensure canvas document exists
    const canvasRef = doc(db, CANVAS_COLLECTION, GLOBAL_CANVAS_ID);
    const canvasSnap = await getDoc(canvasRef);
    
    if (!canvasSnap.exists()) {
      await initializeCanvas();
    }
    
    // Create shape as individual document in subcollection
    const shapeRef = doc(db, CANVAS_COLLECTION, GLOBAL_CANVAS_ID, SHAPES_SUBCOLLECTION, shape.id);
    await setDoc(shapeRef, shape);
  } catch (error) {
    console.error('Failed to create shape:', error);
    throw new Error('Failed to create shape');
  }
}

/**
 * Update an existing shape
 * NEW: Only updates the specific shape document (HUGE performance improvement!)
 */
export async function updateShape(
  shapeId: string,
  updates: Partial<Shape>
): Promise<void> {
  try {
    // Update only the specific shape document
    const shapeRef = doc(db, CANVAS_COLLECTION, GLOBAL_CANVAS_ID, SHAPES_SUBCOLLECTION, shapeId);
    await updateDoc(shapeRef, updates);
  } catch (error) {
    console.error('Failed to update shape:', error);
    throw new Error('Failed to update shape');
  }
}

/**
 * Batch update multiple shapes at once
 * OPTIMIZATION: Uses Firestore batch writes for 1 network round trip instead of N
 * Perfect for multi-select drag operations
 */
export async function updateShapesBatch(
  updates: Array<{ shapeId: string; updates: Partial<Shape> }>
): Promise<void> {
  try {
    const batch = writeBatch(db);
    
    // Add all updates to the batch
    updates.forEach(({ shapeId, updates: shapeUpdates }) => {
      const shapeRef = doc(db, CANVAS_COLLECTION, GLOBAL_CANVAS_ID, SHAPES_SUBCOLLECTION, shapeId);
      batch.update(shapeRef, shapeUpdates);
    });
    
    // Commit all updates in a single network request
    await batch.commit();
  } catch (error) {
    console.error('Failed to batch update shapes:', error);
    throw new Error('Failed to batch update shapes');
  }
}

/**
 * Delete a shape from the canvas
 * Only allows deletion if shape is not locked by another user
 * NEW: Deletes only the specific shape document
 */
export async function deleteShape(
  shapeId: string,
  currentUserId: string
): Promise<void> {
  try {
    const shapeRef = doc(db, CANVAS_COLLECTION, GLOBAL_CANVAS_ID, SHAPES_SUBCOLLECTION, shapeId);
    const shapeSnap = await getDoc(shapeRef);
    
    // If shape doesn't exist, it's already deleted - silently succeed
    if (!shapeSnap.exists()) {
      console.log(`Shape ${shapeId} already deleted, skipping`);
      return;
    }
    
    const shapeToDelete = shapeSnap.data() as Shape;
    
    // Check if shape is locked by another user
    if (
      shapeToDelete.isLocked &&
      shapeToDelete.lockedBy &&
      shapeToDelete.lockedBy !== currentUserId
    ) {
      const errorMsg = `Cannot delete shape locked by ${shapeToDelete.lockedByName || 'another user'}`;
      console.warn(errorMsg);
      throw new Error(errorMsg);
    }
    
    // Delete the shape document
    await deleteDoc(shapeRef);
  } catch (error) {
    console.error('Failed to delete shape:', error);
    throw error;
  }
}

/**
 * Reorder shapes (for z-index management)
 * NEW: Updates zIndex field for each shape using batch writes
 */
export async function reorderShapes(shapes: Shape[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    
    // Update zIndex for each shape
    shapes.forEach((shape, index) => {
      const shapeRef = doc(db, CANVAS_COLLECTION, GLOBAL_CANVAS_ID, SHAPES_SUBCOLLECTION, shape.id);
      batch.update(shapeRef, { zIndex: index });
    });
    
    await batch.commit();
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
 * NEW: Updates only the specific shape document
 */
export async function lockShape(
  shapeId: string,
  userId: string,
  userName: string
): Promise<void> {
  try {
    const shapeRef = doc(db, CANVAS_COLLECTION, GLOBAL_CANVAS_ID, SHAPES_SUBCOLLECTION, shapeId);
    const shapeSnap = await getDoc(shapeRef);
    
    if (!shapeSnap.exists()) {
      throw new Error('Shape not found');
    }
    
    const shapeToLock = shapeSnap.data() as Shape;
    
    // Check if already locked by another user
    if (
      shapeToLock.isLocked &&
      shapeToLock.lockedBy &&
      shapeToLock.lockedBy !== userId
    ) {
      throw new Error(
        `Shape is already locked by ${shapeToLock.lockedByName || 'another user'}`
      );
    }
    
    // Update only this shape's lock status
    await updateDoc(shapeRef, {
      isLocked: true,
      lockedBy: userId,
      lockedByName: userName,
      isDragging: false,
      draggingBy: null,
      draggingByName: null,
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
  } catch (error) {
    console.error('Failed to lock shape:', error);
    throw error;
  }
}

/**
 * Unlock a shape when user stops dragging
 * NEW: Updates only the specific shape document
 */
export async function unlockShape(
  shapeId: string,
  userId: string
): Promise<void> {
  try {
    // Clear timeout (if any - though we don't set them anymore)
    clearLockTimeout(shapeId);
    
    const shapeRef = doc(db, CANVAS_COLLECTION, GLOBAL_CANVAS_ID, SHAPES_SUBCOLLECTION, shapeId);
    const shapeSnap = await getDoc(shapeRef);
    
    if (!shapeSnap.exists()) {
      return; // Shape was deleted, nothing to unlock
    }
    
    const shapeToUnlock = shapeSnap.data() as Shape;
    
    // Only unlock if locked by current user
    if (shapeToUnlock.lockedBy !== userId) {
      return; // Silently return if not locked by this user
    }
    
    // Update only this shape's lock status
    await updateDoc(shapeRef, {
      isLocked: false,
      lockedBy: null,
      lockedByName: null,
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
 * Lock multiple shapes at once using a batch write
 * ⚡ ALL SHAPES LOCK SIMULTANEOUSLY for all users (single Firestore transaction)
 */
export async function lockShapesBatch(
  shapeIds: string[],
  userId: string,
  userName: string
): Promise<void> {
  if (shapeIds.length === 0) return;

  try {
    const batch = writeBatch(db);
    const rtdbPromises: Promise<void>[] = [];

    for (const shapeId of shapeIds) {
      const shapeRef = doc(db, CANVAS_COLLECTION, GLOBAL_CANVAS_ID, SHAPES_SUBCOLLECTION, shapeId);
      
      // Add to batch
      batch.update(shapeRef, {
        isLocked: true,
        lockedBy: userId,
        lockedByName: userName,
        isDragging: false,
        draggingBy: null,
        draggingByName: null,
      });

      // Set up auto-release in RTDB (parallel)
      const lockRef = ref(rtdb, `locks/${GLOBAL_CANVAS_ID}/${shapeId}`);
      rtdbPromises.push(
        set(lockRef, {
          userId,
          userName,
          timestamp: rtdbServerTimestamp(),
        }).then(() => onDisconnect(lockRef).remove())
      );
    }

    // ⚡ Single atomic commit - all shapes lock at once!
    await batch.commit();
    
    // RTDB updates in parallel
    await Promise.all(rtdbPromises);
  } catch (error) {
    console.error('Failed to batch lock shapes:', error);
    throw error;
  }
}

/**
 * Unlock multiple shapes at once using a batch write
 * ⚡ ALL SHAPES UNLOCK SIMULTANEOUSLY for all users (single Firestore transaction)
 */
export async function unlockShapesBatch(
  shapeIds: string[],
  _userId: string // Kept for consistency with single unlock, but not needed for batch
): Promise<void> {
  if (shapeIds.length === 0) return;

  try {
    const batch = writeBatch(db);
    const rtdbPromises: Promise<void>[] = [];

    for (const shapeId of shapeIds) {
      clearLockTimeout(shapeId);
      
      const shapeRef = doc(db, CANVAS_COLLECTION, GLOBAL_CANVAS_ID, SHAPES_SUBCOLLECTION, shapeId);
      
      // Add to batch
      batch.update(shapeRef, {
        isLocked: false,
        lockedBy: null,
        lockedByName: null,
      });

      // Remove from RTDB (parallel)
      const lockRef = ref(rtdb, `locks/${GLOBAL_CANVAS_ID}/${shapeId}`);
      rtdbPromises.push(set(lockRef, null));
    }

    // ⚡ Single atomic commit - all shapes unlock at once!
    await batch.commit();
    
    // RTDB updates in parallel
    await Promise.all(rtdbPromises);
  } catch (error) {
    console.error('Failed to batch unlock shapes:', error);
    throw error;
  }
}

/**
 * Clean up all locks for a specific user (call on disconnect)
 * NEW: Uses batch writes to unlock multiple shapes efficiently
 */
export async function cleanupUserLocks(userId: string): Promise<void> {
  try {
    // Query all shapes locked by this user
    const shapesRef = collection(db, CANVAS_COLLECTION, GLOBAL_CANVAS_ID, SHAPES_SUBCOLLECTION);
    const shapesSnap = await getDocs(shapesRef);
    
    const batch = writeBatch(db);
    let hasUpdates = false;
    
    shapesSnap.forEach((docSnap) => {
      const shape = docSnap.data() as Shape;
      if (shape.lockedBy === userId) {
        const shapeRef = doc(db, CANVAS_COLLECTION, GLOBAL_CANVAS_ID, SHAPES_SUBCOLLECTION, shape.id);
        batch.update(shapeRef, {
          isLocked: false,
          lockedBy: null,
          lockedByName: null,
        });
        hasUpdates = true;
      }
    });
    
    if (hasUpdates) {
      await batch.commit();
    }
  } catch (error: any) {
    // Silently ignore permission errors during logout
    if (error?.code !== 'permission-denied') {
      console.error('Failed to cleanup user locks:', error);
    }
  }
}

