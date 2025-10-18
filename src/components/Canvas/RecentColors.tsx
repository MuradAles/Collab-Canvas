/**
 * Recent Colors Component
 * Shows a 2x6 grid of recently used colors with localStorage persistence
 * Includes "Copy Color" functionality to save current selection
 */

import { useEffect, useState, useRef } from 'react';

interface RecentColorsProps {
  currentColor: string;
  onColorSelect: (color: string) => void;
  onColorBlur?: () => void;
  disabled?: boolean;
}

const MAX_RECENT_COLORS = 12; // 2 rows x 6 columns
const STORAGE_KEY = 'collab-canvas-recent-colors';

// Default colors to show when no recent colors exist
const DEFAULT_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#FFA07A', // Light Salmon
  '#98D8C8', // Mint
  '#F7DC6F', // Yellow
  '#BB8FCE', // Purple
  '#85C1E2', // Sky Blue
  '#F8B739', // Orange
  '#52C0A3', // Green
  '#E8E8E8', // Light Gray
  '#333333', // Dark Gray
];

export function RecentColors({ currentColor, onColorSelect, onColorBlur, disabled }: RecentColorsProps) {
  const [recentColors, setRecentColors] = useState<string[]>([]);

  // Load recent colors from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentColors(parsed);
          return;
        }
      }
    } catch (error) {
      console.error('Failed to load recent colors:', error);
    }
    // If no stored colors, use defaults
    setRecentColors(DEFAULT_COLORS);
  }, []);

  // Save recent colors to localStorage whenever they change
  // Use a ref to prevent infinite loops
  const prevRecentColorsRef = useRef<string[]>([]);
  useEffect(() => {
    // Only save if actually changed
    if (recentColors.length > 0 && 
        JSON.stringify(recentColors) !== JSON.stringify(prevRecentColorsRef.current)) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(recentColors));
        prevRecentColorsRef.current = recentColors;
      } catch (error) {
        console.error('Failed to save recent colors:', error);
      }
    }
  }, [recentColors]);

  // Add current color to recent colors
  const handleCopyColor = () => {
    if (!currentColor || currentColor === 'transparent') return;

    // Use functional update to avoid race conditions
    setRecentColors((prev) => {
      // Remove if already exists
      const filtered = prev.filter((c) => c.toLowerCase() !== currentColor.toLowerCase());
      // Add to beginning
      const updated = [currentColor, ...filtered];
      // Keep only MAX_RECENT_COLORS
      return updated.slice(0, MAX_RECENT_COLORS);
    });
  };

  const handleColorClick = (color: string) => {
    if (disabled) return;
    
    // Apply color change
    onColorSelect(color);
    
    // Schedule blur for next frame to ensure React updates complete
    requestAnimationFrame(() => {
      onColorBlur?.();
    });
  };

  const handleEditColor = (index: number, currentColor: string, event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    
    // Get the position of the clicked button
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    
    // Create positioned color input
    const input = document.createElement('input');
    input.type = 'color';
    input.value = currentColor;
    input.style.position = 'fixed';
    // Position it above the color swatch
    input.style.top = `${Math.max(10, rect.top - 40)}px`;
    input.style.left = `${rect.left}px`;
    input.style.opacity = '0.01'; // Nearly invisible but still functional
    input.style.pointerEvents = 'auto';
    input.style.zIndex = '9999';
    document.body.appendChild(input);
    
    input.onchange = (changeEvent) => {
      const newColor = (changeEvent.target as HTMLInputElement).value;
      setRecentColors((prev) => {
        const updated = [...prev];
        updated[index] = newColor;
        return updated;
      });
      onColorSelect(newColor);
      
      // Use requestAnimationFrame to ensure state updates complete
      requestAnimationFrame(() => {
        onColorBlur?.();
      });
      
      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
    };
    
    input.onblur = () => {
      setTimeout(() => {
        if (document.body.contains(input)) {
          document.body.removeChild(input);
        }
      }, 100);
    };
    
    // Trigger the color picker
    setTimeout(() => {
      input.click();
    }, 0);
  };

  const displayColors = recentColors.length > 0 ? recentColors : DEFAULT_COLORS;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs text-theme-secondary uppercase tracking-wide">Recent Colors</label>
        <button
          onClick={handleCopyColor}
          disabled={disabled || currentColor === 'transparent'}
          className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          title="Add current color to recent colors"
        >
          Copy Color
        </button>
      </div>

      {/* 2x6 Grid of Recent Colors */}
      <div className="grid grid-cols-6 gap-1.5">
        {displayColors.map((color, index) => (
          <div key={`color-${index}-${color}`} className="relative group">
            <button
              onClick={() => handleColorClick(color)}
              disabled={disabled}
              className={`
                w-full aspect-square rounded border-2 transition-all
                ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-110'}
                ${color.toLowerCase() === currentColor.toLowerCase() ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300 dark:border-gray-600'}
              `}
              style={{ backgroundColor: color }}
              title={color}
            />
            {/* Edit Button - appears on hover */}
            {!disabled && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditColor(index, color, e);
                }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-600 shadow-md"
                title="Edit this color"
              >
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Clear History Button */}
      <button
        onClick={() => setRecentColors(DEFAULT_COLORS)}
        disabled={disabled}
        className="w-full text-xs text-theme-secondary hover:text-theme-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors py-1"
      >
        Reset to Defaults
      </button>
    </div>
  );
}

