/**
 * Rate Limiter
 * Client-side rate limiting to prevent abuse of AI commands
 */

// ============================================================================
// Configuration
// ============================================================================

const MAX_REQUESTS_PER_MINUTE = 10;
const MAX_SHAPES_PER_COMMAND = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

const STORAGE_KEY_REQUESTS = 'ai_request_timestamps';
const STORAGE_KEY_LAST_REQUEST = 'ai_last_request';

// ============================================================================
// Type Definitions
// ============================================================================

export interface RateLimitResult {
  allowed: boolean;
  waitTime?: number; // in seconds
  remainingRequests?: number;
}

// ============================================================================
// Rate Limit Functions
// ============================================================================

/**
 * Check if a new AI request can be made
 */
export function canMakeRequest(): RateLimitResult {
  // Skip rate limiting in development mode
  if (import.meta.env.DEV) {
    return { allowed: true, remainingRequests: MAX_REQUESTS_PER_MINUTE };
  }

  const now = Date.now();
  const timestamps = getRequestTimestamps();

  // Filter out requests older than 1 minute
  const recentRequests = timestamps.filter(
    ts => now - ts < RATE_LIMIT_WINDOW_MS
  );

  // Check if we're under the limit
  if (recentRequests.length < MAX_REQUESTS_PER_MINUTE) {
    return {
      allowed: true,
      remainingRequests: MAX_REQUESTS_PER_MINUTE - recentRequests.length,
    };
  }

  // Calculate wait time until oldest request expires
  const oldestRequest = Math.min(...recentRequests);
  const waitTimeMs = RATE_LIMIT_WINDOW_MS - (now - oldestRequest);
  const waitTimeSec = Math.ceil(waitTimeMs / 1000);

  return {
    allowed: false,
    waitTime: waitTimeSec,
    remainingRequests: 0,
  };
}

/**
 * Record a new AI request
 */
export function recordRequest(): void {
  const now = Date.now();
  const timestamps = getRequestTimestamps();

  // Add current timestamp
  timestamps.push(now);

  // Keep only recent requests
  const recentTimestamps = timestamps.filter(
    ts => now - ts < RATE_LIMIT_WINDOW_MS
  );

  // Save to localStorage
  saveRequestTimestamps(recentTimestamps);
  localStorage.setItem(STORAGE_KEY_LAST_REQUEST, now.toString());
}

/**
 * Get remaining requests in current window
 */
export function getRemainingRequests(): number {
  const now = Date.now();
  const timestamps = getRequestTimestamps();
  
  const recentRequests = timestamps.filter(
    ts => now - ts < RATE_LIMIT_WINDOW_MS
  );

  return Math.max(0, MAX_REQUESTS_PER_MINUTE - recentRequests.length);
}

/**
 * Get time until next request is allowed (in seconds)
 */
export function getWaitTime(): number {
  const result = canMakeRequest();
  return result.waitTime || 0;
}

/**
 * Check if number of shapes is within limit
 */
export function validateShapeCount(count: number): { valid: boolean; error?: string } {
  if (count > MAX_SHAPES_PER_COMMAND) {
    return {
      valid: false,
      error: `Too many shapes requested (${count}). Maximum is ${MAX_SHAPES_PER_COMMAND} per command.`,
    };
  }
  return { valid: true };
}

/**
 * Reset rate limit (for testing/debugging)
 */
export function resetRateLimit(): void {
  localStorage.removeItem(STORAGE_KEY_REQUESTS);
  localStorage.removeItem(STORAGE_KEY_LAST_REQUEST);
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get request timestamps from localStorage
 */
function getRequestTimestamps(): number[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_REQUESTS);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Save request timestamps to localStorage
 */
function saveRequestTimestamps(timestamps: number[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(timestamps));
  } catch (error) {
    console.error('Failed to save rate limit data:', error);
  }
}

