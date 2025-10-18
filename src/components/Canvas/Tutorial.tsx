/**
 * Tutorial Component
 * Displays keyboard shortcuts and commands in a modal popup
 */

import { useState } from 'react';

export function Tutorial() {
  const [isOpen, setIsOpen] = useState(false);

  const shortcuts = [
    { key: 'V', description: 'Select Tool' },
    { key: 'R', description: 'Rectangle Tool' },
    { key: 'C', description: 'Circle Tool' },
    { key: 'T', description: 'Text Tool' },
    { key: 'L', description: 'Line Tool' },
    { key: 'Shift + Click', description: 'Multi-Select' },
    { key: 'Delete', description: 'Delete Shape' },
    { key: 'Ctrl+Shift+D', description: 'Duplicate' },
    { key: 'Escape', description: 'Deselect' },
    { key: '+', description: 'Zoom In' },
    { key: '-', description: 'Zoom Out' },
    { key: 'Ctrl + 0', description: 'Reset View' },
    { key: 'Ctrl + Drag', description: 'Pan Canvas' },
    { key: 'Mouse Wheel', description: 'Zoom' },
  ];

  return (
    <div className="flex flex-col items-center">
      {/* Modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0"
            style={{ zIndex: 9998 }}
            onClick={() => setIsOpen(false)}
          />
          
          {/* Compact Popup - positioned near button on right */}
          <div 
            className="fixed w-80 bg-theme-surface bg-opacity-95 rounded-lg shadow-lg border border-theme overflow-hidden backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
            style={{
              right: '80px',
              bottom: '16px',
              zIndex: 9999,
              animation: 'slideInFromRight 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards',
              opacity: 0,
            }}
          >
            <style>{`
              @keyframes slideInFromRight {
                from {
                  opacity: 0;
                  transform: translateX(20px) scale(0.95);
                }
                to {
                  opacity: 1;
                  transform: translateX(0) scale(1);
                }
              }
              
              /* Custom Scrollbar */
              .custom-scrollbar::-webkit-scrollbar {
                width: 6px;
              }
              .custom-scrollbar::-webkit-scrollbar-track {
                background: transparent;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: rgba(155, 155, 155, 0.5);
                border-radius: 3px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: rgba(155, 155, 155, 0.7);
              }
            `}</style>
            {/* Header */}
            <div className="px-4 py-3 bg-theme-surface-hover border-b border-theme flex items-center justify-between">
              <h3 className="text-sm font-semibold text-theme-primary">Keyboard Shortcuts</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-theme-surface rounded transition-colors"
              >
                <svg className="w-4 h-4 text-theme-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
              {shortcuts.map((shortcut, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1.5">
                  <span className="text-theme-secondary">{shortcut.description}</span>
                  <kbd className="px-2 py-1 text-xs font-semibold text-theme-primary bg-theme-surface-hover border border-theme rounded">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Tutorial Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative group w-12 h-12 flex items-center justify-center rounded-full bg-theme-surface hover:bg-theme-surface-hover border-2 border-theme shadow-lg transition-all hover:shadow-xl"
      >
        <svg
          className="w-5 h-5 text-theme-primary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        {/* Hover Tooltip */}
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-50">
          <div className="bg-gray-900 dark:bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap backdrop-blur-sm">
            Keyboard Shortcuts
          </div>
        </div>
      </button>
    </div>
  );
}

