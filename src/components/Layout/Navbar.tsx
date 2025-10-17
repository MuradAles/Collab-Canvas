/**
 * Navbar Component
 * Simple top navigation bar with app name and user menu
 */

import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

export function Navbar() {
  const { currentUser, logout } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);

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

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">CollabCanvas</h1>

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
              <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-40">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {currentUser.displayName || currentUser.email}
                  </div>
                  {currentUser.email && currentUser.displayName && (
                    <div className="text-xs text-gray-500 truncate">
                      {currentUser.email}
                    </div>
                  )}
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
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
    </nav>
  );
}
