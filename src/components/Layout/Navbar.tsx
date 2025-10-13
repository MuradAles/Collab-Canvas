/**
 * Navbar Component
 * Displays user information and logout button
 */

import { useAuth } from '../../hooks/useAuth';

export function Navbar() {
  const { currentUser, logout } = useAuth();

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

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900">CollabCanvas</h1>
          <span className="text-sm text-gray-500">Real-time Collaborative Design</span>
        </div>

        <div className="flex items-center gap-4">
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

