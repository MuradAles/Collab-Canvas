/**
 * Canvas Context
 * Manages canvas state including shapes, selections, and stage reference
 * For MVP: Local state only (real-time sync will be added in PR #5)
 */

import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';
import type Konva from 'konva';
import type { Shape, ShapeUpdate, CanvasContextType } from '../types';
import { generateId } from '../utils/helpers';

const CanvasContext = createContext<CanvasContextType | null>(null);

interface CanvasProviderProps {
  children: ReactNode;
}

export function CanvasProvider({ children }: CanvasProviderProps) {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading] = useState(false); // Will be used in PR #5 for Firestore loading
  const stageRef = useRef<Konva.Stage | null>(null);
  
  // Counter for shape names (increments and never resets)
  const shapeCounterRef = useRef<{ [key: string]: number }>({
    rectangle: 0,
    circle: 0,
    text: 0,
  });

  /**
   * Adds a new shape to the canvas
   * For MVP: Supports rectangles and text with local state
   */
  const addShape = useCallback(
    async (shapeData: Omit<Shape, 'id' | 'name' | 'isLocked' | 'lockedBy' | 'lockedByName'>) => {
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

      setShapes((prev) => [...prev, newShape]);
      
      // Auto-select the newly created shape
      setSelectedId(newShape.id);
    },
    []
  );

  /**
   * Updates an existing shape
   */
  const updateShape = useCallback(async (id: string, updates: ShapeUpdate) => {
    setShapes((prev) =>
      prev.map((shape) =>
        shape.id === id ? { ...shape, ...updates } : shape
      )
    );
  }, []);

  /**
   * Deletes a shape from the canvas
   * Cannot delete shapes locked by other users (will matter in PR #5)
   */
  const deleteShape = useCallback(async (id: string) => {
    setShapes((prev) => {
      const shape = prev.find((s) => s.id === id);
      // For MVP, allow deletion. Lock check will be enforced in PR #5
      if (!shape) return prev;
      
      return prev.filter((s) => s.id !== id);
    });
    
    // Deselect if the deleted shape was selected
    setSelectedId((prev) => (prev === id ? null : prev));
  }, []);

  /**
   * Sets the selected shape ID
   */
  const selectShape = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  /**
   * Reorders shapes (for z-index management)
   */
  const reorderShapes = useCallback((newOrder: Shape[]) => {
    setShapes(newOrder);
  }, []);

  /**
   * Locks a shape (will be fully implemented in PR #5 with Firestore)
   */
  const lockShape = useCallback(
    async (id: string, userId: string, userName: string) => {
      setShapes((prev) =>
        prev.map((shape) =>
          shape.id === id
            ? {
                ...shape,
                isLocked: true,
                lockedBy: userId,
                lockedByName: userName,
              }
            : shape
        )
      );
    },
    []
  );

  /**
   * Unlocks a shape (will be fully implemented in PR #5 with Firestore)
   */
  const unlockShape = useCallback(async (id: string) => {
    setShapes((prev) =>
      prev.map((shape) =>
        shape.id === id
          ? {
              ...shape,
              isLocked: false,
              lockedBy: null,
              lockedByName: null,
            }
          : shape
      )
    );
  }, []);

  const value: CanvasContextType = {
    shapes,
    selectedId,
    loading,
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

