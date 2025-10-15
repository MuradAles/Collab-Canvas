/**
 * Canvas Context
 * Manages canvas state including shapes, selections, and real-time Firestore sync
 * PR #5: Integrated real-time synchronization with Firestore
 */

import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import type { Shape, ShapeUpdate, CanvasContextType } from '../types';
import { generateId } from '../utils/helpers';
import { useAuth } from './AuthContext';
import {
  initializeCanvas,
  subscribeToShapes,
  createShape as createShapeInFirestore,
  updateShape as updateShapeInFirestore,
  deleteShape as deleteShapeInFirestore,
  reorderShapes as reorderShapesInFirestore,
  lockShape as lockShapeInFirestore,
  unlockShape as unlockShapeInFirestore,
  cleanupUserLocks,
} from '../services/canvas';
import {
  setUserOnline,
  setUserOffline,
  subscribeToPresence,
  type PresenceData,
} from '../services/presence';
import {
  subscribeToDragPositions,
  type DragPosition,
} from '../services/dragSync';

const CanvasContext = createContext<CanvasContextType | null>(null);

interface CanvasProviderProps {
  children: ReactNode;
}

export function CanvasProvider({ children }: CanvasProviderProps) {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<PresenceData[]>([]);
  const [dragPositions, setDragPositions] = useState<Map<string, DragPosition>>(new Map());
  const [localUpdates, setLocalUpdates] = useState<Map<string, Partial<Shape>>>(new Map());
  const { currentUser } = useAuth();
  
  // Counter for shape names (increments and never resets)
  const shapeCounterRef = useRef<{ [key: string]: number }>({
    rectangle: 0,
    circle: 0,
    text: 0,
  });
  
  // Store current user ID in a ref for cleanup (persists even after currentUser becomes null)
  const currentUserIdRef = useRef<string | null>(null);
  
  // Update the ref whenever currentUser changes
  useEffect(() => {
    currentUserIdRef.current = currentUser?.uid || null;
  }, [currentUser]);

  // ============================================================================
  // Initialize Canvas and Subscribe to Real-Time Updates
  // ============================================================================

  useEffect(() => {
    if (!currentUser) return;

    let unsubscribeShapes: (() => void) | null = null;
    let unsubscribePresence: (() => void) | null = null;
    let unsubscribeDrag: (() => void) | null = null;

    const setupCanvas = async () => {
      try {
        // Initialize canvas document in Firestore
        await initializeCanvas();

        // Subscribe to real-time shape updates (persistent state from Firestore)
        unsubscribeShapes = subscribeToShapes((updatedShapes) => {
          setShapes(updatedShapes);
          setLoading(false);
          
          // Clear local updates for shapes that have been synced to Firestore
          // This prevents the flash by only clearing after Firebase confirms the update
          setLocalUpdates((prev) => {
            const newMap = new Map(prev);
            updatedShapes.forEach((shape) => {
              // If we have local updates for this shape, check if Firestore has caught up
              const localUpdate = prev.get(shape.id);
              if (localUpdate) {
                // Clear local updates if Firestore data matches our local changes
                // (with some tolerance for floating point precision)
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
          const counters = { rectangle: 0, circle: 0, text: 0 };
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

        // Subscribe to real-time drag positions (ephemeral state from RTDB for <100ms sync)
        unsubscribeDrag = subscribeToDragPositions('global-canvas-v1', (positions) => {
          setDragPositions(positions);
        });

        // Set user as online and subscribe to presence
        await setUserOnline(
          currentUser.uid,
          currentUser.displayName || 'Unknown User'
        );

        unsubscribePresence = subscribeToPresence((users) => {
          setOnlineUsers(users);
        });
      } catch (error) {
        console.error('Failed to setup canvas:', error);
        setLoading(false);
      }
    };

    setupCanvas();

    // Cleanup: unsubscribe and release locks on unmount
    return () => {
      if (unsubscribeShapes) {
        unsubscribeShapes();
      }
      if (unsubscribePresence) {
        unsubscribePresence();
      }
      if (unsubscribeDrag) {
        unsubscribeDrag();
      }
      // Use the ref to get userId for cleanup, even if currentUser is already null
      const userId = currentUserIdRef.current;
      if (userId) {
        cleanupUserLocks(userId).catch(console.error);
        setUserOffline(userId).catch(console.error);
      }
    };
  }, [currentUser]);

  // ============================================================================
  // Shape CRUD Operations (with Firestore sync)
  // ============================================================================

  /**
   * Adds a new shape to the canvas
   * Syncs to Firestore for real-time collaboration
   */
  const addShape = useCallback(
    async (shapeData: Omit<Shape, 'id' | 'name' | 'isLocked' | 'lockedBy' | 'lockedByName'>) => {
      if (!currentUser) {
        throw new Error('Must be logged in to create shapes');
      }

      // Increment counter and generate name
      shapeCounterRef.current[shapeData.type] += 1;
      const shapeNumber = shapeCounterRef.current[shapeData.type];
      
      let name: string;
      if (shapeData.type === 'rectangle') {
        name = `Rectangle ${shapeNumber}`;
      } else if (shapeData.type === 'circle') {
        name = `Circle ${shapeNumber}`;
      } else {
        name = `Text ${shapeNumber}`;
      }

      // Calculate zIndex (new shapes go on top)
      const maxZIndex = shapes.length > 0 
        ? Math.max(...shapes.map(s => s.zIndex)) 
        : -1;

      const newShape: Shape = {
        ...shapeData,
        id: generateId(),
        name,
        zIndex: maxZIndex + 1,
        isLocked: false,
        lockedBy: null,
        lockedByName: null,
      } as Shape;

      try {
        await createShapeInFirestore(newShape);
        // Auto-select the newly created shape
        setSelectedId(newShape.id);
      } catch (error) {
        console.error('Failed to add shape:', error);
        throw error;
      }
    },
    [currentUser, shapes]
  );

  /**
   * Updates an existing shape
   * @param id - Shape ID to update
   * @param updates - Partial shape updates
   * @param localOnly - If true, only updates local state (no Firebase sync). If false/undefined, syncs to Firebase.
   */
  const updateShape = useCallback(
    async (id: string, updates: ShapeUpdate, localOnly = false) => {
      if (!currentUser) {
        throw new Error('Must be logged in to update shapes');
      }

      // Always update local state first for instant feedback
      setLocalUpdates((prev) => {
        const newMap = new Map(prev);
        const existing = newMap.get(id) || {};
        newMap.set(id, { ...existing, ...updates });
        return newMap;
      });

      // If not local-only, also sync to Firebase (but keep local updates for smooth transition)
      if (!localOnly) {
        try {
          await updateShapeInFirestore(id, updates);
          // Don't clear local updates immediately - let Firestore subscription handle it
          // This prevents the flash when the update is in-flight
        } catch (error) {
          console.error('Failed to update shape:', error);
          throw error;
        }
      }
    },
    [currentUser]
  );

  /**
   * Deletes a shape from the canvas
   * Cannot delete shapes locked by other users
   */
  const deleteShape = useCallback(
    async (id: string) => {
      if (!currentUser) {
        throw new Error('Must be logged in to delete shapes');
      }

      try {
        await deleteShapeInFirestore(id, currentUser.uid);
        // Deselect if the deleted shape was selected
        setSelectedId((prev) => (prev === id ? null : prev));
      } catch (error) {
        console.error('Failed to delete shape:', error);
        // Show user-friendly error message
        if (error instanceof Error) {
          alert(error.message);
        }
      }
    },
    [currentUser]
  );

  /**
   * Sets the selected shape ID
   */
  const selectShape = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  /**
   * Reorders shapes (for z-index management)
   * Syncs to Firestore
   */
  const reorderShapes = useCallback(
    async (newOrder: Shape[]) => {
      if (!currentUser) {
        throw new Error('Must be logged in to reorder shapes');
      }

      try {
        await reorderShapesInFirestore(newOrder);
      } catch (error) {
        console.error('Failed to reorder shapes:', error);
        throw error;
      }
    },
    [currentUser]
  );

  // ============================================================================
  // Shape Locking (for drag operations)
  // ============================================================================

  /**
   * Locks a shape when user starts dragging
   * Syncs to Firestore and sets up auto-release
   */
  const lockShape = useCallback(
    async (id: string, userId: string, userName: string) => {
      if (!currentUser) {
        throw new Error('Must be logged in to lock shapes');
      }

      try {
        await lockShapeInFirestore(id, userId, userName);
      } catch (error) {
        console.error('Failed to lock shape:', error);
        // Show user-friendly error message
        if (error instanceof Error) {
          alert(error.message);
        }
        throw error;
      }
    },
    [currentUser]
  );

  /**
   * Unlocks a shape when user stops dragging
   * Syncs to Firestore
   */
  const unlockShape = useCallback(
    async (id: string) => {
      if (!currentUser) {
        return;
      }

      try {
        await unlockShapeInFirestore(id, currentUser.uid);
      } catch (error) {
        console.error('Failed to unlock shape:', error);
      }
    },
    [currentUser]
  );

  // Merge real-time drag positions and local updates with persistent shapes
  const shapesWithDragPositions = shapes.map(shape => {
    let mergedShape: Shape = { ...shape };
    
    // First, apply local updates (optimistic updates for properties panel)
    const localUpdate = localUpdates.get(shape.id);
    if (localUpdate) {
      mergedShape = { ...mergedShape, ...localUpdate } as Shape;
    }
    
    // Then, apply drag positions (real-time RTDB updates from other users)
    const dragPos = dragPositions.get(shape.id);
    if (dragPos && dragPos.draggingBy !== currentUser?.uid) {
      // Apply real-time position, rotation, and dimensions from RTDB if being transformed by another user
      const updates: any = {
        ...mergedShape,
        x: dragPos.x,
        y: dragPos.y,
        isDragging: true,
        draggingBy: dragPos.draggingBy,
        draggingByName: dragPos.draggingByName,
      };
      
      // Include rotation if it's being updated
      if (dragPos.rotation !== undefined) {
        updates.rotation = dragPos.rotation;
      }
      
      // Include dimensions if they're being updated (for resize operations)
      if (mergedShape.type === 'rectangle') {
        if (dragPos.width !== undefined) {
          updates.width = dragPos.width;
        }
        if (dragPos.height !== undefined) {
          updates.height = dragPos.height;
        }
      } else if (mergedShape.type === 'circle') {
        if (dragPos.radius !== undefined) {
          updates.radius = dragPos.radius;
        }
      } else if (mergedShape.type === 'text') {
        if (dragPos.width !== undefined) {
          updates.width = dragPos.width;
        }
        if (dragPos.fontSize !== undefined) {
          updates.fontSize = dragPos.fontSize;
        }
      }
      
      return updates;
    }
    return mergedShape;
  });

  const value: CanvasContextType = {
    shapes: shapesWithDragPositions,
    selectedId,
    loading,
    onlineUsers,
    addShape,
    updateShape,
    deleteShape,
    selectShape,
    lockShape,
    unlockShape,
    reorderShapes,
  };

  return (
    <CanvasContext.Provider value={value}>{children}</CanvasContext.Provider>
  );
}

/**
 * Hook to use canvas context
 */
export function useCanvasContext() {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error('useCanvasContext must be used within CanvasProvider');
  }
  return context;
}

