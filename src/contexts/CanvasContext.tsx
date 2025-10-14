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
  const { currentUser } = useAuth();
  
  // Counter for shape names (increments and never resets)
  const shapeCounterRef = useRef<{ [key: string]: number }>({
    rectangle: 0,
    circle: 0,
    text: 0,
  });

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
      if (currentUser) {
        cleanupUserLocks(currentUser.uid).catch(console.error);
        setUserOffline(currentUser.uid).catch(console.error);
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

      const newShape: Shape = {
        ...shapeData,
        id: generateId(),
        name,
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
    [currentUser]
  );

  /**
   * Updates an existing shape
   * Syncs to Firestore
   */
  const updateShape = useCallback(
    async (id: string, updates: ShapeUpdate) => {
      if (!currentUser) {
        throw new Error('Must be logged in to update shapes');
      }

      try {
        await updateShapeInFirestore(id, updates);
      } catch (error) {
        console.error('Failed to update shape:', error);
        throw error;
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

  // Merge real-time drag positions with persistent shapes for ultra-smooth updates
  const shapesWithDragPositions = shapes.map(shape => {
    const dragPos = dragPositions.get(shape.id);
    if (dragPos && dragPos.draggingBy !== currentUser?.uid) {
      // Apply real-time position, rotation, and dimensions from RTDB if being transformed by another user
      const updates: any = {
        ...shape,
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
      if (shape.type === 'rectangle') {
        if (dragPos.width !== undefined) {
          updates.width = dragPos.width;
        }
        if (dragPos.height !== undefined) {
          updates.height = dragPos.height;
        }
      } else if (shape.type === 'circle') {
        if (dragPos.radius !== undefined) {
          updates.radius = dragPos.radius;
        }
      } else if (shape.type === 'text') {
        if (dragPos.width !== undefined) {
          updates.width = dragPos.width;
        }
        if (dragPos.fontSize !== undefined) {
          updates.fontSize = dragPos.fontSize;
        }
      }
      
      return updates;
    }
    return shape;
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

