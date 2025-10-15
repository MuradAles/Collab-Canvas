/**
 * Properties Panel Component
 * Figma-style right panel for editing shape properties
 * Optimized with React.memo to prevent unnecessary re-renders
 */

import { useCallback, useState, useEffect, memo, useRef } from 'react';
import type { Shape, TextShape } from '../../types';

interface PropertiesPanelProps {
  selectedShape: Shape | null;
  onUpdate: (updates: Partial<Shape>, localOnly?: boolean) => void;
}

function PropertiesPanelComponent({ selectedShape, onUpdate }: PropertiesPanelProps) {
  const [hasFill, setHasFill] = useState(true);
  const [hasStroke, setHasStroke] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
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
        onUpdate(pendingUpdateRef.current, true);
        pendingUpdateRef.current = null;
      }
      rafIdRef.current = null;
    });
  }, [onUpdate]);

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
    onUpdate({ fill: localFillColor }, false);
  }, [onUpdate, localFillColor]);

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
    onUpdate({ stroke: localStrokeColor }, false);
  }, [onUpdate, localStrokeColor]);

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

      <div className="space-y-4">
        {/* Shape Type */}
        <div className="pb-3 border-b border-gray-200">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Type</div>
          <div className="text-sm font-medium text-gray-900 capitalize">{selectedShape.type}</div>
        </div>

        {/* Position */}
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Position</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-600 mb-1 block">X</label>
              <input
                type="number"
                value={Math.round(selectedShape.x)}
                onChange={(e) => onUpdate({ x: parseInt(e.target.value) || 0 }, true)}
                onBlur={(e) => onUpdate({ x: parseInt(e.target.value) || 0 }, false)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Y</label>
              <input
                type="number"
                value={Math.round(selectedShape.y)}
                onChange={(e) => onUpdate({ y: parseInt(e.target.value) || 0 }, true)}
                onBlur={(e) => onUpdate({ y: parseInt(e.target.value) || 0 }, false)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

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
      </div>
    </div>
  );
}

// Export memoized component to prevent unnecessary re-renders
export const PropertiesPanel = memo(PropertiesPanelComponent, (prevProps, nextProps) => {
  // Only re-render if selectedShape changed
  return (
    prevProps.selectedShape?.id === nextProps.selectedShape?.id &&
    JSON.stringify(prevProps.selectedShape) === JSON.stringify(nextProps.selectedShape)
  );
});


