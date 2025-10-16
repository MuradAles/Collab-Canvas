/**
 * Properties Panel Component
 * Figma-style right panel for editing shape properties
 * Optimized with React.memo to prevent unnecessary re-renders
 */

import { useCallback, useState, useEffect, memo, useRef } from 'react';
import type { Shape, TextShape, LineShape } from '../../types';

interface PropertiesPanelProps {
  selectedShape: Shape | null;
  selectedCount: number;
  onUpdate: (updates: Partial<Shape>, localOnly?: boolean) => void;
  currentUserId?: string;
}

function PropertiesPanelComponent({ selectedShape, selectedCount, onUpdate, currentUserId }: PropertiesPanelProps) {
  const [hasFill, setHasFill] = useState(true);
  const [hasStroke, setHasStroke] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Check if the selected shape is locked by another user (PR #10)
  const isLockedByOther = selectedShape?.isLocked && selectedShape.lockedBy !== currentUserId;
  
  // Wrapped update function that prevents updates when locked (PR #10)
  const safeUpdate = useCallback((updates: Partial<Shape>, localOnly?: boolean) => {
    if (isLockedByOther) return;
    onUpdate(updates, localOnly);
  }, [onUpdate, isLockedByOther]);
  
  // Local state for high-frequency inputs (colors, sliders)
  const [localFillColor, setLocalFillColor] = useState('');
  const [localStrokeColor, setLocalStrokeColor] = useState('');
  
  // Refs for throttling updates
  const rafIdRef = useRef<number | null>(null);
  const pendingUpdateRef = useRef<Partial<Shape> | null>(null);

  // Sync visibility toggles and colors when shape changes
  useEffect(() => {
    if (!selectedShape) return;
    
    if (selectedShape.type === 'rectangle' || selectedShape.type === 'circle') {
      setHasFill(selectedShape.fill !== 'transparent');
      setHasStroke(selectedShape.stroke !== 'transparent');
      setLocalFillColor(selectedShape.fill);
      setLocalStrokeColor(selectedShape.stroke);
    } else if (selectedShape.type === 'text') {
      setHasFill(selectedShape.fill !== 'transparent');
      setLocalFillColor(selectedShape.fill);
    } else if (selectedShape.type === 'line') {
      setHasStroke(selectedShape.stroke !== 'transparent');
      setLocalStrokeColor(selectedShape.stroke);
    }
  }, [selectedShape]);

  // Throttled update using requestAnimationFrame for smooth 60fps updates
  const throttledUpdate = useCallback((updates: Partial<Shape>) => {
    // Cancel any pending RAF
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }
    
    // Merge with any pending updates
    pendingUpdateRef.current = {
      ...pendingUpdateRef.current,
      ...updates
    };
    
    // Schedule update on next frame
    rafIdRef.current = requestAnimationFrame(() => {
      if (pendingUpdateRef.current) {
        safeUpdate(pendingUpdateRef.current, true);
        pendingUpdateRef.current = null;
      }
      rafIdRef.current = null;
    });
  }, [safeUpdate]);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  // Handle fill color change - update local state and throttle canvas update
  const handleFillColorChange = useCallback((color: string) => {
    setLocalFillColor(color);
    throttledUpdate({ fill: color });
  }, [throttledUpdate]);
  
  const handleFillColorBlur = useCallback(() => {
    // Cancel any pending updates and sync final value to Firebase
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    pendingUpdateRef.current = null;
    safeUpdate({ fill: localFillColor }, false);
  }, [safeUpdate, localFillColor]);

  // Handle stroke color change - update local state and throttle canvas update
  const handleStrokeColorChange = useCallback((color: string) => {
    setLocalStrokeColor(color);
    throttledUpdate({ stroke: color });
  }, [throttledUpdate]);
  
  const handleStrokeColorBlur = useCallback(() => {
    // Cancel any pending updates and sync final value to Firebase
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    pendingUpdateRef.current = null;
    safeUpdate({ stroke: localStrokeColor }, false);
  }, [safeUpdate, localStrokeColor]);

  // Handle fill toggle
  const handleFillToggle = useCallback((enabled: boolean) => {
    setHasFill(enabled);
    const newColor = enabled ? '#e0e0e0' : 'transparent';
    setLocalFillColor(newColor);
    onUpdate({ fill: newColor }, false); // Sync immediately
  }, [onUpdate]);

  // Handle stroke toggle
  const handleStrokeToggle = useCallback((enabled: boolean) => {
    setHasStroke(enabled);
    const newColor = enabled ? '#000000' : 'transparent';
    setLocalStrokeColor(newColor);
    onUpdate({ stroke: newColor }, false); // Sync immediately
  }, [onUpdate]);

  // Collapsed state - show a thin tab
  if (isCollapsed) {
    return (
      <div className="w-12 bg-white border-l border-gray-200 flex flex-col items-center py-4 transition-all duration-300">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Expand properties panel"
        >
          <svg 
            className="w-4 h-4 text-gray-600 rotate-180"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-xs text-gray-500 mt-4 [writing-mode:vertical-lr] rotate-180 uppercase tracking-wider">
          Properties
        </div>
      </div>
    );
  }

  if (!selectedShape) {
    return (
      <div className="w-64 bg-white border-l border-gray-200 p-4 overflow-y-auto transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Properties
          </h3>
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Collapse panel"
          >
            <svg 
              className="w-4 h-4 text-gray-600"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
        <div className="text-center text-gray-500 text-sm mt-8">
          {selectedCount > 1 ? (
            <>
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
              <p className="font-medium text-blue-600">{selectedCount} shapes selected</p>
              <p className="text-xs mt-2 text-gray-400">Multi-selection active</p>
              <p className="text-xs mt-1 text-gray-400">Select a single shape to edit properties</p>
            </>
          ) : (
            <>
              <svg
                className="w-12 h-12 mx-auto mb-3 text-gray-400"
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
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-white border-l border-gray-200 p-4 overflow-y-auto transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Properties
        </h3>
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="Collapse panel"
        >
          <svg 
            className="w-4 h-4 text-gray-600"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Lock Warning (PR #10) */}
      {isLockedByOther && selectedShape?.lockedByName && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800 text-sm">
            <span>🔒</span>
            <span className="font-medium">Locked by {selectedShape.lockedByName}</span>
          </div>
          <p className="text-xs text-red-600 mt-1">
            This shape cannot be edited while locked
          </p>
        </div>
      )}

      <div className="space-y-4">
        {/* Shape Type */}
        <div className="pb-3 border-b border-gray-200">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Type</div>
          <div className="text-sm font-medium text-gray-900 capitalize">{selectedShape.type}</div>
        </div>

        {/* Position - Only for non-line shapes (lines use x1, y1, x2, y2) */}
        {selectedShape.type !== 'line' && (
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Position</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">X</label>
                <input
                  type="number"
                  value={Math.round(selectedShape.x)}
                  onChange={(e) => safeUpdate({ x: parseInt(e.target.value) || 0 }, true)}
                  onBlur={(e) => safeUpdate({ x: parseInt(e.target.value) || 0 }, false)}
                  disabled={isLockedByOther}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Y</label>
                <input
                  type="number"
                  value={Math.round(selectedShape.y)}
                  onChange={(e) => safeUpdate({ y: parseInt(e.target.value) || 0 }, true)}
                  onBlur={(e) => safeUpdate({ y: parseInt(e.target.value) || 0 }, false)}
                  disabled={isLockedByOther}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        )}

        {/* Rectangle Properties */}
        {selectedShape.type === 'rectangle' && (
          <>
            {/* Size */}
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Size</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">W</label>
                  <input
                    type="number"
                    value={Math.round(selectedShape.width)}
                    onChange={(e) => onUpdate({ width: parseInt(e.target.value) || 10 }, true)}
                    onBlur={(e) => onUpdate({ width: parseInt(e.target.value) || 10 }, false)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">H</label>
                  <input
                    type="number"
                    value={Math.round(selectedShape.height)}
                    onChange={(e) => onUpdate({ height: parseInt(e.target.value) || 10 }, true)}
                    onBlur={(e) => onUpdate({ height: parseInt(e.target.value) || 10 }, false)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Corner Radius */}
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Corner Radius</div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={selectedShape.cornerRadius}
                  onChange={(e) => throttledUpdate({ cornerRadius: parseInt(e.target.value) })}
                  onMouseUp={(e) => onUpdate({ cornerRadius: parseInt((e.target as HTMLInputElement).value) }, false)}
                  onTouchEnd={(e) => onUpdate({ cornerRadius: parseInt((e.target as HTMLInputElement).value) }, false)}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="0"
                  max="500"
                  value={selectedShape.cornerRadius}
                  onChange={(e) => throttledUpdate({ cornerRadius: parseInt(e.target.value) || 0 })}
                  onBlur={(e) => onUpdate({ cornerRadius: parseInt(e.target.value) || 0 }, false)}
                  className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Fill Color */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-gray-500 uppercase tracking-wide">Fill</div>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasFill}
                    onChange={(e) => handleFillToggle(e.target.checked)}
                    className="w-3 h-3 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-600">Visible</span>
                </label>
              </div>
              {hasFill && (
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={localFillColor}
                    onChange={(e) => handleFillColorChange(e.target.value)}
                    onBlur={handleFillColorBlur}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={localFillColor}
                    onChange={(e) => handleFillColorChange(e.target.value)}
                    onBlur={handleFillColorBlur}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase"
                    placeholder="#000000"
                  />
                </div>
              )}
              {!hasFill && (
                <div className="text-xs text-gray-400 italic">Transparent</div>
              )}
            </div>

            {/* Stroke Color */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-gray-500 uppercase tracking-wide">Stroke</div>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasStroke}
                    onChange={(e) => handleStrokeToggle(e.target.checked)}
                    className="w-3 h-3 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-600">Visible</span>
                </label>
              </div>
              {hasStroke && (
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={localStrokeColor}
                    onChange={(e) => handleStrokeColorChange(e.target.value)}
                    onBlur={handleStrokeColorBlur}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={localStrokeColor}
                    onChange={(e) => handleStrokeColorChange(e.target.value)}
                    onBlur={handleStrokeColorBlur}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase"
                    placeholder="#000000"
                  />
                </div>
              )}
              {!hasStroke && (
                <div className="text-xs text-gray-400 italic">No stroke</div>
              )}
            </div>

            {/* Stroke Width */}
            {hasStroke && (
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Stroke Width</div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={selectedShape.strokeWidth}
                    onChange={(e) => throttledUpdate({ strokeWidth: parseInt(e.target.value) })}
                    onMouseUp={(e) => onUpdate({ strokeWidth: parseInt((e.target as HTMLInputElement).value) }, false)}
                    onTouchEnd={(e) => onUpdate({ strokeWidth: parseInt((e.target as HTMLInputElement).value) }, false)}
                    className="flex-1"
                  />
                  <input
                    type="number"
                    min="0"
                    max="200"
                    value={selectedShape.strokeWidth}
                    onChange={(e) => throttledUpdate({ strokeWidth: parseInt(e.target.value) || 0 })}
                    onBlur={(e) => onUpdate({ strokeWidth: parseInt(e.target.value) || 0 }, false)}
                    className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

          </>
        )}

        {/* Circle Properties */}
        {selectedShape.type === 'circle' && (
          <>
            {/* Radius */}
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Radius</div>
              <input
                type="number"
                value={Math.round(selectedShape.radius)}
                onChange={(e) => onUpdate({ radius: parseInt(e.target.value) || 10 }, true)}
                onBlur={(e) => onUpdate({ radius: parseInt(e.target.value) || 10 }, false)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Fill Color */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-gray-500 uppercase tracking-wide">Fill</div>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasFill}
                    onChange={(e) => handleFillToggle(e.target.checked)}
                    className="w-3 h-3 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-600">Visible</span>
                </label>
              </div>
              {hasFill && (
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={localFillColor}
                    onChange={(e) => handleFillColorChange(e.target.value)}
                    onBlur={handleFillColorBlur}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={localFillColor}
                    onChange={(e) => handleFillColorChange(e.target.value)}
                    onBlur={handleFillColorBlur}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase"
                    placeholder="#000000"
                  />
                </div>
              )}
              {!hasFill && (
                <div className="text-xs text-gray-400 italic">Transparent</div>
              )}
            </div>

            {/* Stroke Color */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-gray-500 uppercase tracking-wide">Stroke</div>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasStroke}
                    onChange={(e) => handleStrokeToggle(e.target.checked)}
                    className="w-3 h-3 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-600">Visible</span>
                </label>
              </div>
              {hasStroke && (
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={localStrokeColor}
                    onChange={(e) => handleStrokeColorChange(e.target.value)}
                    onBlur={handleStrokeColorBlur}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={localStrokeColor}
                    onChange={(e) => handleStrokeColorChange(e.target.value)}
                    onBlur={handleStrokeColorBlur}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase"
                    placeholder="#000000"
                  />
                </div>
              )}
              {!hasStroke && (
                <div className="text-xs text-gray-400 italic">No stroke</div>
              )}
            </div>

            {/* Stroke Width */}
            {hasStroke && (
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Stroke Width</div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={selectedShape.strokeWidth}
                    onChange={(e) => throttledUpdate({ strokeWidth: parseInt(e.target.value) })}
                    onMouseUp={(e) => onUpdate({ strokeWidth: parseInt((e.target as HTMLInputElement).value) }, false)}
                    onTouchEnd={(e) => onUpdate({ strokeWidth: parseInt((e.target as HTMLInputElement).value) }, false)}
                    className="flex-1"
                  />
                  <input
                    type="number"
                    min="0"
                    max="200"
                    value={selectedShape.strokeWidth}
                    onChange={(e) => throttledUpdate({ strokeWidth: parseInt(e.target.value) || 0 })}
                    onBlur={(e) => onUpdate({ strokeWidth: parseInt(e.target.value) || 0 }, false)}
                    className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

          </>
        )}

        {/* Text Properties */}
        {selectedShape.type === 'text' && (
          <>
            {/* Text Content */}
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Text</div>
              <textarea
                value={(selectedShape as TextShape).text}
                onChange={(e) => onUpdate({ text: e.target.value }, true)}
                onBlur={(e) => onUpdate({ text: e.target.value }, false)}
                rows={3}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Enter text..."
              />
            </div>

            {/* Font Size */}
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Font Size</div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="8"
                  max="72"
                  value={selectedShape.fontSize}
                  onChange={(e) => throttledUpdate({ fontSize: parseInt(e.target.value) })}
                  onMouseUp={(e) => onUpdate({ fontSize: parseInt((e.target as HTMLInputElement).value) }, false)}
                  onTouchEnd={(e) => onUpdate({ fontSize: parseInt((e.target as HTMLInputElement).value) }, false)}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="8"
                  max="200"
                  value={selectedShape.fontSize}
                  onChange={(e) => throttledUpdate({ fontSize: parseInt(e.target.value) || 16 })}
                  onBlur={(e) => onUpdate({ fontSize: parseInt(e.target.value) || 16 }, false)}
                  className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Text Formatting */}
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Formatting</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const currentStyle = selectedShape.fontStyle || 'normal';
                    const isBold = currentStyle.includes('bold');
                    const isItalic = currentStyle.includes('italic');
                    let newStyle = 'normal';
                    if (!isBold && isItalic) newStyle = 'bold italic';
                    else if (!isBold && !isItalic) newStyle = 'bold';
                    else if (isBold && isItalic) newStyle = 'italic';
                    safeUpdate({ fontStyle: newStyle });
                  }}
                  disabled={isLockedByOther}
                  className={`flex-1 px-3 py-2 text-sm font-bold border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    (selectedShape.fontStyle || 'normal').includes('bold')
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title="Bold"
                >
                  B
                </button>
                <button
                  onClick={() => {
                    const currentStyle = selectedShape.fontStyle || 'normal';
                    const isBold = currentStyle.includes('bold');
                    const isItalic = currentStyle.includes('italic');
                    let newStyle = 'normal';
                    if (isBold && !isItalic) newStyle = 'bold italic';
                    else if (!isBold && !isItalic) newStyle = 'italic';
                    else if (isBold && isItalic) newStyle = 'bold';
                    safeUpdate({ fontStyle: newStyle });
                  }}
                  disabled={isLockedByOther}
                  className={`flex-1 px-3 py-2 text-sm italic border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    (selectedShape.fontStyle || 'normal').includes('italic')
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title="Italic"
                >
                  I
                </button>
                <button
                  onClick={() => {
                    const currentDecoration = selectedShape.textDecoration || '';
                    const isUnderlined = currentDecoration === 'underline';
                    safeUpdate({ textDecoration: isUnderlined ? '' : 'underline' });
                  }}
                  disabled={isLockedByOther}
                  className={`flex-1 px-3 py-2 text-sm underline border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    selectedShape.textDecoration === 'underline'
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title="Underline"
                >
                  U
                </button>
              </div>
            </div>

            {/* Text Color */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-gray-500 uppercase tracking-wide">Color</div>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasFill}
                    onChange={(e) => handleFillToggle(e.target.checked)}
                    className="w-3 h-3 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-600">Visible</span>
                </label>
              </div>
              {hasFill && (
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={localFillColor}
                    onChange={(e) => handleFillColorChange(e.target.value)}
                    onBlur={handleFillColorBlur}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={localFillColor}
                    onChange={(e) => handleFillColorChange(e.target.value)}
                    onBlur={handleFillColorBlur}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase"
                    placeholder="#000000"
                  />
                </div>
              )}
              {!hasFill && (
                <div className="text-xs text-gray-400 italic">Transparent</div>
              )}
            </div>
          </>
        )}

        {/* Line Properties */}
        {selectedShape.type === 'line' && (
          <>
            {/* Start Point */}
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Start Point</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">X1</label>
                  <input
                    type="number"
                    value={Math.round((selectedShape as LineShape).x1)}
                    onChange={(e) => safeUpdate({ x1: parseInt(e.target.value) || 0 }, true)}
                    onBlur={(e) => safeUpdate({ x1: parseInt(e.target.value) || 0 }, false)}
                    disabled={isLockedByOther}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Y1</label>
                  <input
                    type="number"
                    value={Math.round((selectedShape as LineShape).y1)}
                    onChange={(e) => safeUpdate({ y1: parseInt(e.target.value) || 0 }, true)}
                    onBlur={(e) => safeUpdate({ y1: parseInt(e.target.value) || 0 }, false)}
                    disabled={isLockedByOther}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* End Point */}
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">End Point</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">X2</label>
                  <input
                    type="number"
                    value={Math.round((selectedShape as LineShape).x2)}
                    onChange={(e) => safeUpdate({ x2: parseInt(e.target.value) || 0 }, true)}
                    onBlur={(e) => safeUpdate({ x2: parseInt(e.target.value) || 0 }, false)}
                    disabled={isLockedByOther}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Y2</label>
                  <input
                    type="number"
                    value={Math.round((selectedShape as LineShape).y2)}
                    onChange={(e) => safeUpdate({ y2: parseInt(e.target.value) || 0 }, true)}
                    onBlur={(e) => safeUpdate({ y2: parseInt(e.target.value) || 0 }, false)}
                    disabled={isLockedByOther}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Line Stroke */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-gray-500 uppercase tracking-wide">Stroke</div>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasStroke}
                    onChange={(e) => handleStrokeToggle(e.target.checked)}
                    disabled={isLockedByOther}
                    className="w-3 h-3 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed"
                  />
                  <span className="text-xs text-gray-600">Visible</span>
                </label>
              </div>
              {hasStroke && (
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={localStrokeColor}
                    onChange={(e) => handleStrokeColorChange(e.target.value)}
                    onBlur={handleStrokeColorBlur}
                    disabled={isLockedByOther}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <input
                    type="text"
                    value={localStrokeColor}
                    onChange={(e) => handleStrokeColorChange(e.target.value)}
                    onBlur={handleStrokeColorBlur}
                    disabled={isLockedByOther}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="#000000"
                  />
                </div>
              )}
              {!hasStroke && (
                <div className="text-xs text-gray-400 italic">Transparent</div>
              )}
            </div>

            {/* Line Width */}
            {hasStroke && (
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Stroke Width</div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={(selectedShape as LineShape).strokeWidth}
                    onChange={(e) => throttledUpdate({ strokeWidth: parseInt(e.target.value) })}
                    onMouseUp={(e) => onUpdate({ strokeWidth: parseInt((e.target as HTMLInputElement).value) }, false)}
                    onTouchEnd={(e) => onUpdate({ strokeWidth: parseInt((e.target as HTMLInputElement).value) }, false)}
                    disabled={isLockedByOther}
                    className="flex-1 disabled:cursor-not-allowed"
                  />
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={(selectedShape as LineShape).strokeWidth}
                    onChange={(e) => throttledUpdate({ strokeWidth: parseInt(e.target.value) || 1 })}
                    onBlur={(e) => onUpdate({ strokeWidth: parseInt(e.target.value) || 1 }, false)}
                    disabled={isLockedByOther}
                    className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            )}

            {/* Line Cap */}
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Line Cap</div>
              <select
                value={(selectedShape as LineShape).lineCap}
                onChange={(e) => safeUpdate({ lineCap: e.target.value as 'butt' | 'round' | 'square' })}
                disabled={isLockedByOther}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="butt">Butt</option>
                <option value="round">Round</option>
                <option value="square">Square</option>
              </select>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Export memoized component to prevent unnecessary re-renders
export const PropertiesPanel = memo(PropertiesPanelComponent, (prevProps, nextProps) => {
  // Only re-render if selectedShape or selectedCount changed
  // Compare only properties that affect PropertiesPanel UI (not JSON.stringify - too expensive!)
  
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
  
  // Type-specific property comparisons (only properties shown in PropertiesPanel)
  if (prev.type === 'rectangle' && next.type === 'rectangle') {
    return (
      prev.name === next.name &&
      prev.x === next.x &&
      prev.y === next.y &&
      prev.width === next.width &&
      prev.height === next.height &&
      prev.rotation === next.rotation &&
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
      prev.rotation === next.rotation &&
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
      prev.fontStyle === next.fontStyle &&
      prev.textDecoration === next.textDecoration &&
      prev.rotation === next.rotation &&
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


