/**
 * Properties Panel Component
 * Figma-style right panel for editing shape properties
 * Optimized with React.memo to prevent unnecessary re-renders
 */

import { useCallback, useState, useEffect, memo, useRef } from 'react';
import type { Shape, RectangleShape, CircleShape, TextShape, LineShape } from '../../types';
import { RectangleProperties } from './properties/RectangleProperties';
import { CircleProperties } from './properties/CircleProperties';
import { TextProperties } from './properties/TextProperties';
import { LineProperties } from './properties/LineProperties';

interface PropertiesPanelProps {
  selectedShape: Shape | null;
  selectedCount: number;
  onUpdate: (updates: Partial<Shape>, localOnly?: boolean) => void;
  currentUserId?: string;
}

const MIN_PANEL_WIDTH = 200;
const MAX_PANEL_WIDTH = 500;
const DEFAULT_PANEL_WIDTH = 256;

function PropertiesPanelComponent({
  selectedShape,
  selectedCount,
  onUpdate,
  currentUserId,
}: PropertiesPanelProps) {
  const [hasFill, setHasFill] = useState(true);
  const [hasStroke, setHasStroke] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [panelWidth, setPanelWidth] = useState(() => {
    const saved = localStorage.getItem('propertiesPanelWidth');
    return saved ? parseInt(saved, 10) : DEFAULT_PANEL_WIDTH;
  });
  const [isResizing, setIsResizing] = useState(false);

  // Check if the selected shape is locked by another user
  const isLockedByOther = Boolean(selectedShape?.isLocked && selectedShape.lockedBy !== currentUserId);

  // Local state for high-frequency inputs (colors, sliders)
  const [localFillColor, setLocalFillColor] = useState('');
  const [localStrokeColor, setLocalStrokeColor] = useState('');

  // Refs for throttling updates and tracking latest colors
  const rafIdRef = useRef<number | null>(null);
  const pendingUpdateRef = useRef<Partial<Shape> | null>(null);
  const latestFillColorRef = useRef<string>('');
  const latestStrokeColorRef = useRef<string>('');
  const resizeStartX = useRef<number>(0);
  const resizeStartWidth = useRef<number>(0);

  // Wrapped update function that prevents updates when locked
  const safeUpdate = useCallback(
    (updates: Partial<Shape>, localOnly?: boolean) => {
      if (isLockedByOther) return;
      onUpdate(updates, localOnly);
    },
    [onUpdate, isLockedByOther]
  );

  // Sync visibility toggles and colors when shape changes
  useEffect(() => {
    if (!selectedShape) return;

    if (selectedShape.type === 'rectangle' || selectedShape.type === 'circle') {
      setHasFill(selectedShape.fill !== 'transparent');
      setHasStroke(selectedShape.stroke !== 'transparent');
      setLocalFillColor(selectedShape.fill);
      setLocalStrokeColor(selectedShape.stroke);
      latestFillColorRef.current = selectedShape.fill;
      latestStrokeColorRef.current = selectedShape.stroke;
    } else if (selectedShape.type === 'text') {
      setHasFill(selectedShape.fill !== 'transparent');
      setLocalFillColor(selectedShape.fill);
      latestFillColorRef.current = selectedShape.fill;
    } else if (selectedShape.type === 'line') {
      setHasStroke(selectedShape.stroke !== 'transparent');
      setLocalStrokeColor(selectedShape.stroke);
      latestStrokeColorRef.current = selectedShape.stroke;
    }
  }, [selectedShape]);

  // Throttled update using requestAnimationFrame for smooth 60fps updates
  const throttledUpdate = useCallback(
    (updates: Partial<Shape>) => {
      // Cancel any pending RAF
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }

      // Merge with any pending updates
      pendingUpdateRef.current = {
        ...pendingUpdateRef.current,
        ...updates,
      };

      // Schedule update on next frame
      rafIdRef.current = requestAnimationFrame(() => {
        if (pendingUpdateRef.current) {
          safeUpdate(pendingUpdateRef.current, true);
          pendingUpdateRef.current = null;
        }
        rafIdRef.current = null;
      });
    },
    [safeUpdate]
  );

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  // Resize handlers
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = panelWidth;
  }, [panelWidth]);

  useEffect(() => {
    if (!isResizing) return;

    const handleResizeMove = (e: MouseEvent) => {
      const delta = resizeStartX.current - e.clientX;
      const newWidth = Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, resizeStartWidth.current + delta));
      setPanelWidth(newWidth);
    };

    const handleResizeEnd = () => {
      setIsResizing(false);
      localStorage.setItem('propertiesPanelWidth', panelWidth.toString());
    };

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);

    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing, panelWidth]);

  // Handle fill color change - update local state and throttle canvas update
  const handleFillColorChange = useCallback(
    (color: string) => {
      setLocalFillColor(color);
      latestFillColorRef.current = color; // Track latest color in ref
      // Apply immediately to local canvas, then throttle to Firestore
      safeUpdate({ fill: color }, true);
    },
    [safeUpdate]
  );

  const handleFillColorBlur = useCallback(() => {
    // Cancel any pending RAF updates
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    pendingUpdateRef.current = null;
    // Sync final value to Firebase using the ref (always has latest value)
    safeUpdate({ fill: latestFillColorRef.current }, false);
  }, [safeUpdate]);

  // Handle stroke color change - update local state and throttle canvas update
  const handleStrokeColorChange = useCallback(
    (color: string) => {
      setLocalStrokeColor(color);
      latestStrokeColorRef.current = color; // Track latest color in ref
      // Apply immediately to local canvas, then sync to Firestore on blur
      safeUpdate({ stroke: color }, true);
    },
    [safeUpdate]
  );

  const handleStrokeColorBlur = useCallback(() => {
    // Cancel any pending RAF updates
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    pendingUpdateRef.current = null;
    // Sync final value to Firebase using the ref (always has latest value)
    safeUpdate({ stroke: latestStrokeColorRef.current }, false);
  }, [safeUpdate]);

  // Handle fill toggle
  const handleFillToggle = useCallback(
    (enabled: boolean) => {
      setHasFill(enabled);
      const newColor = enabled ? '#e0e0e0' : 'transparent';
      setLocalFillColor(newColor);
      latestFillColorRef.current = newColor;
      onUpdate({ fill: newColor }, false); // Sync immediately
    },
    [onUpdate]
  );

  // Handle stroke toggle
  const handleStrokeToggle = useCallback(
    (enabled: boolean) => {
      setHasStroke(enabled);
      const newColor = enabled ? '#000000' : 'transparent';
      setLocalStrokeColor(newColor);
      latestStrokeColorRef.current = newColor;
      onUpdate({ stroke: newColor }, false); // Sync immediately
    },
    [onUpdate]
  );

  // Collapsed state - show a thin tab
  if (isCollapsed) {
    return (
      <div 
        className="h-full bg-theme-surface border-l border-theme flex flex-col items-center py-4 relative panel-width-transition"
        style={{ width: '48px' }}
      >
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 hover:bg-theme-surface-hover rounded transition-colors"
          title="Expand properties panel"
        >
          <svg
            className="w-4 h-4 text-theme-secondary transition-transform duration-300 ease-in-out"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-xs text-theme-secondary mt-4 [writing-mode:vertical-lr] rotate-180 uppercase tracking-wider transition-all duration-300 ease-in-out">
          Properties
        </div>
      </div>
    );
  }

  if (!selectedShape) {
    return (
      <div 
        className={`h-full bg-theme-surface border-l border-theme p-4 overflow-y-auto relative ${
          isResizing ? 'resizing' : 'panel-width-transition'
        }`}
        style={{ width: `${panelWidth}px` }}
      >
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 hover:bg-theme-surface-hover rounded transition-colors"
            title="Collapse panel"
          >
            <svg className="w-4 h-4 text-theme-secondary transition-transform duration-300 ease-in-out" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <h3 className="text-sm font-semibold text-theme-primary uppercase tracking-wide">Properties</h3>
        </div>
        <div className="text-center text-theme-secondary text-sm mt-8 transition-all duration-300 ease-in-out">
          {selectedCount > 1 ? (
            <div className="transition-all duration-300 ease-in-out">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="font-medium text-blue-600 dark:text-blue-400">{selectedCount} shapes selected</p>
              <p className="text-xs mt-2 text-theme-secondary opacity-70">Multi-selection active</p>
              <p className="text-xs mt-1 text-theme-secondary opacity-70">Select a single shape to edit properties</p>
            </div>
          ) : (
            <div className="transition-all duration-300 ease-in-out">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-theme-secondary opacity-70"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5"
                />
              </svg>
              <p>Select a shape to edit its properties</p>
            </div>
          )}
        </div>

        {/* Resize Handle */}
        <div
          className={`resize-handle resize-handle-left ${isResizing ? 'resizing' : ''}`}
          onMouseDown={handleResizeStart}
          title="Drag to resize panel"
        />
      </div>
    );
  }

  return (
    <div 
      className={`h-full bg-theme-surface border-l border-theme p-4 overflow-y-auto custom-scrollbar relative ${
        isResizing ? 'resizing' : 'panel-width-transition'
      }`}
      style={{ width: `${panelWidth}px` }}
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
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1 hover:bg-theme-surface-hover rounded transition-colors"
          title="Collapse panel"
        >
          <svg className="w-4 h-4 text-theme-secondary transition-transform duration-300 ease-in-out" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <h3 className="text-sm font-semibold text-theme-primary uppercase tracking-wide">Properties</h3>
      </div>

      {/* Lock Warning */}
      {isLockedByOther && selectedShape?.lockedByName && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg transition-all duration-300 ease-in-out">
          <div className="flex items-center gap-2 text-red-800 text-sm">
            <span>🔒</span>
            <span className="font-medium">Locked by {selectedShape.lockedByName}</span>
          </div>
          <p className="text-xs text-red-600 mt-1">This shape cannot be edited while locked</p>
        </div>
      )}

      <div className="space-y-4 transition-all duration-300 ease-in-out">
        {/* Shape Type */}
        <div className="pb-3 border-b border-theme transition-all duration-300 ease-in-out">
          <div className="text-xs text-theme-secondary uppercase tracking-wide mb-1">Type</div>
          <div className="text-sm font-medium text-theme-primary capitalize">{selectedShape.type}</div>
        </div>


        {/* Position - Only for non-line shapes */}
        {selectedShape.type !== 'line' && (
          <div className="transition-all duration-300 ease-in-out">
            <div className="text-xs text-theme-secondary uppercase tracking-wide mb-2">Position</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-theme-primary mb-1 block">X</label>
                <input
                  type="number"
                  value={Math.round(selectedShape.x)}
                  onChange={(e) => safeUpdate({ x: parseInt(e.target.value) || 0 }, true)}
                  onBlur={(e) => safeUpdate({ x: parseInt(e.target.value) || 0 }, false)}
                  disabled={isLockedByOther}
                  className="w-full px-2 py-1 text-sm bg-theme-surface text-theme-primary border border-theme rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-theme-surface-hover disabled:cursor-not-allowed transition-all duration-200 ease-in-out"
                />
              </div>
              <div>
                <label className="text-xs text-theme-primary mb-1 block">Y</label>
                <input
                  type="number"
                  value={Math.round(selectedShape.y)}
                  onChange={(e) => safeUpdate({ y: parseInt(e.target.value) || 0 }, true)}
                  onBlur={(e) => safeUpdate({ y: parseInt(e.target.value) || 0 }, false)}
                  disabled={isLockedByOther}
                  className="w-full px-2 py-1 text-sm bg-theme-surface text-theme-primary border border-theme rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-theme-surface-hover disabled:cursor-not-allowed transition-all duration-200 ease-in-out"
                />
              </div>
            </div>
          </div>
        )}

        {/* Type-specific Properties */}
        {selectedShape.type === 'rectangle' && (
          <RectangleProperties
            shape={selectedShape as RectangleShape}
            isLockedByOther={isLockedByOther}
            localFillColor={localFillColor}
            localStrokeColor={localStrokeColor}
            hasFill={hasFill}
            hasStroke={hasStroke}
            onUpdate={onUpdate}
            onFillColorChange={handleFillColorChange}
            onFillColorBlur={handleFillColorBlur}
            onStrokeColorChange={handleStrokeColorChange}
            onStrokeColorBlur={handleStrokeColorBlur}
            onFillToggle={handleFillToggle}
            onStrokeToggle={handleStrokeToggle}
            throttledUpdate={throttledUpdate}
          />
        )}

        {selectedShape.type === 'circle' && (
          <CircleProperties
            shape={selectedShape as CircleShape}
            isLockedByOther={isLockedByOther}
            localFillColor={localFillColor}
            localStrokeColor={localStrokeColor}
            hasFill={hasFill}
            hasStroke={hasStroke}
            onUpdate={onUpdate}
            onFillColorChange={handleFillColorChange}
            onFillColorBlur={handleFillColorBlur}
            onStrokeColorChange={handleStrokeColorChange}
            onStrokeColorBlur={handleStrokeColorBlur}
            onFillToggle={handleFillToggle}
            onStrokeToggle={handleStrokeToggle}
            throttledUpdate={throttledUpdate}
          />
        )}

        {selectedShape.type === 'text' && (
          <TextProperties
            shape={selectedShape as TextShape}
            isLockedByOther={isLockedByOther}
            localFillColor={localFillColor}
            hasFill={hasFill}
            onUpdate={onUpdate}
            safeUpdate={safeUpdate}
            onFillColorChange={handleFillColorChange}
            onFillColorBlur={handleFillColorBlur}
            onFillToggle={handleFillToggle}
            throttledUpdate={throttledUpdate}
          />
        )}

        {selectedShape.type === 'line' && (
          <LineProperties
            shape={selectedShape as LineShape}
            isLockedByOther={isLockedByOther}
            localStrokeColor={localStrokeColor}
            hasStroke={hasStroke}
            onUpdate={onUpdate}
            safeUpdate={safeUpdate}
            onStrokeColorChange={handleStrokeColorChange}
            onStrokeColorBlur={handleStrokeColorBlur}
            onStrokeToggle={handleStrokeToggle}
            throttledUpdate={throttledUpdate}
          />
        )}
      </div>

      {/* Resize Handle */}
      <div
        className={`resize-handle resize-handle-left ${isResizing ? 'resizing' : ''}`}
        onMouseDown={handleResizeStart}
        title="Drag to resize panel"
      />
    </div>
  );
}

