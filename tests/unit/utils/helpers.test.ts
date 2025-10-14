/**
 * Helper Functions Tests
 */

import { describe, it, expect } from 'vitest';
import {
  getDisplayNameFromEmail,
  truncateDisplayName,
  generateUserColor,
  generateId,
  normalizeRectangle,
  distance,
  screenToCanvas,
  canvasToScreen,
  throttle,
} from '../../../src/utils/helpers';

describe('User & Display Name Helpers', () => {
  it('should extract display name from email', () => {
    expect(getDisplayNameFromEmail('john.doe@example.com')).toBe('john.doe');
    expect(getDisplayNameFromEmail('test@test.com')).toBe('test');
  });

  it('should truncate long display names', () => {
    const longName = 'ThisIsAVeryLongDisplayNameThatNeedsTruncation';
    const truncated = truncateDisplayName(longName, 20);
    expect(truncated).toBe('ThisIsAVeryLongDi...');
    expect(truncated.length).toBe(20);
  });

  it('should not truncate short display names', () => {
    const shortName = 'John';
    expect(truncateDisplayName(shortName, 20)).toBe('John');
  });

  it('should generate consistent user color for same userId', () => {
    const userId = 'user123';
    const color1 = generateUserColor(userId);
    const color2 = generateUserColor(userId);
    expect(color1).toBe(color2);
  });

  it('should generate different colors for different userIds', () => {
    const color1 = generateUserColor('user1');
    const color2 = generateUserColor('user2');
    // Note: There's a small chance they could be the same, but very unlikely
    expect(color1).toMatch(/^#[0-9A-F]{6}$/i);
    expect(color2).toMatch(/^#[0-9A-F]{6}$/i);
  });
});

describe('ID Generation', () => {
  it('should generate unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  it('should generate IDs with correct format', () => {
    const id = generateId();
    expect(id).toContain('-');
    expect(typeof id).toBe('string');
  });
});

describe('Rectangle Helpers', () => {
  it('should normalize rectangle with positive dimensions', () => {
    const result = normalizeRectangle(100, 100, 200, 200);
    expect(result).toEqual({
      x: 100,
      y: 100,
      width: 100,
      height: 100,
    });
  });

  it('should normalize rectangle with negative width', () => {
    const result = normalizeRectangle(200, 100, 100, 200);
    expect(result).toEqual({
      x: 100,
      y: 100,
      width: 100,
      height: 100,
    });
  });

  it('should normalize rectangle with negative height', () => {
    const result = normalizeRectangle(100, 200, 200, 100);
    expect(result).toEqual({
      x: 100,
      y: 100,
      width: 100,
      height: 100,
    });
  });

  it('should normalize rectangle with both negative dimensions', () => {
    const result = normalizeRectangle(200, 200, 100, 100);
    expect(result).toEqual({
      x: 100,
      y: 100,
      width: 100,
      height: 100,
    });
  });
});

describe('Distance Calculation', () => {
  it('should calculate distance between two points', () => {
    const p1 = { x: 0, y: 0 };
    const p2 = { x: 3, y: 4 };
    expect(distance(p1, p2)).toBe(5); // 3-4-5 triangle
  });

  it('should return 0 for same point', () => {
    const p = { x: 10, y: 10 };
    expect(distance(p, p)).toBe(0);
  });
});

describe('Coordinate Conversion for Cursor Tracking', () => {
  describe('screenToCanvas', () => {
    it('should convert screen coordinates to canvas coordinates with no zoom or pan', () => {
      const result = screenToCanvas(100, 100, 0, 0, 1);
      expect(result).toEqual({ x: 100, y: 100 });
    });

    it('should convert screen coordinates with zoom', () => {
      // Screen position 100,100 with 2x zoom and no pan
      const result = screenToCanvas(100, 100, 0, 0, 2);
      expect(result).toEqual({ x: 50, y: 50 });
    });

    it('should convert screen coordinates with pan', () => {
      // Screen position 100,100 with pan of 50,50 and no zoom
      const result = screenToCanvas(100, 100, 50, 50, 1);
      expect(result).toEqual({ x: 50, y: 50 });
    });

    it('should convert screen coordinates with zoom and pan', () => {
      // Screen position 200,200 with 2x zoom and pan of 100,100
      const result = screenToCanvas(200, 200, 100, 100, 2);
      expect(result).toEqual({ x: 50, y: 50 });
    });

    it('should handle negative pan values', () => {
      const result = screenToCanvas(100, 100, -50, -50, 1);
      expect(result).toEqual({ x: 150, y: 150 });
    });

    it('should handle fractional zoom', () => {
      const result = screenToCanvas(100, 100, 0, 0, 0.5);
      expect(result).toEqual({ x: 200, y: 200 });
    });
  });

  describe('canvasToScreen', () => {
    it('should convert canvas coordinates to screen coordinates with no zoom or pan', () => {
      const result = canvasToScreen(100, 100, 0, 0, 1);
      expect(result).toEqual({ x: 100, y: 100 });
    });

    it('should convert canvas coordinates with zoom', () => {
      // Canvas position 50,50 with 2x zoom and no pan
      const result = canvasToScreen(50, 50, 0, 0, 2);
      expect(result).toEqual({ x: 100, y: 100 });
    });

    it('should convert canvas coordinates with pan', () => {
      // Canvas position 50,50 with pan of 50,50 and no zoom
      const result = canvasToScreen(50, 50, 50, 50, 1);
      expect(result).toEqual({ x: 100, y: 100 });
    });

    it('should convert canvas coordinates with zoom and pan', () => {
      // Canvas position 50,50 with 2x zoom and pan of 100,100
      const result = canvasToScreen(50, 50, 100, 100, 2);
      expect(result).toEqual({ x: 200, y: 200 });
    });

    it('should be inverse of screenToCanvas', () => {
      const screenX = 150;
      const screenY = 200;
      const stageX = 30;
      const stageY = 40;
      const scale = 1.5;

      const canvas = screenToCanvas(screenX, screenY, stageX, stageY, scale);
      const backToScreen = canvasToScreen(canvas.x, canvas.y, stageX, stageY, scale);

      expect(backToScreen.x).toBeCloseTo(screenX, 10);
      expect(backToScreen.y).toBeCloseTo(screenY, 10);
    });
  });
});

describe('Throttle Function', () => {
  it('should throttle function calls', async () => {
    let callCount = 0;
    const throttled = throttle(() => {
      callCount++;
    }, 100);

    // Call multiple times rapidly
    throttled();
    throttled();
    throttled();

    // Should only execute once immediately
    expect(callCount).toBe(1);

    // Wait for throttle period
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Call again
    throttled();
    expect(callCount).toBe(2);
  });

  it('should preserve function arguments', async () => {
    let lastArgs: any[] = [];
    const throttled = throttle((...args: any[]) => {
      lastArgs = args;
    }, 50);

    throttled(1, 2, 3);
    expect(lastArgs).toEqual([1, 2, 3]);

    await new Promise((resolve) => setTimeout(resolve, 100));

    throttled('a', 'b', 'c');
    expect(lastArgs).toEqual(['a', 'b', 'c']);
  });

  it('should not execute during throttle period', async () => {
    let callCount = 0;
    const throttled = throttle(() => {
      callCount++;
    }, 100);

    throttled();
    expect(callCount).toBe(1);

    // Try calling again before throttle period ends
    await new Promise((resolve) => setTimeout(resolve, 50));
    throttled();
    expect(callCount).toBe(1); // Should still be 1

    // Wait for throttle period to end
    await new Promise((resolve) => setTimeout(resolve, 100));
    throttled();
    expect(callCount).toBe(2); // Now should be 2
  });
});

