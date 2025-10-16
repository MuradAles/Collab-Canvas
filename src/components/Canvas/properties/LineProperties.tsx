/**
 * LineProperties Component
 * Property controls specific to line shapes
 */

import { memo } from 'react';
import type { LineShape } from '../../../types';

interface LinePropertiesProps {
  shape: LineShape;
  isLockedByOther: boolean;
  localStrokeColor: string;
  hasStroke: boolean;
  onUpdate: (updates: Partial<LineShape>, localOnly?: boolean) => void;
  safeUpdate: (updates: Partial<LineShape>, localOnly?: boolean) => void;
  onStrokeColorChange: (color: string) => void;
  onStrokeColorBlur: () => void;
  onStrokeToggle: (enabled: boolean) => void;
  throttledUpdate: (updates: Partial<LineShape>) => void;
}

function LinePropertiesComponent({
  shape,
  isLockedByOther,
  localStrokeColor,
  hasStroke,
  onUpdate,
  safeUpdate,
  onStrokeColorChange,
  onStrokeColorBlur,
  onStrokeToggle,
  throttledUpdate,
}: LinePropertiesProps) {
  return (
    <>
      {/* Start Point */}
      <div>
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Start Point</div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-600 mb-1 block">X1</label>
            <input
              type="number"
              value={Math.round(shape.x1)}
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
              value={Math.round(shape.y1)}
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
              value={Math.round(shape.x2)}
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
              value={Math.round(shape.y2)}
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
              onChange={(e) => onStrokeToggle(e.target.checked)}
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
              onChange={(e) => onStrokeColorChange(e.target.value)}
              onBlur={onStrokeColorBlur}
              disabled={isLockedByOther}
              className="w-12 h-10 rounded border border-gray-300 cursor-pointer disabled:cursor-not-allowed"
            />
            <input
              type="text"
              value={localStrokeColor}
              onChange={(e) => onStrokeColorChange(e.target.value)}
              onBlur={onStrokeColorBlur}
              disabled={isLockedByOther}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="#000000"
            />
          </div>
        )}
        {!hasStroke && <div className="text-xs text-gray-400 italic">Transparent</div>}
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
              value={shape.strokeWidth}
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
              value={shape.strokeWidth}
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
          value={shape.lineCap}
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
  );
}

export const LineProperties = memo(LinePropertiesComponent);

