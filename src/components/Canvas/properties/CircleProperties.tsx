/**
 * CircleProperties Component
 * Property controls specific to circle shapes
 */

import { memo } from 'react';
import type { CircleShape } from '../../../types';

interface CirclePropertiesProps {
  shape: CircleShape;
  isLockedByOther: boolean;
  localFillColor: string;
  localStrokeColor: string;
  hasFill: boolean;
  hasStroke: boolean;
  onUpdate: (updates: Partial<CircleShape>, localOnly?: boolean) => void;
  onFillColorChange: (color: string) => void;
  onFillColorBlur: () => void;
  onStrokeColorChange: (color: string) => void;
  onStrokeColorBlur: () => void;
  onFillToggle: (enabled: boolean) => void;
  onStrokeToggle: (enabled: boolean) => void;
  throttledUpdate: (updates: Partial<CircleShape>) => void;
}

function CirclePropertiesComponent({
  shape,
  isLockedByOther,
  localFillColor,
  localStrokeColor,
  hasFill,
  hasStroke,
  onUpdate,
  onFillColorChange,
  onFillColorBlur,
  onStrokeColorChange,
  onStrokeColorBlur,
  onFillToggle,
  onStrokeToggle,
  throttledUpdate,
}: CirclePropertiesProps) {
  return (
    <>
      {/* Radius */}
      <div>
        <div className="text-xs text-theme-secondary uppercase tracking-wide mb-2">Radius</div>
        <input
          type="number"
          value={Math.round(shape.radius)}
          onChange={(e) => onUpdate({ radius: parseInt(e.target.value) || 10 }, true)}
          onBlur={(e) => onUpdate({ radius: parseInt(e.target.value) || 10 }, false)}
          disabled={isLockedByOther}
          className="w-full px-2 py-1 text-sm bg-theme-surface text-theme-primary border border-theme rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-theme-surface-hover disabled:cursor-not-allowed"
        />
      </div>

      {/* Fill Color */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-theme-secondary uppercase tracking-wide">Fill</div>
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={hasFill}
              onChange={(e) => onFillToggle(e.target.checked)}
              disabled={isLockedByOther}
              className="w-3 h-3 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed"
            />
            <span className="text-xs text-theme-primary">Visible</span>
          </label>
        </div>
        {hasFill && (
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={localFillColor}
              onChange={(e) => onFillColorChange(e.target.value)}
              onBlur={onFillColorBlur}
              disabled={isLockedByOther}
              className="w-12 h-10 rounded border border-theme cursor-pointer disabled:cursor-not-allowed"
            />
            <input
              type="text"
              value={localFillColor}
              onChange={(e) => onFillColorChange(e.target.value)}
              onBlur={onFillColorBlur}
              disabled={isLockedByOther}
              className="flex-1 px-2 py-1 text-sm bg-theme-surface text-theme-primary border border-theme rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase disabled:bg-theme-surface-hover disabled:cursor-not-allowed"
              placeholder="#000000"
            />
          </div>
        )}
        {!hasFill && <div className="text-xs text-theme-secondary opacity-70 italic">Transparent</div>}
      </div>

      {/* Stroke Color */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-theme-secondary uppercase tracking-wide">Stroke</div>
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={hasStroke}
              onChange={(e) => onStrokeToggle(e.target.checked)}
              disabled={isLockedByOther}
              className="w-3 h-3 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed"
            />
            <span className="text-xs text-theme-primary">Visible</span>
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
              className="w-12 h-10 rounded border border-theme cursor-pointer disabled:cursor-not-allowed"
            />
            <input
              type="text"
              value={localStrokeColor}
              onChange={(e) => onStrokeColorChange(e.target.value)}
              onBlur={onStrokeColorBlur}
              disabled={isLockedByOther}
              className="flex-1 px-2 py-1 text-sm bg-theme-surface text-theme-primary border border-theme rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase disabled:bg-theme-surface-hover disabled:cursor-not-allowed"
              placeholder="#000000"
            />
          </div>
        )}
        {!hasStroke && <div className="text-xs text-theme-secondary opacity-70 italic">No stroke</div>}
      </div>

      {/* Stroke Width */}
      {hasStroke && (
        <div>
          <div className="text-xs text-theme-secondary uppercase tracking-wide mb-2">Stroke Width</div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="50"
              value={shape.strokeWidth}
              onChange={(e) => throttledUpdate({ strokeWidth: parseInt(e.target.value) })}
              onMouseUp={(e) => onUpdate({ strokeWidth: parseInt((e.target as HTMLInputElement).value) }, false)}
              onTouchEnd={(e) => onUpdate({ strokeWidth: parseInt((e.target as HTMLInputElement).value) }, false)}
              disabled={isLockedByOther}
              className="flex-1 disabled:cursor-not-allowed"
            />
            <input
              type="number"
              min="0"
              max="200"
              value={shape.strokeWidth}
              onChange={(e) => throttledUpdate({ strokeWidth: parseInt(e.target.value) || 0 })}
              onBlur={(e) => onUpdate({ strokeWidth: parseInt(e.target.value) || 0 }, false)}
              disabled={isLockedByOther}
              className="w-16 px-2 py-1 text-sm bg-theme-surface text-theme-primary border border-theme rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-theme-surface-hover disabled:cursor-not-allowed"
            />
          </div>
        </div>
      )}
    </>
  );
}

export const CircleProperties = memo(CirclePropertiesComponent);

