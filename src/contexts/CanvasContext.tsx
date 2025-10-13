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
import { DEFAULT_SHAPE_FILL } from '../utils/constants';

const CanvasContext = createContext<CanvasContextType | null>(null);

interface CanvasProviderProps {
  children: ReactNode;
}

export function CanvasProvider({ children }: CanvasProviderProps) {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading] = useState(false); // Will be used in PR #5 for Firestore loading
  const stageRef = useRef<Konva.Stage | null>(null);

  /**
   * Adds a new shape to the canvas
   * For MVP: Only supports rectangles with local state
   */
  const addShape = useCallback(
    async (shapeData: Omit<Shape, 'id' | 'isLocked' | 'lockedBy' | 'lockedByName'>) => {
      const newShape: Shape = {
        ...shapeData,
        id: generateId(),
        isLocked: false,
        lockedBy: null,
        lockedByName: null,
      };

      setShapes((prev) => [...prev, newShape]);
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

