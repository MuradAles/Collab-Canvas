/**
 * CanvasContext Tests
 * Tests for canvas state management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { CanvasProvider, useCanvasContext } from '../../../src/contexts/CanvasContext';
import { AuthProvider } from '../../../src/contexts/AuthContext';

// Mock state to simulate Firestore
let mockShapes: any[] = [];
let mockSubscriptionCallback: ((shapes: any[]) => void) | null = null;

// Mock Firebase services
vi.mock('../../../src/services/canvas', () => ({
  initializeCanvas: vi.fn(() => Promise.resolve()),
  subscribeToShapes: vi.fn((callback) => {
    // Store callback to simulate real-time updates
    mockSubscriptionCallback = callback;
    // Call callback with current shapes
    callback(mockShapes);
    // Return unsubscribe function
    return () => {
      mockSubscriptionCallback = null;
    };
  }),
  createShape: vi.fn((shape) => {
    // Add shape to mock state
    mockShapes = [...mockShapes, shape];
    // Trigger subscription callback
    if (mockSubscriptionCallback) {
      mockSubscriptionCallback(mockShapes);
    }
    return Promise.resolve();
  }),
  updateShape: vi.fn((id, updates) => {
    // Update shape in mock state
    mockShapes = mockShapes.map(s => s.id === id ? { ...s, ...updates } : s);
    // Trigger subscription callback
    if (mockSubscriptionCallback) {
      mockSubscriptionCallback(mockShapes);
    }
    return Promise.resolve();
  }),
  deleteShape: vi.fn((id) => {
    // Remove shape from mock state
    mockShapes = mockShapes.filter(s => s.id !== id);
    // Trigger subscription callback
    if (mockSubscriptionCallback) {
      mockSubscriptionCallback(mockShapes);
    }
    return Promise.resolve();
  }),
  lockShape: vi.fn((id, userId, userName) => {
    // Update lock state in mock
    mockShapes = mockShapes.map(s => 
      s.id === id ? { ...s, isLocked: true, lockedBy: userId, lockedByName: userName } : s
    );
    // Trigger subscription callback
    if (mockSubscriptionCallback) {
      mockSubscriptionCallback(mockShapes);
    }
    return Promise.resolve();
  }),
  unlockShape: vi.fn((id) => {
    // Update lock state in mock
    mockShapes = mockShapes.map(s => 
      s.id === id ? { ...s, isLocked: false, lockedBy: null, lockedByName: null } : s
    );
    // Trigger subscription callback
    if (mockSubscriptionCallback) {
      mockSubscriptionCallback(mockShapes);
    }
    return Promise.resolve();
  }),
  cleanupUserLocks: vi.fn(() => Promise.resolve()),
}));

// Mock Presence service
vi.mock('../../../src/services/presence', () => ({
  setUserOnline: vi.fn(() => Promise.resolve()),
  setUserOffline: vi.fn(() => Promise.resolve()),
  subscribeToPresence: vi.fn((callback) => {
    // Call callback with empty array initially
    callback([]);
    // Return unsubscribe function
    return () => {};
  }),
}));

// Mock Drag Sync service  
vi.mock('../../../src/services/dragSync', () => ({
  updateDragPosition: vi.fn(() => Promise.resolve()),
  clearDragPosition: vi.fn(() => Promise.resolve()),
  subscribeToDragPositions: vi.fn((canvasId, callback) => {
    // Call callback with empty Map initially
    callback(new Map());
    // Return unsubscribe function
    return () => {};
  }),
}));

// Mock Firebase Auth
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn((auth, callback) => {
    // Simulate logged in user
    callback({ uid: 'test-user', email: 'test@example.com', displayName: 'Test User' });
    return () => {};
  }),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  updateProfile: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
}));

// Wrapper component for testing - wraps in both Auth and Canvas providers
function wrapper({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CanvasProvider>{children}</CanvasProvider>
    </AuthProvider>
  );
}

describe('CanvasContext', () => {
  // Reset mock state before each test
  beforeEach(() => {
    mockShapes = [];
    mockSubscriptionCallback = null;
  });

  describe('Initial State', () => {
    it('should provide initial empty shapes array', async () => {
      const { result } = renderHook(() => useCanvasContext(), { wrapper });
      
      // Wait for subscription to complete (loading becomes false)
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      expect(result.current.shapes).toEqual([]);
      expect(result.current.selectedId).toBeNull();
      // Loading should be false after subscription completes
      expect(result.current.loading).toBe(false);
    });

    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = () => {};

      expect(() => {
        renderHook(() => useCanvasContext());
      }).toThrow('useCanvasContext must be used within CanvasProvider');

      console.error = originalError;
    });
  });

  describe('Shape Management', () => {
    it('should add a new shape', async () => {
      const { result } = renderHook(() => useCanvasContext(), { wrapper });

      const shapeData = {
        type: 'rectangle' as const,
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        fill: '#cccccc',
      };

      await act(async () => {
        await result.current.addShape(shapeData);
      });

      expect(result.current.shapes).toHaveLength(1);
      expect(result.current.shapes[0]).toMatchObject(shapeData);
      expect(result.current.shapes[0].id).toBeDefined();
      expect(result.current.shapes[0].isLocked).toBe(false);
      expect(result.current.shapes[0].lockedBy).toBeNull();
      expect(result.current.shapes[0].lockedByName).toBeNull();
    });

    it('should add multiple shapes', async () => {
      const { result } = renderHook(() => useCanvasContext(), { wrapper });

      await act(async () => {
        await result.current.addShape({
          type: 'rectangle',
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          fill: '#cccccc',
        });
        await result.current.addShape({
          type: 'rectangle',
          x: 200,
          y: 200,
          width: 100,
          height: 100,
          fill: '#cccccc',
        });
      });

      expect(result.current.shapes).toHaveLength(2);
    });

    it('should update an existing shape', async () => {
      const { result } = renderHook(() => useCanvasContext(), { wrapper });

      // Add a shape first
      await act(async () => {
        await result.current.addShape({
          type: 'rectangle',
          x: 100,
          y: 100,
          width: 200,
          height: 150,
          fill: '#cccccc',
        });
      });

      const shapeId = result.current.shapes[0].id;

      // Update the shape
      await act(async () => {
        await result.current.updateShape(shapeId, {
          x: 300,
          y: 300,
        });
      });

      expect(result.current.shapes[0].x).toBe(300);
      expect(result.current.shapes[0].y).toBe(300);
      expect(result.current.shapes[0].width).toBe(200); // Should remain unchanged
      expect(result.current.shapes[0].height).toBe(150); // Should remain unchanged
    });

    it('should delete a shape', async () => {
      const { result } = renderHook(() => useCanvasContext(), { wrapper });

      // Add a shape first
      await act(async () => {
        await result.current.addShape({
          type: 'rectangle',
          x: 100,
          y: 100,
          width: 200,
          height: 150,
          fill: '#cccccc',
        });
      });

      const shapeId = result.current.shapes[0].id;
      expect(result.current.shapes).toHaveLength(1);

      // Delete the shape
      await act(async () => {
        await result.current.deleteShape(shapeId);
      });

      expect(result.current.shapes).toHaveLength(0);
    });

    it('should deselect shape when deleted', async () => {
      const { result } = renderHook(() => useCanvasContext(), { wrapper });

      // Add and select a shape
      await act(async () => {
        await result.current.addShape({
          type: 'rectangle',
          x: 100,
          y: 100,
          width: 200,
          height: 150,
          fill: '#cccccc',
        });
      });

      const shapeId = result.current.shapes[0].id;

      act(() => {
        result.current.selectShape(shapeId);
      });

      expect(result.current.selectedId).toBe(shapeId);

      // Delete the shape
      await act(async () => {
        await result.current.deleteShape(shapeId);
      });

      expect(result.current.selectedId).toBeNull();
    });
  });

  describe('Selection Management', () => {
    it('should select a shape', async () => {
      const { result } = renderHook(() => useCanvasContext(), { wrapper });

      await act(async () => {
        await result.current.addShape({
          type: 'rectangle',
          x: 100,
          y: 100,
          width: 200,
          height: 150,
          fill: '#cccccc',
        });
      });

      const shapeId = result.current.shapes[0].id;

      act(() => {
        result.current.selectShape(shapeId);
      });

      expect(result.current.selectedId).toBe(shapeId);
    });

    it('should deselect a shape', async () => {
      const { result } = renderHook(() => useCanvasContext(), { wrapper });

      await act(async () => {
        await result.current.addShape({
          type: 'rectangle',
          x: 100,
          y: 100,
          width: 200,
          height: 150,
          fill: '#cccccc',
        });
      });

      const shapeId = result.current.shapes[0].id;

      act(() => {
        result.current.selectShape(shapeId);
      });

      expect(result.current.selectedId).toBe(shapeId);

      act(() => {
        result.current.selectShape(null);
      });

      expect(result.current.selectedId).toBeNull();
    });
  });

  describe('Lock Management', () => {
    it('should lock a shape', async () => {
      const { result } = renderHook(() => useCanvasContext(), { wrapper });

      await act(async () => {
        await result.current.addShape({
          type: 'rectangle',
          x: 100,
          y: 100,
          width: 200,
          height: 150,
          fill: '#cccccc',
        });
      });

      const shapeId = result.current.shapes[0].id;

      await act(async () => {
        await result.current.lockShape(shapeId, 'user123', 'John Doe');
      });

      expect(result.current.shapes[0].isLocked).toBe(true);
      expect(result.current.shapes[0].lockedBy).toBe('user123');
      expect(result.current.shapes[0].lockedByName).toBe('John Doe');
    });

    it('should unlock a shape', async () => {
      const { result } = renderHook(() => useCanvasContext(), { wrapper });

      await act(async () => {
        await result.current.addShape({
          type: 'rectangle',
          x: 100,
          y: 100,
          width: 200,
          height: 150,
          fill: '#cccccc',
        });
      });

      const shapeId = result.current.shapes[0].id;

      // Lock first
      await act(async () => {
        await result.current.lockShape(shapeId, 'user123', 'John Doe');
      });

      expect(result.current.shapes[0].isLocked).toBe(true);

      // Then unlock
      await act(async () => {
        await result.current.unlockShape(shapeId);
      });

      expect(result.current.shapes[0].isLocked).toBe(false);
      expect(result.current.shapes[0].lockedBy).toBeNull();
      expect(result.current.shapes[0].lockedByName).toBeNull();
    });
  });
});

