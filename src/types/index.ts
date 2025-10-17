/**
 * CollabCanvas TypeScript Type Definitions
 * Defines all core types used throughout the application
 */

// ============================================================================
// Shape Types
// ============================================================================

export type ShapeType = 'rectangle' | 'circle' | 'text' | 'line';
export type Tool = 'select' | 'rectangle' | 'circle' | 'text' | 'line';

export interface BaseShape {
  id: string;
  type: ShapeType;
  name: string;
  x: number;
  y: number;
  rotation: number;
  zIndex: number; // For layer ordering
  isLocked: boolean;
  lockedBy: string | null;
  lockedByName: string | null;
  isDragging?: boolean;
  draggingBy?: string | null;
  draggingByName?: string | null;
}

export interface RectangleShape extends BaseShape {
  type: 'rectangle';
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  cornerRadius: number;
}

export interface CircleShape extends BaseShape {
  type: 'circle';
  radius: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export interface TextShape extends BaseShape {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  fill: string;
  width?: number;
  fontStyle?: string; // 'normal', 'bold', 'italic', 'bold italic'
  textDecoration?: string; // 'none', 'underline'
}

export interface LineShape extends Omit<BaseShape, 'x' | 'y' | 'rotation'> {
  type: 'line';
  // Line endpoints - stored as absolute coordinates
  // Lines don't use x, y, or rotation - they're defined entirely by endpoints
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke: string;
  strokeWidth: number;
  lineCap: 'butt' | 'round' | 'square';
}

export type Shape = RectangleShape | CircleShape | TextShape | LineShape;

export interface ShapeUpdate {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  radius?: number;
  rotation?: number;
  zIndex?: number; // For layer ordering
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: string;
  textDecoration?: string;
  name?: string;
  isLocked?: boolean;
  lockedBy?: string | null;
  lockedByName?: string | null;
  isDragging?: boolean;
  draggingBy?: string | null;
  draggingByName?: string | null;
  // Line-specific properties
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  lineCap?: 'butt' | 'round' | 'square';
}

// ============================================================================
// Canvas Types
// ============================================================================

export interface CanvasDocument {
  canvasId: string;
  shapes: Shape[];
  lastUpdated: number;
}

export interface CanvasState {
  shapes: Shape[];
  selectedIds: string[];
  loading: boolean;
}

// ============================================================================
// User & Authentication Types
// ============================================================================

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

// ============================================================================
// Cursor & Presence Types
// ============================================================================

export interface CursorData {
  userId: string;
  displayName: string;
  cursorColor: string;
  cursorX: number; // Canvas-relative coordinates
  cursorY: number; // Canvas-relative coordinates
  lastSeen: number;
}

export interface PresenceData {
  userId: string;
  displayName: string;
  cursorColor: string;
  lastSeen: number;
  isOnline: boolean;
}

export interface CursorsMap {
  [userId: string]: CursorData;
}

export interface PresenceMap {
  [userId: string]: PresenceData;
}

// ============================================================================
// Canvas Context Types
// ============================================================================

export interface OnlineUser {
  uid: string;
  displayName: string;
  color: string;
  cursorX: number;
  cursorY: number;
  lastSeen: number | object;
  isOnline: boolean;
}

export interface CanvasContextType {
  shapes: Shape[];
  selectedIds: string[];
  loading: boolean;
  currentTool: Tool;
  selectionRect: SelectionRect | null;
  addShape: (shape: Omit<Shape, 'id' | 'name' | 'isLocked' | 'lockedBy' | 'lockedByName'>) => Promise<void>;
  updateShape: (id: string, updates: ShapeUpdate, localOnly?: boolean) => Promise<void>;
  deleteShape: (id: string) => Promise<void>;
  deleteShapes: (shapeIds: string[]) => Promise<void>;
  selectShape: (id: string | null, addToSelection?: boolean) => void;
  selectMultipleShapes: (ids: string[], addToSelection?: boolean) => Promise<void>;
  lockShape: (id: string, userId: string, userName: string) => Promise<void>;
  unlockShape: (id: string) => Promise<void>;
  reorderShapes: (newOrder: Shape[]) => void;
  duplicateShapes: (shapeIds: string[]) => Promise<string[]>;
  setCurrentTool: (tool: Tool) => void;
  setSelectionRect: (rect: SelectionRect | null) => void;
  clearLocalUpdates: (shapeIds: string[]) => void;
}

// ============================================================================
// Utility Types
// ============================================================================

export interface Point {
  x: number;
  y: number;
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ViewportState {
  scale: number;
  x: number;
  y: number;
}

