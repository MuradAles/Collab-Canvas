/**
 * AI Commands Modal Component
 * Shows available AI commands in a compact popup
 */

interface AICommandsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AICommandsModal({ isOpen, onClose }: AICommandsModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0"
        style={{ zIndex: 9998 }}
        onClick={onClose}
      />
      
      {/* Compact Popup - positioned near toolbar */}
      <div 
        className="fixed left-1/2 w-80 bg-theme-surface bg-opacity-95 rounded-lg shadow-lg border border-theme overflow-hidden backdrop-blur-sm"
        onClick={(e) => e.stopPropagation()}
        style={{
          bottom: '80px',
          zIndex: 9999,
          transform: 'translateX(-50%)',
          animation: 'slideUpSmooth 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards',
          opacity: 0,
        }}
      >
        <style>{`
            @keyframes slideUpSmooth {
              from {
                opacity: 0;
                transform: translateX(-50%) translateY(20px) scale(0.95);
              }
              to {
                opacity: 1;
                transform: translateX(-50%) translateY(0) scale(1);
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
          <h3 className="text-sm font-semibold text-theme-primary">AI Commands</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-theme-surface rounded transition-colors"
          >
            <svg className="w-4 h-4 text-theme-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
          {/* Create Shapes */}
          <div>
            <h4 className="font-semibold text-blue-600 dark:text-blue-400 text-xs mb-1">🎨 Create Shapes</h4>
            <p className="text-xs text-theme-secondary leading-relaxed">Create rectangles, circles, lines, text at any position</p>
          </div>

          {/* Bulk Creation */}
          <div>
            <h4 className="font-semibold text-violet-600 dark:text-violet-400 text-xs mb-1">✨ Bulk Create</h4>
            <p className="text-xs text-theme-secondary leading-relaxed">Create hundreds of shapes at once in grids, patterns, or random layouts</p>
          </div>

          {/* Move Shapes */}
          <div>
            <h4 className="font-semibold text-green-600 dark:text-green-400 text-xs mb-1">↔️ Move Shapes</h4>
            <p className="text-xs text-theme-secondary leading-relaxed">Move shapes to specific positions or relative locations</p>
          </div>

          {/* Transform */}
          <div>
            <h4 className="font-semibold text-purple-600 dark:text-purple-400 text-xs mb-1">🔄 Transform</h4>
            <p className="text-xs text-theme-secondary leading-relaxed">Resize, rotate, scale shapes with precise control</p>
          </div>

          {/* Style */}
          <div>
            <h4 className="font-semibold text-red-600 dark:text-red-400 text-xs mb-1">🎨 Style</h4>
            <p className="text-xs text-theme-secondary leading-relaxed">Change colors, borders, opacity, fonts, and effects</p>
          </div>

          {/* Align */}
          <div>
            <h4 className="font-semibold text-teal-600 dark:text-teal-400 text-xs mb-1">⫼ Align</h4>
            <p className="text-xs text-theme-secondary leading-relaxed">Align shapes horizontally, vertically, distribute evenly</p>
          </div>

          {/* Layer */}
          <div>
            <h4 className="font-semibold text-indigo-600 dark:text-indigo-400 text-xs mb-1">📚 Layer</h4>
            <p className="text-xs text-theme-secondary leading-relaxed">Bring to front, send to back, reorder z-index</p>
          </div>

          {/* Delete */}
          <div>
            <h4 className="font-semibold text-orange-600 dark:text-orange-400 text-xs mb-1">🗑️ Delete</h4>
            <p className="text-xs text-theme-secondary leading-relaxed">Remove shapes by selection, type, or properties</p>
          </div>

          {/* Query */}
          <div>
            <h4 className="font-semibold text-gray-700 dark:text-gray-400 text-xs mb-1">🔍 Query Canvas</h4>
            <p className="text-xs text-theme-secondary leading-relaxed">Ask about shapes, positions, colors, and counts</p>
          </div>
        </div>
      </div>
    </>
  );
}

