/**
 * Application Constants
 * Defines all constant values used throughout the application
 */

// ============================================================================
// Canvas Dimensions
// ============================================================================

// Endless Canvas: 25,000 x 25,000 pixels (0 to 25k)
export const CANVAS_WIDTH = 25000;
export const CANVAS_HEIGHT = 25000;

// Canvas bounds for shape positioning (all positive for simplicity)
export const CANVAS_BOUNDS = {
  MIN_X: 0,
  MAX_X: 25000,
  MIN_Y: 0,
  MAX_Y: 25000,
  WIDTH: 25000,
  HEIGHT: 25000,
  CENTER_X: 12500,
  CENTER_Y: 12500,
};

// Default viewport dimensions (will be dynamic based on window size)
export const DEFAULT_VIEWPORT_WIDTH = 1400;
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

export const DEFAULT_SHAPE_FILL = '#e0e0e0';
export const DEFAULT_SHAPE_STROKE = '#000000';
export const DEFAULT_SHAPE_STROKE_WIDTH = 2;
export const DEFAULT_SHAPE_WIDTH = 100;
export const DEFAULT_SHAPE_HEIGHT = 100;
export const DEFAULT_SHAPE_RADIUS = 50;
export const DEFAULT_CORNER_RADIUS = 0;
export const MIN_SHAPE_SIZE = 10;

// Text defaults
export const DEFAULT_TEXT_CONTENT = 'Text';
export const DEFAULT_TEXT_SIZE = 16;
export const DEFAULT_TEXT_FONT = 'Arial';
export const DEFAULT_TEXT_FILL = '#000000';

// Selection styling
export const SELECTION_STROKE = '#0066ff';
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

// Multi-shape drag optimization threshold
// When dragging this many or more shapes, use selection drag (delta-based)
// instead of individual shape updates for better performance
export const MULTI_DRAG_THRESHOLD = 2; // Changed from 10 to 2 - optimize all multi-drags

// Firebase update throttle (in milliseconds)
// Throttle Firebase writes to 60 FPS (16.67ms) for efficiency
// Local Konva updates remain at native RAF speed (60-240 FPS depending on monitor)
export const FIREBASE_THROTTLE_MS = 16.67; // 60 FPS

