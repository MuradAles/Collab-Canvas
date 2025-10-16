/**
 * TextProperties Component
 * Property controls specific to text shapes
 */

import { memo } from 'react';
import type { TextShape } from '../../../types';

interface TextPropertiesProps {
  shape: TextShape;
  isLockedByOther: boolean;
  localFillColor: string;
  hasFill: boolean;
  onUpdate: (updates: Partial<TextShape>, localOnly?: boolean) => void;
  safeUpdate: (updates: Partial<TextShape>, localOnly?: boolean) => void;
  onFillColorChange: (color: string) => void;
  onFillColorBlur: () => void;
  onFillToggle: (enabled: boolean) => void;
  throttledUpdate: (updates: Partial<TextShape>) => void;
}

function TextPropertiesComponent({
  shape,
  isLockedByOther,
  localFillColor,
  hasFill,
  onUpdate,
  safeUpdate,
  onFillColorChange,
  onFillColorBlur,
  onFillToggle,
  throttledUpdate,
}: TextPropertiesProps) {
  return (
    <>
      {/* Text Content */}
      <div>
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Text</div>
        <textarea
          value={shape.text}
          onChange={(e) => onUpdate({ text: e.target.value }, true)}
          onBlur={(e) => onUpdate({ text: e.target.value }, false)}
          disabled={isLockedByOther}
          rows={3}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
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
            value={shape.fontSize}
            onChange={(e) => throttledUpdate({ fontSize: parseInt(e.target.value) })}
            onMouseUp={(e) => onUpdate({ fontSize: parseInt((e.target as HTMLInputElement).value) }, false)}
            onTouchEnd={(e) => onUpdate({ fontSize: parseInt((e.target as HTMLInputElement).value) }, false)}
            disabled={isLockedByOther}
            className="flex-1 disabled:cursor-not-allowed"
          />
          <input
            type="number"
            min="8"
            max="200"
            value={shape.fontSize}
            onChange={(e) => throttledUpdate({ fontSize: parseInt(e.target.value) || 16 })}
            onBlur={(e) => onUpdate({ fontSize: parseInt(e.target.value) || 16 }, false)}
            disabled={isLockedByOther}
            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Text Formatting */}
      <div>
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Formatting</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const currentStyle = shape.fontStyle || 'normal';
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
              (shape.fontStyle || 'normal').includes('bold')
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title="Bold"
          >
            B
          </button>
          <button
            onClick={() => {
              const currentStyle = shape.fontStyle || 'normal';
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
              (shape.fontStyle || 'normal').includes('italic')
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title="Italic"
          >
            I
          </button>
          <button
            onClick={() => {
              const currentDecoration = shape.textDecoration || '';
              const isUnderlined = currentDecoration === 'underline';
              safeUpdate({ textDecoration: isUnderlined ? '' : 'underline' });
            }}
            disabled={isLockedByOther}
            className={`flex-1 px-3 py-2 text-sm underline border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
              shape.textDecoration === 'underline'
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
              onChange={(e) => onFillToggle(e.target.checked)}
              disabled={isLockedByOther}
              className="w-3 h-3 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed"
            />
            <span className="text-xs text-gray-600">Visible</span>
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
              className="w-12 h-10 rounded border border-gray-300 cursor-pointer disabled:cursor-not-allowed"
            />
            <input
              type="text"
              value={localFillColor}
              onChange={(e) => onFillColorChange(e.target.value)}
              onBlur={onFillColorBlur}
              disabled={isLockedByOther}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="#000000"
            />
          </div>
        )}
        {!hasFill && <div className="text-xs text-gray-400 italic">Transparent</div>}
      </div>
    </>
  );
}

export const TextProperties = memo(TextPropertiesComponent);

