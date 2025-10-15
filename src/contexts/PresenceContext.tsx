/**
 * Presence Context
 * Manages online users and cursor positions separately from canvas state
 * Prevents cursor updates from causing Canvas re-renders
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import {
  setUserOnline,
  setUserOffline,
  subscribeToPresence,
  type PresenceData,
} from '../services/presence';

interface PresenceContextType {
  onlineUsers: PresenceData[];
}

const PresenceContext = createContext<PresenceContextType | null>(null);

interface PresenceProviderProps {
  children: ReactNode;
}

export function PresenceProvider({ children }: PresenceProviderProps) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceData[]>([]);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    let unsubscribePresence: (() => void) | null = null;

    const setupPresence = async () => {
      try {
        // Set user as online
        await setUserOnline(
          currentUser.uid,
          currentUser.displayName || 'Unknown User'
        );

        // Subscribe to presence updates
        unsubscribePresence = subscribeToPresence((users) => {
          setOnlineUsers(users);
        });
      } catch (error) {
        console.error('Failed to setup presence:', error);
      }
    };

    setupPresence();

    // Cleanup on unmount
    return () => {
      if (unsubscribePresence) {
        unsubscribePresence();
      }
      if (currentUser) {
        setUserOffline(currentUser.uid).catch(console.error);
      }
    };
  }, [currentUser]);

  const value: PresenceContextType = {
    onlineUsers,
  };

  return (
    <PresenceContext.Provider value={value}>
      {children}
    </PresenceContext.Provider>
  );
}

PresenceProvider.displayName = 'PresenceProvider';

/**
 * Hook to use presence context
 */
export function usePresenceContext() {
  const context = useContext(PresenceContext);
  if (!context) {
    throw new Error('usePresenceContext must be used within PresenceProvider');
  }
  return context;
}

