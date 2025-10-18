/**
 * Grid Toggle Component
 * Allows users to show/hide the canvas grid
 */

interface GridToggleProps {
  showGrid: boolean;
  onToggle: () => void;
}

export function GridToggle({ showGrid, onToggle }: GridToggleProps) {
  return (
    <div className="absolute bottom-4 left-4 z-10">
      <button
        onClick={onToggle}
        className={`
          relative group w-10 h-10 flex items-center justify-center rounded-lg shadow-lg border
          transition-all duration-200
          ${showGrid 
            ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600' 
            : 'bg-theme-surface hover:bg-theme-surface-hover text-theme-primary border-theme'
          }
        `}
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
        {/* Tooltip */}
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block">
          <div className="bg-gray-900 dark:bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap backdrop-blur-sm">
            {showGrid ? 'Hide Grid' : 'Show Grid'}
          </div>
        </div>
      </button>
    </div>
  );
}

