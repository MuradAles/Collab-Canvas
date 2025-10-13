/**
 * Properties Panel Component
 * Figma-style right panel for editing shape properties with debounced updates
 */

import { useCallback, useState, useEffect } from 'react';
import type { Shape, RectangleShape, CircleShape, TextShape, StrokePosition } from '../../types';

interface PropertiesPanelProps {
  selectedShape: Shape | null;
  onUpdate: (updates: Partial<Shape>) => void;
}

// Debounce helper
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function PropertiesPanel({ selectedShape, onUpdate }: PropertiesPanelProps) {
  const [fillColor, setFillColor] = useState('');
  const [strokeColor, setStrokeColor] = useState('');
  const [hasFill, setHasFill] = useState(true);
  const [hasStroke, setHasStroke] = useState(true);

  // Debounced values
  const debouncedFillColor = useDebounce(fillColor, 150);
  const debouncedStrokeColor = useDebounce(strokeColor, 150);

  // Update local state when shape changes
  useEffect(() => {
    if (selectedShape && 'fill' in selectedShape) {
      const fill = selectedShape.fill;
      setFillColor(fill);
      setHasFill(fill !== 'transparent');
    }
    if (selectedShape && ('stroke' in selectedShape)) {
      const stroke = (selectedShape as RectangleShape | CircleShape).stroke;
      setStrokeColor(stroke);
      setHasStroke(stroke !== 'transparent');
    }
  }, [selectedShape?.id]);

  // Apply debounced fill color changes
  useEffect(() => {
    if (selectedShape && debouncedFillColor && debouncedFillColor !== (selectedShape as any).fill && hasFill) {
      onUpdate({ fill: debouncedFillColor });
    }
  }, [debouncedFillColor, selectedShape, hasFill, onUpdate]);

  // Apply debounced stroke color changes
  useEffect(() => {
    if (selectedShape && debouncedStrokeColor && ('stroke' in selectedShape) && debouncedStrokeColor !== (selectedShape as RectangleShape | CircleShape).stroke && hasStroke) {
      onUpdate({ stroke: debouncedStrokeColor });
    }
  }, [debouncedStrokeColor, selectedShape, hasStroke, onUpdate]);

  // Handle fill color change (update local state immediately for responsive UI)
  const handleFillColorChange = useCallback((color: string) => {
    setFillColor(color);
  }, []);

  // Handle stroke color change (update local state immediately for responsive UI)
  const handleStrokeColorChange = useCallback((color: string) => {
    setStrokeColor(color);
  }, []);

  // Handle fill toggle
  const handleFillToggle = useCallback((enabled: boolean) => {
    setHasFill(enabled);
    if (enabled) {
      const color = fillColor || '#e0e0e0';
      setFillColor(color);
      onUpdate({ fill: color });
    } else {
      onUpdate({ fill: 'transparent' });
    }
  }, [fillColor, onUpdate]);

  // Handle stroke toggle
  const handleStrokeToggle = useCallback((enabled: boolean) => {
    setHasStroke(enabled);
    if (enabled) {
      const color = strokeColor || '#000000';
      setStrokeColor(color);
      onUpdate({ stroke: color });
    } else {
      onUpdate({ stroke: 'transparent' });
    }
  }, [strokeColor, onUpdate]);

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
                value={Math.round(selectedShape.x)}
                onChange={(e) => onUpdate({ x: parseInt(e.target.value) || 0 })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Y</label>
              <input
                type="number"
                value={Math.round(selectedShape.y)}
                onChange={(e) => onUpdate({ y: parseInt(e.target.value) || 0 })}
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
                    onChange={(e) => onUpdate({ width: parseInt(e.target.value) || 10 })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">H</label>
                  <input
                    type="number"
                    value={Math.round(selectedShape.height)}
                    onChange={(e) => onUpdate({ height: parseInt(e.target.value) || 10 })}
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
                  onChange={(e) => onUpdate({ cornerRadius: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="0"
                  max="500"
                  value={selectedShape.cornerRadius}
                  onChange={(e) => onUpdate({ cornerRadius: parseInt(e.target.value) || 0 })}
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
                    value={fillColor}
                    onChange={(e) => handleFillColorChange(e.target.value)}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={fillColor}
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
                    value={strokeColor}
                    onChange={(e) => handleStrokeColorChange(e.target.value)}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={strokeColor}
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
                    value={selectedShape.strokeWidth}
                    onChange={(e) => onUpdate({ strokeWidth: parseInt(e.target.value) })}
                    className="flex-1"
                  />
                  <input
                    type="number"
                    min="0"
                    max="200"
                    value={selectedShape.strokeWidth}
                    onChange={(e) => onUpdate({ strokeWidth: parseInt(e.target.value) || 0 })}
                    className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Stroke Position */}
            {hasStroke && (
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Stroke Position</div>
                <div className="grid grid-cols-3 gap-1">
                  {(['inside', 'center', 'outside'] as StrokePosition[]).map((position) => (
                    <button
                      key={position}
                      onClick={() => onUpdate({ strokePosition: position })}
                      className={`
                        px-2 py-1.5 text-xs rounded border transition-colors capitalize
                        ${selectedShape.strokePosition === position
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      {position}
                    </button>
                  ))}
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
                onChange={(e) => onUpdate({ radius: parseInt(e.target.value) || 10 })}
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
                    value={fillColor}
                    onChange={(e) => handleFillColorChange(e.target.value)}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={fillColor}
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
                    value={strokeColor}
                    onChange={(e) => handleStrokeColorChange(e.target.value)}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={strokeColor}
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
                    value={selectedShape.strokeWidth}
                    onChange={(e) => onUpdate({ strokeWidth: parseInt(e.target.value) })}
                    className="flex-1"
                  />
                  <input
                    type="number"
                    min="0"
                    max="200"
                    value={selectedShape.strokeWidth}
                    onChange={(e) => onUpdate({ strokeWidth: parseInt(e.target.value) || 0 })}
                    className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Stroke Position */}
            {hasStroke && (
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Stroke Position</div>
                <div className="grid grid-cols-3 gap-1">
                  {(['inside', 'center', 'outside'] as StrokePosition[]).map((position) => (
                    <button
                      key={position}
                      onClick={() => onUpdate({ strokePosition: position })}
                      className={`
                        px-2 py-1.5 text-xs rounded border transition-colors capitalize
                        ${selectedShape.strokePosition === position
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      {position}
                    </button>
                  ))}
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
                value={selectedShape.text}
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
                  value={selectedShape.fontSize}
                  onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="8"
                  max="200"
                  value={selectedShape.fontSize}
                  onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) || 16 })}
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
                    value={fillColor}
                    onChange={(e) => handleFillColorChange(e.target.value)}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={fillColor}
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
