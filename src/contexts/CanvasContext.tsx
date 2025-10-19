/**
 * Canvas Context
 * Manages canvas state including shapes, selections, and real-time Firestore sync
 */

import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import type { Shape, CanvasContextType, Tool, SelectionRect } from '../types';
import type { DragPosition, SelectionDrag } from '../services/dragSync';
import { useAuth } from './AuthContext';
import { useCanvasInitialization } from '../hooks/canvas-context/useCanvasInitialization';
import { useShapeOperations } from '../hooks/canvas-context/useShapeOperations';
import { useShapeLocking } from '../hooks/canvas-context/useShapeLocking';
import { useShapeSelection } from '../hooks/canvas-context/useShapeSelection';
import { useShapeReordering } from '../hooks/canvas-context/useShapeReordering';
import { useDragSync } from '../hooks/canvas-context/useDragSync';

const CanvasContext = createContext<CanvasContextType | null>(null);

interface CanvasProviderProps {
  children: ReactNode;
}

export function CanvasProvider({ children }: CanvasProviderProps) {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragPositions, setDragPositions] = useState<Map<string, DragPosition>>(new Map());
  const [selectionDrags, setSelectionDrags] = useState<Map<string, SelectionDrag>>(new Map());
  const [localUpdates, setLocalUpdates] = useState<Map<string, Partial<Shape>>>(new Map());
  const [currentTool, setCurrentTool] = useState<Tool>('select');
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');
  const { currentUser } = useAuth();
  
  // Counter for shape names (increments and never resets)
  const shapeCounterRef = useRef<{ [key: string]: number }>({
    rectangle: 0,
    circle: 0,
    text: 0,
    line: 0,
  });
  
  // Store selectedIds in a ref to avoid stale closure issues
  const selectedIdsRef = useRef<string[]>(selectedIds);
  
  // Update selectedIds ref whenever it changes
  useEffect(() => {
    selectedIdsRef.current = selectedIds;
  }, [selectedIds]);

  // Initialize Canvas and Subscribe to Real-Time Updates
  useCanvasInitialization(
    currentUser,
    setShapes,
    setLoading,
    setDragPositions,
    setSelectionDrags,
    setLocalUpdates,
    shapeCounterRef,
    connectionStatus,
    setConnectionStatus,
    setIsReconnecting,
    setSelectedIds
  );

  // Shape CRUD Operations
  const {
    addShape,
    addShapesBatch,
    updateShape,
    updateShapesBatchLocal,
    clearLocalUpdates,
    deleteShape,
    deleteShapes,
  } = useShapeOperations(
    currentUser,
    shapes,
    shapeCounterRef,
    selectedIdsRef,
    setSelectedIds,
    setLocalUpdates
  );

  // Shape Locking
  const { lockShape, unlockShape } = useShapeLocking(currentUser);

  // Shape Selection
  const { selectShape, selectMultipleShapes } = useShapeSelection(
    currentUser,
    shapes,
    selectedIdsRef,
    setSelectedIds,
    lockShape,
    unlockShape
  );

  // Shape Reordering and Duplication
  const { reorderShapes, duplicateShapes } = useShapeReordering(
    currentUser,
    shapes,
    selectMultipleShapes
  );

  // Merge real-time drag positions with persistent shapes
  const shapesWithDragPositions = useDragSync(
    shapes,
    dragPositions,
    selectionDrags,
    localUpdates,
    currentUser
  );

  // Memoize the context value to prevent unnecessary re-renders
  const value: CanvasContextType = useMemo(
    () => ({
      shapes: shapesWithDragPositions,
      selectedIds,
      loading,
      currentTool,
      selectionRect,
      selectionDrags,
      isReconnecting,
      connectionStatus,
      addShape,
      addShapesBatch,
      updateShape,
      updateShapesBatchLocal,
      deleteShape,
      deleteShapes,
      selectShape,
      selectMultipleShapes,
      lockShape,
      unlockShape,
      reorderShapes,
      duplicateShapes,
      setCurrentTool,
      setSelectionRect,
      clearLocalUpdates,
    }),
    [
      shapesWithDragPositions,
      selectedIds,
      loading,
      currentTool,
      selectionRect,
      selectionDrags,
      isReconnecting,
      connectionStatus,
      addShape,
      addShapesBatch,
      updateShape,
      updateShapesBatchLocal,
      deleteShape,
      deleteShapes,
      selectShape,
      selectMultipleShapes,
      lockShape,
      unlockShape,
      reorderShapes,
      duplicateShapes,
      clearLocalUpdates,
    ]
  );

  return (
    <CanvasContext.Provider value={value}>{children}</CanvasContext.Provider>
  );
}

// Add displayName for Fast Refresh compatibility
CanvasProvider.displayName = 'CanvasProvider';

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