// Export memoized component to prevent unnecessary re-renders
export const PropertiesPanel = memo(PropertiesPanelComponent, (prevProps, nextProps) => {
  // Check if selection count changed
  if (prevProps.selectedCount !== nextProps.selectedCount) return false;

  // If no shape selected, don't re-render
  if (!prevProps.selectedShape && !nextProps.selectedShape) return true;

  // If one is selected and other isn't, re-render
  if (!prevProps.selectedShape || !nextProps.selectedShape) return false;

  // Compare only properties displayed in PropertiesPanel
  const prev = prevProps.selectedShape;
  const next = nextProps.selectedShape;

  // Check if it's the same shape
  if (prev.id !== next.id || prev.type !== next.type) return false;

  // Check lock state (affects UI)
  if (prev.isLocked !== next.isLocked || prev.lockedBy !== next.lockedBy) return false;

  // Type-specific property comparisons
  if (prev.type === 'rectangle' && next.type === 'rectangle') {
    return (
      prev.name === next.name &&
      prev.x === next.x &&
      prev.y === next.y &&
      prev.width === next.width &&
      prev.height === next.height &&
      (prev.rotation ?? 0) === (next.rotation ?? 0) &&
      prev.fill === next.fill &&
      prev.stroke === next.stroke &&
      prev.strokeWidth === next.strokeWidth &&
      prev.cornerRadius === next.cornerRadius
    );
  }

  if (prev.type === 'circle' && next.type === 'circle') {
    return (
      prev.name === next.name &&
      prev.x === next.x &&
      prev.y === next.y &&
      prev.radius === next.radius &&
      (prev.rotation ?? 0) === (next.rotation ?? 0) &&
      prev.fill === next.fill &&
      prev.stroke === next.stroke &&
      prev.strokeWidth === next.strokeWidth
    );
  }

  if (prev.type === 'text' && next.type === 'text') {
    return (
      prev.name === next.name &&
      prev.x === next.x &&
      prev.y === next.y &&
      prev.text === next.text &&
      prev.fontSize === next.fontSize &&
      prev.fontFamily === next.fontFamily &&
      (prev.fontStyle ?? 'normal') === (next.fontStyle ?? 'normal') &&
      (prev.textDecoration ?? '') === (next.textDecoration ?? '') &&
      (prev.rotation ?? 0) === (next.rotation ?? 0) &&
      prev.fill === next.fill &&
      (prev.width || 0) === (next.width || 0)
    );
  }

  if (prev.type === 'line' && next.type === 'line') {
    return (
      prev.name === next.name &&
      prev.x1 === next.x1 &&
      prev.y1 === next.y1 &&
      prev.x2 === next.x2 &&
      prev.y2 === next.y2 &&
      prev.stroke === next.stroke &&
      prev.strokeWidth === next.strokeWidth &&
      prev.lineCap === next.lineCap
    );
  }

  return true;
});
