/**
 * Cursors Layer Component  
 * Renders multiplayer cursors in an isolated component
 * Subscribes to PresenceContext separately to prevent Canvas re-renders
 */

import { useMemo } from 'react';
import { Cursor } from '../Collaboration/Cursor';
import { usePresenceContext } from '../../contexts/PresenceContext';
import { useAuth } from '../../contexts/AuthContext';

interface CursorsLayerProps {
  scale: number;
}

export function CursorsLayer({ scale }: CursorsLayerProps) {
  // Subscribe to PresenceContext here so Canvas doesn't re-render on cursor updates
  const { onlineUsers } = usePresenceContext();
  const { currentUser } = useAuth();
  
  // Memoize filtered users to prevent unnecessary array creation
  const otherUsers = useMemo(() => {
    if (!currentUser) return onlineUsers;
    return onlineUsers.filter((user) => user.uid !== currentUser.uid && user.isOnline);
  }, [onlineUsers, currentUser]);
  
  return (
    <>
      {otherUsers.map((user) => (
        <Cursor
          key={user.uid}
          user={user}
          scale={scale}
        />
      ))}
    </>
  );
}

