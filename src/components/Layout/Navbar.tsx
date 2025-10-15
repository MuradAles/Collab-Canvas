/**
 * Navbar Component
 * Top navigation bar with user info, presence, and logout
 */

import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useCanvasContext } from '../../contexts/CanvasContext';

export function Navbar() {
  const { currentUser, logout } = useAuth();
  const { onlineUsers } = useCanvasContext();
  const [showAllUsers, setShowAllUsers] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  if (!currentUser) {
    return null;
  }

  // Filter out current user
  const otherUsers = onlineUsers.filter(user => user.uid !== currentUser.uid);
  const maxVisible = 5;
  const visibleUsers = otherUsers.slice(0, maxVisible);
  const hiddenUsers = otherUsers.slice(maxVisible);
  const hasHiddenUsers = hiddenUsers.length > 0;

  const getInitials = (name: string): string => {
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  const getUserColor = (userId: string): string => {
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
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900">CollabCanvas</h1>
          <span className="text-sm text-gray-500">Real-time Collaborative Design</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Online Users */}
          {otherUsers.length > 0 && (
            <>
              <div className="flex items-center gap-2 relative">
                <div className="flex -space-x-2">
                  {visibleUsers.map((user) => {
                    const color = user.color || getUserColor(user.uid);
                    return (
                      <div
                        key={user.uid}
                        className="relative group"
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow-sm hover:scale-110 transition-transform hover:z-10 cursor-pointer"
                          style={{ backgroundColor: color }}
                        >
                          {getInitials(user.displayName)}
                        </div>
                        {/* Tooltip */}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-50">
                          {user.displayName}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                            <div className="border-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* +X More Button */}
                  {hasHiddenUsers && (
                    <div className="relative">
                      <button
                        onClick={() => setShowAllUsers(!showAllUsers)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-gray-700 text-xs font-bold border-2 border-white bg-gray-200 hover:bg-gray-300 shadow-sm transition-colors cursor-pointer"
                        title={`${hiddenUsers.length} more online`}
                      >
                        +{hiddenUsers.length}
                      </button>
                      
                      {/* Dropdown List */}
                      {showAllUsers && (
                        <>
                          {/* Backdrop to close dropdown */}
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setShowAllUsers(false)}
                          />
                          
                          {/* Dropdown */}
                          <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                            <div className="px-4 py-2 border-b border-gray-100">
                              <p className="text-xs font-semibold text-gray-500 uppercase">
                                All Online Users ({otherUsers.length})
                              </p>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                              {otherUsers.map((user) => {
                                const color = user.color || getUserColor(user.uid);
                                return (
                                  <div
                                    key={user.uid}
                                    className="px-4 py-2 hover:bg-gray-50 flex items-center gap-3"
                                  >
                                    <div
                                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                      style={{ backgroundColor: color }}
                                    >
                                      {getInitials(user.displayName)}
                                    </div>
                                    <span className="text-sm text-gray-700 truncate">
                                      {user.displayName}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Online count text */}
                <span className="text-xs text-gray-500 font-medium">
                  {otherUsers.length} online
                </span>
              </div>
              
              {/* Divider */}
              <div className="w-px h-8 bg-gray-200"></div>
            </>
          )}

          {/* User info */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                {currentUser.displayName?.charAt(0).toUpperCase() || 
                 currentUser.email?.charAt(0).toUpperCase() || 
                 'U'}
              </div>
              <span className="text-sm font-medium text-gray-700">
                {currentUser.displayName || currentUser.email}
              </span>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
