/**
 * Properties Panel Component
 * Figma-style right panel for editing shape properties
 * Optimized with React.memo to prevent unnecessary re-renders
 */

import { useCallback, useState, useEffect, memo } from 'react';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import type { Shape, RectangleShape, CircleShape, TextShape } from '../../types';

interface PropertiesPanelProps {
  selectedShape: Shape | null;
  onUpdate: (updates: Partial<Shape>) => void;
}

function PropertiesPanelComponent({ selectedShape, onUpdate }: PropertiesPanelProps) {
  const [hasFill, setHasFill] = useState(true);
  const [hasStroke, setHasStroke] = useState(true);
  
  // Local state for input values (for immediate UI feedback)
  const [localX, setLocalX] = useState(0);
  const [localY, setLocalY] = useState(0);
  const [localWidth, setLocalWidth] = useState(0);
  const [localHeight, setLocalHeight] = useState(0);
  const [localRadius, setLocalRadius] = useState(0);
  const [localCornerRadius, setLocalCornerRadius] = useState(0);
  const [localStrokeWidth, setLocalStrokeWidth] = useState(0);
  const [localFontSize, setLocalFontSize] = useState(16);
  
  // Debounced values (only update database after 300ms of no changes)
  const debouncedX = useDebouncedValue(localX, 300);
  const debouncedY = useDebouncedValue(localY, 300);
  const debouncedWidth = useDebouncedValue(localWidth, 300);
  const debouncedHeight = useDebouncedValue(localHeight, 300);
  const debouncedRadius = useDebouncedValue(localRadius, 300);
  const debouncedCornerRadius = useDebouncedValue(localCornerRadius, 300);
  const debouncedStrokeWidth = useDebouncedValue(localStrokeWidth, 300);
  const debouncedFontSize = useDebouncedValue(localFontSize, 300);

  // Sync local state when shape changes
  useEffect(() => {
    if (!selectedShape) return;
    
    setLocalX(Math.round(selectedShape.x));
    setLocalY(Math.round(selectedShape.y));
    
    if (selectedShape.type === 'rectangle') {
      setLocalWidth(Math.round(selectedShape.width));
      setLocalHeight(Math.round(selectedShape.height));
      setLocalCornerRadius(selectedShape.cornerRadius);
      setLocalStrokeWidth(selectedShape.strokeWidth);
      setHasFill(selectedShape.fill !== 'transparent');
      setHasStroke(selectedShape.stroke !== 'transparent');
    } else if (selectedShape.type === 'circle') {
      setLocalRadius(Math.round(selectedShape.radius));
      setLocalStrokeWidth(selectedShape.strokeWidth);
      setHasFill(selectedShape.fill !== 'transparent');
      setHasStroke(selectedShape.stroke !== 'transparent');
    } else if (selectedShape.type === 'text') {
      setLocalFontSize(selectedShape.fontSize);
    }
  }, [selectedShape?.id]);
  
  // Update database when debounced values change
  useEffect(() => {
    if (!selectedShape) return;
    if (Math.round(selectedShape.x) !== debouncedX) {
      onUpdate({ x: debouncedX });
    }
  }, [debouncedX]);
  
  useEffect(() => {
    if (!selectedShape) return;
    if (Math.round(selectedShape.y) !== debouncedY) {
      onUpdate({ y: debouncedY });
    }
  }, [debouncedY]);
  
  useEffect(() => {
    if (!selectedShape || selectedShape.type !== 'rectangle') return;
    if (Math.round(selectedShape.width) !== debouncedWidth) {
      onUpdate({ width: debouncedWidth });
    }
  }, [debouncedWidth]);
  
  useEffect(() => {
    if (!selectedShape || selectedShape.type !== 'rectangle') return;
    if (Math.round(selectedShape.height) !== debouncedHeight) {
      onUpdate({ height: debouncedHeight });
    }
  }, [debouncedHeight]);
  
  useEffect(() => {
    if (!selectedShape || selectedShape.type !== 'circle') return;
    if (Math.round(selectedShape.radius) !== debouncedRadius) {
      onUpdate({ radius: debouncedRadius });
    }
  }, [debouncedRadius]);
  
  useEffect(() => {
    if (!selectedShape || selectedShape.type !== 'rectangle') return;
    if (selectedShape.cornerRadius !== debouncedCornerRadius) {
      onUpdate({ cornerRadius: debouncedCornerRadius });
    }
  }, [debouncedCornerRadius]);
  
  useEffect(() => {
    if (!selectedShape || (selectedShape.type !== 'rectangle' && selectedShape.type !== 'circle')) return;
    const currentStrokeWidth = (selectedShape as RectangleShape | CircleShape).strokeWidth;
    if (currentStrokeWidth !== debouncedStrokeWidth) {
      onUpdate({ strokeWidth: debouncedStrokeWidth });
    }
  }, [debouncedStrokeWidth]);
  
  useEffect(() => {
    if (!selectedShape || selectedShape.type !== 'text') return;
    if (selectedShape.fontSize !== debouncedFontSize) {
      onUpdate({ fontSize: debouncedFontSize });
    }
  }, [debouncedFontSize]);

  // Handle fill color change - apply immediately
  const handleFillColorChange = useCallback((color: string) => {
    onUpdate({ fill: color });
  }, [onUpdate]);

  // Handle stroke color change - apply immediately
  const handleStrokeColorChange = useCallback((color: string) => {
    onUpdate({ stroke: color });
  }, [onUpdate]);

  // Handle fill toggle
  const handleFillToggle = useCallback((enabled: boolean) => {
    setHasFill(enabled);
    if (enabled) {
      onUpdate({ fill: '#e0e0e0' });
    } else {
      onUpdate({ fill: 'transparent' });
    }
  }, [onUpdate]);

  // Handle stroke toggle
  const handleStrokeToggle = useCallback((enabled: boolean) => {
    setHasStroke(enabled);
    if (enabled) {
      onUpdate({ stroke: '#000000' });
    } else {
      onUpdate({ stroke: 'transparent' });
    }
  }, [onUpdate]);

  if (!selectedShape) {
    return (
      <div className="w-64 bg-white border-l border-gray-200 p-4 overflow-y-auto">
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
    <div className="w-64 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
        Properties
      </h3>

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
                value={localX}
                onChange={(e) => setLocalX(parseInt(e.target.value) || 0)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Y</label>
              <input
                type="number"
                value={localY}
                onChange={(e) => setLocalY(parseInt(e.target.value) || 0)}
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
                    value={localWidth}
                    onChange={(e) => setLocalWidth(parseInt(e.target.value) || 10)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">H</label>
                  <input
                    type="number"
                    value={localHeight}
                    onChange={(e) => setLocalHeight(parseInt(e.target.value) || 10)}
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
                  value={localCornerRadius}
                  onChange={(e) => setLocalCornerRadius(parseInt(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="0"
                  max="500"
                  value={localCornerRadius}
                  onChange={(e) => setLocalCornerRadius(parseInt(e.target.value) || 0)}
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
                    value={selectedShape.fill}
                    onChange={(e) => handleFillColorChange(e.target.value)}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={selectedShape.fill}
                    onChange={(e) => handleFillColorChange(e.target.value)}
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
                    value={(selectedShape as RectangleShape).stroke}
                    onChange={(e) => handleStrokeColorChange(e.target.value)}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={(selectedShape as RectangleShape).stroke}
                    onChange={(e) => handleStrokeColorChange(e.target.value)}
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
                    value={localStrokeWidth}
                    onChange={(e) => setLocalStrokeWidth(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <input
                    type="number"
                    min="0"
                    max="200"
                    value={localStrokeWidth}
                    onChange={(e) => setLocalStrokeWidth(parseInt(e.target.value) || 0)}
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
                value={localRadius}
                onChange={(e) => setLocalRadius(parseInt(e.target.value) || 10)}
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
                    value={(selectedShape as CircleShape).fill}
                    onChange={(e) => handleFillColorChange(e.target.value)}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={(selectedShape as CircleShape).fill}
                    onChange={(e) => handleFillColorChange(e.target.value)}
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
                    value={(selectedShape as CircleShape).stroke}
                    onChange={(e) => handleStrokeColorChange(e.target.value)}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={(selectedShape as CircleShape).stroke}
                    onChange={(e) => handleStrokeColorChange(e.target.value)}
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
                    value={localStrokeWidth}
                    onChange={(e) => setLocalStrokeWidth(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <input
                    type="number"
                    min="0"
                    max="200"
                    value={localStrokeWidth}
                    onChange={(e) => setLocalStrokeWidth(parseInt(e.target.value) || 0)}
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
                onChange={(e) => onUpdate({ text: e.target.value })}
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
                  value={localFontSize}
                  onChange={(e) => setLocalFontSize(parseInt(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="8"
                  max="200"
                  value={localFontSize}
                  onChange={(e) => setLocalFontSize(parseInt(e.target.value) || 16)}
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
                    value={(selectedShape as TextShape).fill}
                    onChange={(e) => handleFillColorChange(e.target.value)}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={(selectedShape as TextShape).fill}
                    onChange={(e) => handleFillColorChange(e.target.value)}
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
