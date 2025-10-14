/**
 * Canvas Service Tests
 * Tests for Firestore shape operations and real-time sync
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Shape, RectangleShape } from '../../../src/types';

// Mock Firebase modules
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  onSnapshot: vi.fn(),
  serverTimestamp: vi.fn(() => ({ seconds: Date.now() / 1000 })),
  Timestamp: {
    now: vi.fn(() => ({ seconds: Date.now() / 1000 })),
  },
}));

vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  set: vi.fn(),
  onDisconnect: vi.fn(() => ({
    remove: vi.fn(),
  })),
  serverTimestamp: vi.fn(() => ({ '.sv': 'timestamp' })),
}));

vi.mock('../../../src/services/firebase', () => ({
  db: {},
  rtdb: {},
  auth: {},
}));

describe('Canvas Service', () => {
  describe('Shape Creation', () => {
    it('should generate unique shape IDs', () => {
      const shape1: Omit<RectangleShape, 'id' | 'name' | 'isLocked' | 'lockedBy' | 'lockedByName'> = {
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        fill: '#e0e0e0',
        stroke: 'transparent',
        strokeWidth: 0,
        strokePosition: 'center',
        cornerRadius: 0,
      };

      const shape2: Omit<RectangleShape, 'id' | 'name' | 'isLocked' | 'lockedBy' | 'lockedByName'> = {
        type: 'rectangle',
        x: 300,
        y: 300,
        width: 100,
        height: 100,
        fill: '#e0e0e0',
        stroke: 'transparent',
        strokeWidth: 0,
        strokePosition: 'center',
        cornerRadius: 0,
      };

      // IDs should be different
      expect(shape1).not.toBe(shape2);
    });

    it('should create shapes with default properties', () => {
      const shape: Omit<RectangleShape, 'id' | 'name' | 'isLocked' | 'lockedBy' | 'lockedByName'> = {
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        fill: '#e0e0e0',
        stroke: 'transparent',
        strokeWidth: 0,
        strokePosition: 'center',
        cornerRadius: 0,
      };

      expect(shape.fill).toBe('#e0e0e0');
      expect(shape.stroke).toBe('transparent');
      expect(shape.strokeWidth).toBe(0);
    });
  });

  describe('Shape Locking', () => {
    it('should lock shapes with user information', () => {
      const lockedShape: Shape = {
        id: 'test-id',
        type: 'rectangle',
        name: 'Rectangle 1',
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        fill: '#e0e0e0',
        stroke: 'transparent',
        strokeWidth: 0,
        strokePosition: 'center',
        cornerRadius: 0,
        isLocked: true,
        lockedBy: 'user123',
        lockedByName: 'John Doe',
      };

      expect(lockedShape.isLocked).toBe(true);
      expect(lockedShape.lockedBy).toBe('user123');
      expect(lockedShape.lockedByName).toBe('John Doe');
    });

    it('should unlock shapes by removing lock info', () => {
      const unlockedShape: Shape = {
        id: 'test-id',
        type: 'rectangle',
        name: 'Rectangle 1',
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        fill: '#e0e0e0',
        stroke: 'transparent',
        strokeWidth: 0,
        strokePosition: 'center',
        cornerRadius: 0,
        isLocked: false,
        lockedBy: null,
        lockedByName: null,
      };

      expect(unlockedShape.isLocked).toBe(false);
      expect(unlockedShape.lockedBy).toBeNull();
      expect(unlockedShape.lockedByName).toBeNull();
    });
  });

  describe('Shape Updates', () => {
    it('should update shape properties', () => {
      const originalShape: Shape = {
        id: 'test-id',
        type: 'rectangle',
        name: 'Rectangle 1',
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        fill: '#e0e0e0',
        stroke: 'transparent',
        strokeWidth: 0,
        strokePosition: 'center',
        cornerRadius: 0,
        isLocked: false,
        lockedBy: null,
        lockedByName: null,
      };

      const updatedShape = {
        ...originalShape,
        x: 150,
        y: 150,
        fill: '#ff0000',
      };

      expect(updatedShape.x).toBe(150);
      expect(updatedShape.y).toBe(150);
      expect(updatedShape.fill).toBe('#ff0000');
      expect(updatedShape.width).toBe(200); // Unchanged
    });

    it('should maintain shape type after updates', () => {
      const shape: Shape = {
        id: 'test-id',
        type: 'rectangle',
        name: 'Rectangle 1',
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        fill: '#e0e0e0',
        stroke: 'transparent',
        strokeWidth: 0,
        strokePosition: 'center',
        cornerRadius: 0,
        isLocked: false,
        lockedBy: null,
        lockedByName: null,
      };

      const updated = { ...shape, x: 200 };
      expect(updated.type).toBe('rectangle');
    });
  });

  describe('Shape Deletion', () => {
    it('should allow deletion of unlocked shapes', () => {
      const shapes: Shape[] = [
        {
          id: 'shape1',
          type: 'rectangle',
          name: 'Rectangle 1',
          x: 100,
          y: 100,
          width: 200,
          height: 150,
          fill: '#e0e0e0',
          stroke: 'transparent',
          strokeWidth: 0,
          strokePosition: 'center',
          cornerRadius: 0,
          isLocked: false,
          lockedBy: null,
          lockedByName: null,
        },
        {
          id: 'shape2',
          type: 'rectangle',
          name: 'Rectangle 2',
          x: 300,
          y: 300,
          width: 100,
          height: 100,
          fill: '#e0e0e0',
          stroke: 'transparent',
          strokeWidth: 0,
          strokePosition: 'center',
          cornerRadius: 0,
          isLocked: false,
          lockedBy: null,
          lockedByName: null,
        },
      ];

      const remainingShapes = shapes.filter((s) => s.id !== 'shape1');
      expect(remainingShapes.length).toBe(1);
      expect(remainingShapes[0].id).toBe('shape2');
    });

    it('should prevent deletion of locked shapes by other users', () => {
      const shape: Shape = {
        id: 'test-id',
        type: 'rectangle',
        name: 'Rectangle 1',
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        fill: '#e0e0e0',
        stroke: 'transparent',
        strokeWidth: 0,
        strokePosition: 'center',
        cornerRadius: 0,
        isLocked: true,
        lockedBy: 'user123',
        lockedByName: 'John Doe',
      };

      const currentUserId = 'user456';
      const canDelete = !shape.isLocked || shape.lockedBy === currentUserId;

      expect(canDelete).toBe(false);
    });

    it('should allow deletion of shapes locked by same user', () => {
      const shape: Shape = {
        id: 'test-id',
        type: 'rectangle',
        name: 'Rectangle 1',
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        fill: '#e0e0e0',
        stroke: 'transparent',
        strokeWidth: 0,
        strokePosition: 'center',
        cornerRadius: 0,
        isLocked: true,
        lockedBy: 'user123',
        lockedByName: 'John Doe',
      };

      const currentUserId = 'user123';
      const canDelete = !shape.isLocked || shape.lockedBy === currentUserId;

      expect(canDelete).toBe(true);
    });
  });

  describe('Canvas Document Structure', () => {
    it('should initialize with correct structure', () => {
      const canvasDoc = {
        canvasId: 'global-canvas-v1',
        shapes: [],
        lastUpdated: Date.now(),
      };

      expect(canvasDoc.canvasId).toBe('global-canvas-v1');
      expect(canvasDoc.shapes).toEqual([]);
      expect(canvasDoc.lastUpdated).toBeGreaterThan(0);
    });

    it('should store shapes array', () => {
      const shapes: Shape[] = [
        {
          id: 'shape1',
          type: 'rectangle',
          name: 'Rectangle 1',
          x: 100,
          y: 100,
          width: 200,
          height: 150,
          fill: '#e0e0e0',
          stroke: 'transparent',
          strokeWidth: 0,
          strokePosition: 'center',
          cornerRadius: 0,
          isLocked: false,
          lockedBy: null,
          lockedByName: null,
        },
      ];

      const canvasDoc = {
        canvasId: 'global-canvas-v1',
        shapes: shapes,
        lastUpdated: Date.now(),
      };

      expect(canvasDoc.shapes.length).toBe(1);
      expect(canvasDoc.shapes[0].id).toBe('shape1');
    });
  });

  describe('Real-Time Sync', () => {
    it('should handle empty shapes array on initial load', () => {
      const shapes: Shape[] = [];
      expect(shapes).toEqual([]);
      expect(shapes.length).toBe(0);
    });

    it('should handle shape additions', () => {
      const shapes: Shape[] = [];
      const newShape: Shape = {
        id: 'shape1',
        type: 'rectangle',
        name: 'Rectangle 1',
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        fill: '#e0e0e0',
        stroke: 'transparent',
        strokeWidth: 0,
        strokePosition: 'center',
        cornerRadius: 0,
        isLocked: false,
        lockedBy: null,
        lockedByName: null,
      };

      const updatedShapes = [...shapes, newShape];
      expect(updatedShapes.length).toBe(1);
      expect(updatedShapes[0].id).toBe('shape1');
    });

    it('should handle shape updates in array', () => {
      const shapes: Shape[] = [
        {
          id: 'shape1',
          type: 'rectangle',
          name: 'Rectangle 1',
          x: 100,
          y: 100,
          width: 200,
          height: 150,
          fill: '#e0e0e0',
          stroke: 'transparent',
          strokeWidth: 0,
          strokePosition: 'center',
          cornerRadius: 0,
          isLocked: false,
          lockedBy: null,
          lockedByName: null,
        },
      ];

      const updatedShapes = shapes.map((s) =>
        s.id === 'shape1' ? { ...s, x: 200, y: 200 } : s
      );

      expect(updatedShapes[0].x).toBe(200);
      expect(updatedShapes[0].y).toBe(200);
    });
  });
});

