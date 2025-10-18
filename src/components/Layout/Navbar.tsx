/**
 * Navbar Component
 * Top navigation bar with app name, online users, and user menu
 */

import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { usePresenceContext } from '../../contexts/PresenceContext';
import { SettingsPanel } from './SettingsPanel';

interface NavbarProps {
  onNavigateToUser?: ((userId: string) => void) | null;
}

export function Navbar({ onNavigateToUser }: NavbarProps = {}) {
  const { currentUser, logout } = useAuth();
  const { onlineUsers } = usePresenceContext();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showOnlineUsersDropdown, setShowOnlineUsersDropdown] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      setShowUserDropdown(false);
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  if (!currentUser) {
    return null;
  }

  // Get colors for user avatars
  const getUserColor = (userId: string): string => {
    const colors = [
      'bg-blue-600',
      'bg-green-600',
      'bg-purple-600',
      'bg-pink-600',
      'bg-indigo-600',
      'bg-red-600',
      'bg-yellow-600',
      'bg-teal-600',
    ];
    const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  return (
    <>
      <nav className="bg-theme-surface border-b border-theme px-6 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-theme-primary">CollabCanvas</h1>

          <div className="flex items-center gap-4">
            {/* Settings Button */}
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 hover:bg-theme-surface-hover rounded-lg transition-colors group"
              title="Settings"
            >
              <svg 
                className="w-5 h-5 text-theme-secondary group-hover:text-theme-primary transition-colors" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
                />
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
                />
              </svg>
            </button>
          {/* Other Online Users (exclude current user) */}
          {(() => {
            const otherUsers = onlineUsers.filter(user => user.uid !== currentUser.uid);
            if (otherUsers.length === 0) return null;
            
            return (
              <div className="relative">
                {/* User Avatars - Click to open dropdown */}
                <div 
                  className="flex -space-x-2 cursor-pointer"
                  onClick={() => setShowOnlineUsersDropdown(!showOnlineUsersDropdown)}
                  title="Click to see online users"
                >
                  {otherUsers.slice(0, 5).map((user) => (
                    <div
                      key={user.uid}
                      className={`w-8 h-8 rounded-full ${getUserColor(user.uid)} flex items-center justify-center text-white text-xs font-medium border-2 border-white hover:scale-110 transition-transform`}
                      title={user.displayName}
                    >
                      {user.displayName.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {otherUsers.length > 5 && (
                    <div
                      className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-medium border-2 border-white hover:scale-110 transition-transform"
                    >
                      +{otherUsers.length - 5}
                    </div>
                  )}
                </div>

                {/* Online Users Dropdown */}
                {showOnlineUsersDropdown && (
                  <>
                    {/* Backdrop to close dropdown */}
                    <div 
                      className="fixed inset-0 z-30" 
                      onClick={() => setShowOnlineUsersDropdown(false)}
                    />
                    
                    <div 
                      className="absolute top-full right-0 mt-2 w-64 bg-theme-surface rounded-lg shadow-lg border border-theme py-2 z-40"
                    >
                      <div className="px-3 py-2 text-xs font-semibold text-theme-secondary uppercase tracking-wider border-b border-theme">
                        Online Users ({otherUsers.length})
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {otherUsers.map((user) => (
                          <div
                            key={user.uid}
                            className="px-3 py-2 hover:bg-theme-surface-hover flex items-center gap-3 cursor-pointer transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigateToUser?.(user.uid);
                              setShowOnlineUsersDropdown(false);
                            }}
                            title={`Click to jump to ${user.displayName}`}
                          >
                            <div
                              className={`w-10 h-10 rounded-full ${getUserColor(user.uid)} flex items-center justify-center text-white text-sm font-medium flex-shrink-0`}
                            >
                              {user.displayName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-theme-primary truncate">
                                {user.displayName}
                              </div>
                              <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                Click to jump to their cursor
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })()}

          {/* User Icon with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium hover:bg-blue-700 transition-colors"
              title={currentUser.displayName || currentUser.email || 'User'}
            >
              {currentUser.displayName?.charAt(0).toUpperCase() || 
               currentUser.email?.charAt(0).toUpperCase() || 
               'U'}
            </button>

            {/* User Dropdown */}
            {showUserDropdown && (
              <>
                {/* Backdrop to close dropdown */}
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setShowUserDropdown(false)}
                />
                
                {/* Dropdown Menu */}
                <div className="absolute top-full right-0 mt-2 w-56 bg-theme-surface rounded-lg shadow-lg border border-theme py-1 z-40">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-theme">
                    <div className="text-sm font-medium text-theme-primary truncate">
                      {currentUser.displayName || currentUser.email}
                    </div>
                    {currentUser.email && currentUser.displayName && (
                      <div className="text-xs text-theme-secondary truncate">
                        {currentUser.email}
                      </div>
                    )}
                  </div>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-theme-primary hover:bg-theme-surface-hover flex items-center gap-3"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Log Out
                  </button>
                </div>
              </>
            )}
          </div>
          </div>
        </div>
      </nav>

      {/* Settings Panel */}
      <SettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
}
