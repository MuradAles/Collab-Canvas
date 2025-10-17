/**
 * Tutorial Component
 * Displays keyboard shortcuts and commands in a compact dropdown
 */

import { useState, useRef, useEffect } from 'react';

export function Tutorial() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="relative flex flex-col items-end">
      {/* Tutorial Dropdown - Opens above and to the right of button */}
      {isOpen && (
        <div className="absolute bottom-12 right-0 w-64 bg-white bg-opacity-95 rounded-lg shadow-lg border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* Header */}
          <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700">Keyboard Shortcuts</h3>
          </div>

          {/* Shortcuts List */}
          <div className="max-h-80 overflow-y-auto">
            <div className="px-3 py-2 space-y-1.5">
              {shortcuts.map((shortcut, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1.5">
                  <span className="text-gray-600">{shortcut.description}</span>
                  <kbd className="px-2 py-0.5 text-xs font-semibold text-gray-700 bg-gray-100 border border-gray-300 rounded">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tutorial Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
        title="Keyboard Shortcuts"
      >
        <svg
          className="w-5 h-5 text-gray-700"
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
    </div>
  );
}

