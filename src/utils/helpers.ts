/**
 * Utility Helper Functions
 * Provides common utility functions used throughout the application
 */

import { CURSOR_COLORS } from './constants';
import type { Point, Bounds } from '../types';

// ============================================================================
// User & Display Name Helpers
// ============================================================================

/**
 * Extracts display name from email (prefix before @)
 */
export function getDisplayNameFromEmail(email: string): string {
  return email.split('@')[0];
}

/**
 * Truncates display name to maximum length
 */
export function truncateDisplayName(name: string, maxLength: number = 20): string {
  if (name.length <= maxLength) return name;
  return `${name.substring(0, maxLength - 3)}...`;
}

/**
 * Generates a consistent user color based on user ID
 */
export function generateUserColor(userId: string): string {
  // Use a simple hash of the userId to pick a color
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % CURSOR_COLORS.length;
  return CURSOR_COLORS[index];
}

// ============================================================================
// Coordinate & Geometry Helpers
// ============================================================================

/**
 * Converts screen coordinates to canvas coordinates
 * Accounts for stage position and scale
 */
export function screenToCanvas(
  screenX: number,
  screenY: number,
  stageX: number,
  stageY: number,
  scale: number
): Point {
  return {
    x: (screenX - stageX) / scale,
    y: (screenY - stageY) / scale,
  };
}

/**
 * Converts canvas coordinates to screen coordinates
 */
export function canvasToScreen(
  canvasX: number,
  canvasY: number,
  stageX: number,
  stageY: number,
  scale: number
): Point {
  return {
    x: canvasX * scale + stageX,
    y: canvasY * scale + stageY,
  };
}

/**
 * Constrains a point within bounds
 */
export function constrainPoint(point: Point, bounds: Bounds): Point {
  return {
    x: Math.max(bounds.minX, Math.min(bounds.maxX, point.x)),
    y: Math.max(bounds.minY, Math.min(bounds.maxY, point.y)),
  };
}

/**
 * Constrains a rectangle within bounds
 */
export function constrainRectangle(
  x: number,
  y: number,
  width: number,
  height: number,
  bounds: Bounds
): { x: number; y: number } {
  const constrainedX = Math.max(bounds.minX, Math.min(bounds.maxX - width, x));
  const constrainedY = Math.max(bounds.minY, Math.min(bounds.maxY - height, y));
  return { x: constrainedX, y: constrainedY };
}

// ============================================================================
// ID Generation
// ============================================================================

/**
 * Generates a unique ID for shapes
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// Throttle Function
// ============================================================================

/**
 * Throttles a function to execute at most once per specified time interval
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// ============================================================================
// Distance Calculation
// ============================================================================

/**
 * Calculates Euclidean distance between two points
 */
export function distance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

// ============================================================================
// Rectangle Helpers
// ============================================================================

/**
 * Normalizes rectangle coordinates (handles negative width/height from drag)
 */
export function normalizeRectangle(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): { x: number; y: number; width: number; height: number } {
  return {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1),
  };
}

// ============================================================================
// Intersection Detection for Box Selection
// ============================================================================

/**
 * Checks if two rectangles intersect
 */
export function rectanglesIntersect(
  rect1: { x: number; y: number; width: number; height: number },
  rect2: { x: number; y: number; width: number; height: number }
): boolean {
  return !(
    rect1.x > rect2.x + rect2.width ||
    rect1.x + rect1.width < rect2.x ||
    rect1.y > rect2.y + rect2.height ||
    rect1.y + rect1.height < rect2.y
  );
}

/**
 * Checks if a circle intersects with a rectangle
 */
export function circleIntersectsRect(
  circle: { x: number; y: number; radius: number },
  rect: { x: number; y: number; width: number; height: number }
): boolean {
  // Find the closest point on the rectangle to the circle
  const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));

  // Calculate distance between circle center and closest point
  const distanceX = circle.x - closestX;
  const distanceY = circle.y - closestY;
  const distanceSquared = distanceX * distanceX + distanceY * distanceY;

  // Check if distance is less than radius
  return distanceSquared <= circle.radius * circle.radius;
}

/**
 * Checks if a line segment intersects with a rectangle
 */
export function lineIntersectsRect(
  line: { x1: number; y1: number; x2: number; y2: number },
  rect: { x: number; y: number; width: number; height: number }
): boolean {
  // Check if either endpoint is inside the rectangle
  if (
    pointInRect({ x: line.x1, y: line.y1 }, rect) ||
    pointInRect({ x: line.x2, y: line.y2 }, rect)
  ) {
    return true;
  }

  // Check if line intersects any of the four rectangle edges
  const rectRight = rect.x + rect.width;
  const rectBottom = rect.y + rect.height;

  // Top edge
  if (lineSegmentsIntersect(line.x1, line.y1, line.x2, line.y2, rect.x, rect.y, rectRight, rect.y)) {
    return true;
  }
  // Right edge
  if (lineSegmentsIntersect(line.x1, line.y1, line.x2, line.y2, rectRight, rect.y, rectRight, rectBottom)) {
    return true;
  }
  // Bottom edge
  if (lineSegmentsIntersect(line.x1, line.y1, line.x2, line.y2, rect.x, rectBottom, rectRight, rectBottom)) {
    return true;
  }
  // Left edge
  if (lineSegmentsIntersect(line.x1, line.y1, line.x2, line.y2, rect.x, rect.y, rect.x, rectBottom)) {
    return true;
  }

  return false;
}

/**
 * Checks if a point is inside a rectangle
 */
function pointInRect(
  point: { x: number; y: number },
  rect: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

/**
 * Checks if two line segments intersect
 */
function lineSegmentsIntersect(
  x1: number, y1: number, x2: number, y2: number,
  x3: number, y3: number, x4: number, y4: number
): boolean {
  const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  
  if (denominator === 0) {
    // Lines are parallel
    return false;
  }

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denominator;

  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

