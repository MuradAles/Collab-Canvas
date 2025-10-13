/**
 * Authentication Service Tests
 * Tests for auth-related helper functions
 */

import { describe, it, expect } from 'vitest';
import { getDisplayNameFromEmail, truncateDisplayName } from '../../../src/utils/helpers';

describe('Auth Helper Functions', () => {
  describe('getDisplayNameFromEmail', () => {
    it('should extract username from email', () => {
      expect(getDisplayNameFromEmail('john.doe@example.com')).toBe('john.doe');
    });

    it('should handle simple emails', () => {
      expect(getDisplayNameFromEmail('test@test.com')).toBe('test');
    });

    it('should handle emails with numbers', () => {
      expect(getDisplayNameFromEmail('user123@domain.com')).toBe('user123');
    });

    it('should handle emails with special characters', () => {
      expect(getDisplayNameFromEmail('user+tag@example.com')).toBe('user+tag');
    });
  });

  describe('truncateDisplayName', () => {
    it('should not truncate names shorter than max length', () => {
      expect(truncateDisplayName('John', 20)).toBe('John');
      expect(truncateDisplayName('Short Name', 20)).toBe('Short Name');
    });

    it('should truncate names longer than max length', () => {
      const longName = 'ThisIsAVeryLongDisplayName';
      const result = truncateDisplayName(longName, 20);
      expect(result).toBe('ThisIsAVeryLongDi...');
      expect(result.length).toBe(20);
    });

    it('should handle exact max length', () => {
      const name = '12345678901234567890'; // exactly 20 chars
      expect(truncateDisplayName(name, 20)).toBe(name);
    });

    it('should handle custom max lengths', () => {
      const name = 'LongName';
      expect(truncateDisplayName(name, 5)).toBe('Lo...');
      expect(truncateDisplayName(name, 10)).toBe('LongName');
    });

    it('should use default max length of 20', () => {
      const longName = 'ThisIsAVeryLongDisplayNameThatNeedsTruncation';
      const result = truncateDisplayName(longName);
      expect(result.length).toBeLessThanOrEqual(20);
      expect(result.endsWith('...')).toBe(true);
    });
  });
});

describe('Auth Display Name Logic', () => {
  it('should generate proper display name from Google email', () => {
    const email = 'john.doe@gmail.com';
    const displayName = getDisplayNameFromEmail(email);
    expect(displayName).toBe('john.doe');
  });

  it('should truncate very long email prefixes', () => {
    const email = 'verylongemailaddressprefix@example.com';
    const displayName = getDisplayNameFromEmail(email);
    const truncated = truncateDisplayName(displayName);
    expect(truncated.length).toBeLessThanOrEqual(20);
  });

  it('should handle empty or invalid inputs gracefully', () => {
    // These edge cases would need proper validation in production
    expect(getDisplayNameFromEmail('@example.com')).toBe('');
    expect(truncateDisplayName('')).toBe('');
  });
});

