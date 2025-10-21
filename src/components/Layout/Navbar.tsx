/**
 * Navbar Component
 * Top navigation bar with app name, online users, and user menu
 */

import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { usePresenceContext } from '../../contexts/PresenceContext';
import { useCanvasContext } from '../../contexts/CanvasContext';
import { SettingsPanel } from './SettingsPanel';
import { Tutorial } from '../Canvas/Tutorial';
import type { ExportFunctions } from '../Canvas/Canvas';

interface NavbarProps {
  onNavigateToUser?: ((userId: string) => void) | null;
  exportFunctions?: ExportFunctions | null;
  showGrid?: boolean;
  onToggleGrid?: (() => void) | null;
}

export function Navbar({ onNavigateToUser, exportFunctions, showGrid, onToggleGrid }: NavbarProps = {}) {
  const { currentUser, logout } = useAuth();
  const { onlineUsers } = usePresenceContext();
  const { connectionStatus, isReconnecting } = useCanvasContext();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showOnlineUsersDropdown, setShowOnlineUsersDropdown] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);

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

  // Connection status indicator
  const getConnectionStatus = () => {
    if (isReconnecting) {
      return {
        text: 'Reconnecting...',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
        icon: (
          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        )
      };
    }
    
    switch (connectionStatus) {
      case 'connected':
        return {
          text: 'Connected',
          color: 'text-green-600',
          bgColor: 'bg-green-100 dark:bg-green-900/20',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )
        };
      case 'disconnected':
        return {
          text: 'Disconnected',
          color: 'text-red-600',
          bgColor: 'bg-red-100 dark:bg-red-900/20',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )
        };
      case 'reconnecting':
        return {
          text: 'Reconnecting...',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
          icon: (
            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )
        };
      default:
        return {
          text: 'Unknown',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100 dark:bg-gray-900/20',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
    }
  };

  return (
    <>
      <nav className="bg-theme-surface border-b border-theme px-6 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-theme-primary">CollabCanvas</h1>

          <div className="flex items-center gap-4">
            {/* Connection Status Indicator */}
            {(() => {
              const status = getConnectionStatus();
              return (
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${status.bgColor} ${status.color} text-sm font-medium`}>
                  {status.icon}
                  <span>{status.text}</span>
                </div>
              );
            })()}

            {/* Grid Toggle Button */}
            <button
              onClick={() => onToggleGrid?.()}
              className={`
                relative group p-2 rounded-lg transition-all duration-200
                ${showGrid 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'hover:bg-theme-surface-hover text-theme-secondary hover:text-theme-primary'
                }
              `}
              title={showGrid ? 'Hide Grid' : 'Show Grid'}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                />
              </svg>
            </button>

            {/* Export Button with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExportDropdown(!showExportDropdown)}
                className="p-2 hover:bg-theme-surface-hover rounded-lg transition-colors group"
                title="Export"
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
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" 
                  />
                </svg>
              </button>

              {/* Export Dropdown */}
              {showExportDropdown && exportFunctions && (
                <>
                  {/* Backdrop */}
                  <div 
                    className="fixed inset-0 z-30" 
                    onClick={() => setShowExportDropdown(false)}
                  />
                  
                  <div className="absolute top-full right-0 mt-2 w-56 bg-theme-surface rounded-lg shadow-lg border border-theme py-1 z-40">
                    {/* Canvas Export */}
                    <div className="px-3 py-2 text-xs font-semibold text-theme-secondary uppercase tracking-wider border-b border-theme">
                      Export Canvas
                    </div>
                    <button
                      onClick={() => {
                        exportFunctions.exportCanvasAsPNG();
                        setShowExportDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-theme-primary hover:bg-theme-surface-hover flex items-center gap-3"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      As PNG
                    </button>
                    <button
                      onClick={() => {
                        exportFunctions.exportCanvasAsSVG();
                        setShowExportDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-theme-primary hover:bg-theme-surface-hover flex items-center gap-3"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      As SVG
                    </button>

                    {/* Selected Shapes Export */}
                    <div className="px-3 py-2 text-xs font-semibold text-theme-secondary uppercase tracking-wider border-t border-b border-theme mt-1">
                      Export Selected
                      {!exportFunctions.hasSelection && (
                        <span className="ml-2 text-xs normal-case text-orange-500 dark:text-orange-400 font-normal">
                          (select shapes first)
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        if (exportFunctions.hasSelection) {
                          exportFunctions.exportSelectedAsSVG();
                          setShowExportDropdown(false);
                        }
                      }}
                      disabled={!exportFunctions.hasSelection}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 ${
                        exportFunctions.hasSelection
                          ? 'text-theme-primary hover:bg-theme-surface-hover cursor-pointer'
                          : 'text-theme-secondary opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      Selected as SVG
                    </button>
                  </div>
                </>
              )}
            </div>

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

            {/* Keyboard Shortcuts Button */}
            <div className="relative">
              <Tutorial />
            </div>

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
