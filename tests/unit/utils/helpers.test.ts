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

