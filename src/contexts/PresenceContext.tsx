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
  useRef,
  useMemo,
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
  const rafRef = useRef<number | null>(null);
  const pendingUsersRef = useRef<PresenceData[] | null>(null);

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
          // Store pending update
          pendingUsersRef.current = users;
          
          // Throttle updates using RAF to prevent infinite loops
          // This batches multiple rapid Firebase updates into a single React update
          if (rafRef.current === null) {
            rafRef.current = requestAnimationFrame(() => {
              rafRef.current = null;
              
              if (pendingUsersRef.current) {
                const newUsers = pendingUsersRef.current;
                pendingUsersRef.current = null;
                
                // Only update if users actually changed
                setOnlineUsers(prevUsers => {
                  // Quick length check
                  if (prevUsers.length !== newUsers.length) {
                    return newUsers;
                  }
                  
                  // Optimized O(n) comparison using Map for fast lookups
                  const prevUsersMap = new Map(prevUsers.map(u => [u.uid, u]));
                  
                  // Check if any user data changed
                  for (const newUser of newUsers) {
                    const prevUser = prevUsersMap.get(newUser.uid);
                    
                    if (!prevUser) {
                      return newUsers; // New user added
                    }
                    
                    // Check if any field changed (using bitwise OR for early exit)
                    if (
                      prevUser.cursorX !== newUser.cursorX ||
                      prevUser.cursorY !== newUser.cursorY ||
                      prevUser.displayName !== newUser.displayName ||
                      prevUser.color !== newUser.color ||
                      prevUser.isOnline !== newUser.isOnline
                    ) {
                      return newUsers;
                    }
                  }
                  
                  // Nothing changed, return previous reference
                  return prevUsers;
                });
              }
            });
          }
        });
      } catch (error) {
        console.error('Failed to setup presence:', error);
      }
    };

    setupPresence();

    // Cleanup on unmount
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (unsubscribePresence) {
        unsubscribePresence();
      }
      if (currentUser) {
        setUserOffline(currentUser.uid).catch(console.error);
      }
    };
  }, [currentUser]);

  // Memoize context value to prevent unnecessary re-renders of consumers
  const value: PresenceContextType = useMemo(() => ({
    onlineUsers,
  }), [onlineUsers]);

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

