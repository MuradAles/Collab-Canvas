/**
 * AI Notifications Service
 * Broadcasts AI activity to all users in real-time
 * Uses Firebase Realtime Database
 */

import {
  ref,
  push,
  onChildAdded,
  query,
  limitToLast,
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

export interface AINotification {
  id: string;
  userId: string;
  userName: string;
  command: string;
  summary: string;
  timestamp: number;
}

export interface AINotificationCallback {
  (notification: AINotification): void;
}

// ============================================================================
// Notification Management
// ============================================================================

/**
 * Broadcast an AI activity notification to all users
 */
export async function broadcastAIActivity(
  userId: string,
  userName: string,
  command: string,
  summary: string
): Promise<void> {
  try {
    const activityRef = ref(rtdb, `ai-activity/${GLOBAL_CANVAS_ID}`);
    
    const notificationData = {
      userId,
      userName,
      command,
      summary,
      timestamp: Date.now(),
    };
    
    // Push notification (generates unique key)
    await push(activityRef, notificationData);
  } catch (error) {
    console.error('Failed to broadcast AI activity:', error);
    // Don't throw - notifications are non-critical
  }
}

/**
 * Subscribe to AI activity notifications
 * Only receives notifications from OTHER users (filters out own notifications)
 * Returns unsubscribe function
 */
export function subscribeToAIActivity(
  currentUserId: string,
  callback: AINotificationCallback
): Unsubscribe {
  const activityRef = ref(rtdb, `ai-activity/${GLOBAL_CANVAS_ID}`);
  
  // Query for recent notifications (last 10)
  // This prevents getting flooded with old notifications on initial load
  const recentQuery = query(activityRef, limitToLast(10));
  
  // Track if this is the initial load to avoid showing old notifications
  let isInitialLoad = true;
  const initialLoadTimestamp = Date.now();
  
  const handleNewNotification = (snapshot: any) => {
    const data = snapshot.val();
    const notificationId = snapshot.key;
    
    if (!data || !notificationId) {
      return;
    }
    
    // Skip notifications from the current user (they see their own toast locally)
    if (data.userId === currentUserId) {
      return;
    }
    
    // Skip old notifications on initial load (only show notifications created AFTER subscription)
    if (isInitialLoad && data.timestamp < initialLoadTimestamp) {
      return;
    }
    
    const notification: AINotification = {
      id: notificationId,
      userId: data.userId,
      userName: data.userName,
      command: data.command,
      summary: data.summary,
      timestamp: data.timestamp,
    };
    
    callback(notification);
  };
  
  // Listen for new notifications
  onChildAdded(recentQuery, handleNewNotification, (error: any) => {
    if (error?.code === 'PERMISSION_DENIED' || error?.message?.includes('permission_denied')) {
      // User logged out or not authenticated
      return;
    }
    console.error('Error subscribing to AI activity:', error);
  });
  
  // Mark initial load as complete after a short delay
  setTimeout(() => {
    isInitialLoad = false;
  }, 500);
  
  // Return unsubscribe function
  return () => {
    off(recentQuery, 'child_added', handleNewNotification);
  };
}

