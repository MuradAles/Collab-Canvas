/**
 * Application Constants
 * Defines all constant values used throughout the application
 */

// ============================================================================
// Canvas Dimensions
// ============================================================================

export const CANVAS_WIDTH = 5000;
export const CANVAS_HEIGHT = 5000;

// Default viewport dimensions (will be dynamic based on window size)
export const DEFAULT_VIEWPORT_WIDTH = 1200;
export const DEFAULT_VIEWPORT_HEIGHT = 800;

// ============================================================================
// Zoom Configuration
// ============================================================================

export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 3;
export const ZOOM_STEP = 0.1;
export const DEFAULT_ZOOM = 1;

// ============================================================================
// Shape Defaults
// ============================================================================

export const DEFAULT_SHAPE_FILL = '#cccccc';
export const DEFAULT_SHAPE_WIDTH = 100;
export const DEFAULT_SHAPE_HEIGHT = 100;
export const MIN_SHAPE_SIZE = 10;

// Selection styling
export const SELECTION_STROKE = '#1976d2';
export const SELECTION_STROKE_WIDTH = 2;

// Lock styling
export const LOCKED_STROKE = '#f44336';
export const LOCKED_STROKE_WIDTH = 3;

// ============================================================================
// Canvas & Database IDs
// ============================================================================

export const GLOBAL_CANVAS_ID = 'global-canvas-v1';

// ============================================================================
// Real-Time Update Configuration
// ============================================================================

// Cursor update throttle (in milliseconds)
export const CURSOR_UPDATE_THROTTLE = 50; // 20 FPS
export const CURSOR_UPDATE_THRESHOLD = 2; // Minimum pixel movement to trigger update

// Lock timeout (in milliseconds)
export const LOCK_TIMEOUT = 5000; // 5 seconds

// ============================================================================
// Cursor Colors Palette
// ============================================================================

export const CURSOR_COLORS = [
  '#FF5733', // Red-Orange
  '#33C1FF', // Light Blue
  '#28A745', // Green
  '#FFC107', // Amber
  '#9C27B0', // Purple
  '#FF6B9D', // Pink
  '#00BCD4', // Cyan
  '#FF9800', // Orange
  '#4CAF50', // Green (lighter)
  '#E91E63', // Pink (darker)
];

// ============================================================================
// Performance Configuration
// ============================================================================

export const TARGET_FPS = 60;
export const MAX_SHAPES = 500; // Performance target for MVP

