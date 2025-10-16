/**
 * Presence Service - User Presence Tracking
 * Tracks which users are currently online in the canvas
 * Uses Firebase Realtime Database for real-time presence updates
 */

import {
  ref,
  set,
  update,
  onValue,
  onDisconnect,
  serverTimestamp,
  off,
} from 'firebase/database';
import type { Unsubscribe } from 'firebase/database';
import { rtdb } from './firebase';

// ============================================================================
// Constants
// ============================================================================

const GLOBAL_CANVAS_ID = 'global-canvas-v1';

// ============================================================================
// Types
// ============================================================================

export interface PresenceData {
  uid: string;
  displayName: string;
  color: string;
  cursorX: number; // Canvas-relative coordinates
  cursorY: number; // Canvas-relative coordinates
  lastSeen: number | object;
  isOnline: boolean;
}

export interface PresenceCallback {
  (users: PresenceData[]): void;
}

// ============================================================================
// User Color Generation
// ============================================================================

/**
 * Generate a consistent color for a user based on their ID
 */
function generateUserColor(userId: string): string {
  const colors = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // amber
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f97316', // orange
  ];
  
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// ============================================================================
// Presence Management
// ============================================================================

/**
 * Set user as online in the session
 * Automatically sets user as offline when they disconnect
 */
export async function setUserOnline(
  userId: string,
  displayName: string
): Promise<void> {
  try {
    const userRef = ref(rtdb, `sessions/${GLOBAL_CANVAS_ID}/${userId}`);
    const color = generateUserColor(userId);
    
    const presenceData: PresenceData = {
      uid: userId,
      displayName,
      color,
      cursorX: 0,
      cursorY: 0,
      lastSeen: serverTimestamp() as object,
      isOnline: true,
    };
    
    // Set user online
    await set(userRef, presenceData);
    
    // Automatically set offline on disconnect
    await onDisconnect(userRef).set({
      ...presenceData,
      isOnline: false,
      lastSeen: serverTimestamp() as object,
    });
  } catch (error) {
    console.error('Failed to set user online:', error);
    throw error;
  }
}

/**
 * Set user as offline manually
 */
export async function setUserOffline(userId: string): Promise<void> {
  try {
    const userRef = ref(rtdb, `sessions/${GLOBAL_CANVAS_ID}/${userId}`);
    await set(userRef, null);
  } catch (error: any) {
    // Silently ignore permission errors during logout
    if (error?.code !== 'PERMISSION_DENIED') {
      console.error('Failed to set user offline:', error);
    }
  }
}

/**
 * Update cursor position for a user
 * Uses canvas-relative coordinates (not screen coordinates)
 * Called by Canvas component which throttles updates using RAF (~60fps)
 * This function itself is fire-and-forget for maximum speed
 * 
 * OPTIMIZATION: Single write instead of 3 separate writes (66% reduction!)
 */
export function updateCursorPosition(
  userId: string,
  cursorX: number,
  cursorY: number
): void {
  const userRef = ref(rtdb, `sessions/${GLOBAL_CANVAS_ID}/${userId}`);
  
  // Fire-and-forget for maximum speed - don't await
  // Update cursor position AND lastSeen in a SINGLE write (was 3 separate writes before!)
  // Use update() to merge fields (preserves displayName, color, isOnline)
  // Use Date.now() instead of serverTimestamp for speed
  update(userRef, {
    cursorX,
    cursorY,
    lastSeen: Date.now(),
  }).catch((error) => {
    // Silently fail to avoid spamming console during rapid cursor movements
    if (import.meta.env.DEV) {
      console.warn('Failed to update cursor position:', error);
    }
  });
}

/**
 * Subscribe to presence updates
 * Returns unsubscribe function
 */
export function subscribeToPresence(
  callback: PresenceCallback
): Unsubscribe {
  const sessionRef = ref(rtdb, `sessions/${GLOBAL_CANVAS_ID}`);
  
  const handlePresenceUpdate = (snapshot: any) => {
    const data = snapshot.val();
    
    if (!data) {
      callback([]);
      return;
    }
    
    // Convert object to array and filter online users
    const users: PresenceData[] = (Object.values(data) as PresenceData[]).filter(
      (user) => user.isOnline === true
    );
    
    callback(users);
  };
  
  // Listen to presence changes
  onValue(sessionRef, handlePresenceUpdate, (error: any) => {
    // Silently ignore permission errors (happens during logout/when not authenticated)
    if (error?.code === 'PERMISSION_DENIED' || error?.message?.includes('permission_denied')) {
      // User logged out or not authenticated, clear online users
      callback([]);
      return;
    }
    console.error('Error subscribing to presence:', error);
  });
  
  // Return unsubscribe function
  return () => {
    off(sessionRef, 'value', handlePresenceUpdate);
  };
}

// ============================================================================
// AI Activity Broadcasting
// ============================================================================

export interface AIActivityData {
  userId: string;
  userName: string;
  command: string;
  timestamp: number;
}

export interface AIActivityCallback {
  (activity: AIActivityData): void;
}

/**
 * Broadcast AI activity to all users
 */
export async function broadcastAIActivity(
  userId: string,
  userName: string,
  command: string
): Promise<void> {
  try {
    const activityRef = ref(rtdb, `ai-activity/${GLOBAL_CANVAS_ID}/${Date.now()}`);
    const activityData: AIActivityData = {
      userId,
      userName,
      command,
      timestamp: Date.now(),
    };
    
    await set(activityRef, activityData);
    
    // Auto-delete after 5 seconds
    setTimeout(async () => {
      try {
        await set(activityRef, null);
      } catch (error) {
        // Silently ignore cleanup errors
      }
    }, 5000);
  } catch (error) {
    console.error('Failed to broadcast AI activity:', error);
  }
}

/**
 * Subscribe to AI activity from other users
 */
export function subscribeToAIActivity(
  currentUserId: string,
  callback: AIActivityCallback
): Unsubscribe {
  const activityRef = ref(rtdb, `ai-activity/${GLOBAL_CANVAS_ID}`);
  
  const handleActivityUpdate = (snapshot: any) => {
    const data = snapshot.val();
    
    if (!data) return;
    
    // Get all activities and find the most recent one
    const activities: AIActivityData[] = Object.values(data);
    const latestActivity = activities[activities.length - 1];
    
    // Only notify about other users' activities
    if (latestActivity && latestActivity.userId !== currentUserId) {
      callback(latestActivity);
    }
  };
  
  onValue(activityRef, handleActivityUpdate);
  
  return () => {
    off(activityRef, 'value', handleActivityUpdate);
  };
}

