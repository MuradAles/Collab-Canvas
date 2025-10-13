/**
 * CollabCanvas TypeScript Type Definitions
 * Defines all core types used throughout the application
 */

// ============================================================================
// Shape Types
// ============================================================================

export type ShapeType = 'rectangle' | 'circle' | 'text';
export type StrokePosition = 'inside' | 'center' | 'outside';

export interface BaseShape {
  id: string;
  type: ShapeType;
  name: string;
  x: number;
  y: number;
  isLocked: boolean;
  lockedBy: string | null;
  lockedByName: string | null;
}

export interface RectangleShape extends BaseShape {
  type: 'rectangle';
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  strokePosition: StrokePosition;
  cornerRadius: number;
}

export interface CircleShape extends BaseShape {
  type: 'circle';
  radius: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  strokePosition: StrokePosition;
}

export interface TextShape extends BaseShape {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  fill: string;
  width?: number;
}

export type Shape = RectangleShape | CircleShape | TextShape;

export interface ShapeUpdate {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  radius?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokePosition?: StrokePosition;
  cornerRadius?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  name?: string;
  isLocked?: boolean;
  lockedBy?: string | null;
  lockedByName?: string | null;
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
  selectedId: string | null;
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

export interface CanvasContextType {
  shapes: Shape[];
  selectedId: string | null;
  loading: boolean;
  addShape: (shape: Omit<Shape, 'id' | 'name' | 'isLocked' | 'lockedBy' | 'lockedByName'>) => Promise<void>;
  updateShape: (id: string, updates: ShapeUpdate) => Promise<void>;
  deleteShape: (id: string) => Promise<void>;
  selectShape: (id: string | null) => void;
  lockShape: (id: string, userId: string, userName: string) => Promise<void>;
  unlockShape: (id: string) => Promise<void>;
  reorderShapes: (newOrder: Shape[]) => void;
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

export interface ViewportState {
  scale: number;
  x: number;
  y: number;
}

