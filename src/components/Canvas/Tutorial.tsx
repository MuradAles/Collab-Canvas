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
    <>
      {/* Modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown positioned below navbar button */}
          <div 
            className="absolute top-full right-0 mt-2 w-80 bg-theme-surface rounded-lg shadow-lg border border-theme overflow-hidden z-40"
            onClick={(e) => e.stopPropagation()}
          >
            <style>{`
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

      {/* Tutorial Button - Navbar style */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-theme-surface-hover rounded-lg transition-colors group"
        title="Keyboard Shortcuts"
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
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>
    </>
  );
}

