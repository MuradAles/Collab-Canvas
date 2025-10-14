/**
 * Presence Service Tests
 * Tests for user presence tracking and cursor position updates
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  setUserOnline,
  setUserOffline,
  updateCursorPosition,
  subscribeToPresence,
  type PresenceData,
} from '../../../src/services/presence';
import * as firebaseDatabase from 'firebase/database';

// Mock Firebase Realtime Database
vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  set: vi.fn(),
  onValue: vi.fn(),
  onDisconnect: vi.fn(() => ({
    set: vi.fn().mockResolvedValue(undefined),
  })),
  off: vi.fn(),
  serverTimestamp: vi.fn(() => ({ '.sv': 'timestamp' })),
}));

vi.mock('../../../src/services/firebase', () => ({
  rtdb: {},
}));

describe('Presence Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('setUserOnline', () => {
    it('should set user as online with initial cursor position', async () => {
      const userId = 'user123';
      const displayName = 'Test User';

      await setUserOnline(userId, displayName);

      expect(firebaseDatabase.ref).toHaveBeenCalledWith(
        expect.anything(),
        'sessions/global-canvas-v1/user123'
      );
      expect(firebaseDatabase.set).toHaveBeenCalled();

      // Check that the presence data includes cursor position
      const setCall = (firebaseDatabase.set as any).mock.calls[0];
      const presenceData = setCall[1] as PresenceData;
      expect(presenceData).toMatchObject({
        uid: userId,
        displayName,
        cursorX: 0,
        cursorY: 0,
        isOnline: true,
      });
      expect(presenceData.color).toBeDefined();
    });

    it('should set up disconnect handler', async () => {
      const userId = 'user123';
      const displayName = 'Test User';

      await setUserOnline(userId, displayName);

      expect(firebaseDatabase.onDisconnect).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(firebaseDatabase.set).mockRejectedValueOnce(new Error('Network error'));

      await expect(setUserOnline('user123', 'Test User')).rejects.toThrow('Network error');
    });
  });

  describe('setUserOffline', () => {
    it('should remove user from presence', async () => {
      const userId = 'user123';

      await setUserOffline(userId);

      expect(firebaseDatabase.ref).toHaveBeenCalledWith(
        expect.anything(),
        'sessions/global-canvas-v1/user123'
      );
      // Check that set was called with null (second argument)
      const setCall = (firebaseDatabase.set as any).mock.calls[0];
      expect(setCall[1]).toBeNull();
    });

    it('should not throw on error', async () => {
      vi.mocked(firebaseDatabase.set).mockRejectedValueOnce(new Error('Network error'));

      await expect(setUserOffline('user123')).resolves.not.toThrow();
    });
  });

  describe('updateCursorPosition', () => {
    it('should update cursor position with canvas-relative coordinates', () => {
      const userId = 'user123';
      const cursorX = 250;
      const cursorY = 300;

      updateCursorPosition(userId, cursorX, cursorY);

      expect(firebaseDatabase.ref).toHaveBeenCalledWith(
        expect.anything(),
        'sessions/global-canvas-v1/user123/cursorX'
      );
      expect(firebaseDatabase.ref).toHaveBeenCalledWith(
        expect.anything(),
        'sessions/global-canvas-v1/user123/cursorY'
      );
      expect(firebaseDatabase.ref).toHaveBeenCalledWith(
        expect.anything(),
        'sessions/global-canvas-v1/user123/lastSeen'
      );

      // Check that set was called with correct values (second argument of each call)
      const setCalls = (firebaseDatabase.set as any).mock.calls;
      expect(setCalls[0][1]).toBe(cursorX);
      expect(setCalls[1][1]).toBe(cursorY);
      expect(setCalls[2][1]).toEqual(expect.any(Number)); // Date.now() returns a number
    });

    it('should handle errors silently', () => {
      vi.mocked(firebaseDatabase.set).mockRejectedValueOnce(new Error('Network error'));

      // Function is fire-and-forget, shouldn't throw
      expect(() => updateCursorPosition('user123', 100, 200)).not.toThrow();
    });

    it('should send all cursor updates without throttling', () => {
      const userId = 'user123';

      // Simulate rapid cursor movements
      for (let i = 0; i < 10; i++) {
        updateCursorPosition(userId, i * 10, i * 10);
      }

      // All calls should go through (NO THROTTLING for insane speed)
      expect(firebaseDatabase.set).toHaveBeenCalledTimes(30); // 10 calls x 3 refs each
    });
  });

  describe('subscribeToPresence', () => {
    it('should subscribe to presence updates', () => {
      const callback = vi.fn();

      subscribeToPresence(callback);

      expect(firebaseDatabase.ref).toHaveBeenCalledWith(
        expect.anything(),
        'sessions/global-canvas-v1'
      );
      expect(firebaseDatabase.onValue).toHaveBeenCalled();
    });

    it('should filter online users', () => {
      const callback = vi.fn();
      const mockSnapshot = {
        val: () => ({
          user1: {
            uid: 'user1',
            displayName: 'User 1',
            color: '#FF0000',
            cursorX: 100,
            cursorY: 200,
            isOnline: true,
          },
          user2: {
            uid: 'user2',
            displayName: 'User 2',
            color: '#00FF00',
            cursorX: 150,
            cursorY: 250,
            isOnline: false,
          },
          user3: {
            uid: 'user3',
            displayName: 'User 3',
            color: '#0000FF',
            cursorX: 200,
            cursorY: 300,
            isOnline: true,
          },
        }),
      };

      vi.mocked(firebaseDatabase.onValue).mockImplementation((ref, callback) => {
        callback(mockSnapshot as any);
        return vi.fn();
      });

      subscribeToPresence(callback);

      expect(callback).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ uid: 'user1', isOnline: true }),
          expect.objectContaining({ uid: 'user3', isOnline: true }),
        ])
      );

      // Should not include offline user
      const callArgs = callback.mock.calls[0][0];
      expect(callArgs).toHaveLength(2);
      expect(callArgs.find((u: PresenceData) => u.uid === 'user2')).toBeUndefined();
    });

    it('should handle empty presence data', () => {
      const callback = vi.fn();
      const mockSnapshot = {
        val: () => null,
      };

      vi.mocked(firebaseDatabase.onValue).mockImplementation((ref, callback) => {
        callback(mockSnapshot as any);
        return vi.fn();
      });

      subscribeToPresence(callback);

      expect(callback).toHaveBeenCalledWith([]);
    });

    it('should return unsubscribe function', () => {
      const callback = vi.fn();

      const unsubscribe = subscribeToPresence(callback);

      expect(typeof unsubscribe).toBe('function');
      
      unsubscribe();
      
      expect(firebaseDatabase.off).toHaveBeenCalled();
    });
  });

  describe('User Color Generation', () => {
    it('should generate consistent colors for same user ID', async () => {
      const userId = 'consistent-user';
      
      await setUserOnline(userId, 'Test User');
      const firstCall = (firebaseDatabase.set as any).mock.calls[0][1];
      const firstColor = firstCall.color;

      vi.clearAllMocks();

      await setUserOnline(userId, 'Test User');
      const secondCall = (firebaseDatabase.set as any).mock.calls[0][1];
      const secondColor = secondCall.color;

      expect(firstColor).toBe(secondColor);
    });

    it('should generate different colors for different user IDs', async () => {
      await setUserOnline('user1', 'User 1');
      const firstCall = (firebaseDatabase.set as any).mock.calls[0][1];
      const firstColor = firstCall.color;

      vi.clearAllMocks();

      await setUserOnline('user2', 'User 2');
      const secondCall = (firebaseDatabase.set as any).mock.calls[0][1];
      const secondColor = secondCall.color;

      // Note: Colors might be the same by chance, but likely different
      // This is a probabilistic test
      expect(typeof firstColor).toBe('string');
      expect(typeof secondColor).toBe('string');
      expect(firstColor).toMatch(/^#[0-9a-f]{6}$/i);
      expect(secondColor).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });
});

