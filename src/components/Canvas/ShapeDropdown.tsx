/**
 * Shape Dropdown Component
 * Dropdown menu for selecting different shape types
 */

import { useState, useRef, useEffect } from 'react';
import type { JSX } from 'react';

export type ShapeTool = 'rectangle' | 'circle' | 'line';

interface ShapeDropdownProps {
  selectedShape: ShapeTool;
  onShapeChange: (shape: ShapeTool) => void;
  onToolActivate: (shape: ShapeTool) => void;
  isActive: boolean;
}

export function ShapeDropdown({ selectedShape, onShapeChange, onToolActivate, isActive }: ShapeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const shapes: { id: ShapeTool; label: string; shortcut: string; icon: JSX.Element }[] = [
    {
      id: 'rectangle',
      label: 'Rectangle',
      shortcut: 'R',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" strokeWidth={2} rx="2" />
        </svg>
      ),
    },
    {
      id: 'circle',
      label: 'Circle',
      shortcut: 'C',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" strokeWidth={2} />
        </svg>
      ),
    },
    {
      id: 'line',
      label: 'Line',
      shortcut: 'L',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <line x1="4" y1="20" x2="20" y2="4" strokeWidth={2} strokeLinecap="round" />
        </svg>
      ),
    },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentShape = shapes.find(s => s.id === selectedShape) || shapes[0];

  return (
    <div className="relative flex" ref={dropdownRef}>
      {/* Main Shape Button */}
      <button
        onClick={() => onToolActivate(selectedShape)}
        className={`
          relative group px-3 py-2 rounded-l-md transition-all duration-200
          flex items-center justify-center
          ${isActive ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-700'}
        `}
        title={currentShape.label}
      >
        {currentShape.icon}
        <div className="absolute bottom-full mb-2 left-full ml-2 hidden group-hover:block">
          <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            {currentShape.label}
            <kbd className="ml-2 px-1 bg-gray-700 rounded text-xs">{currentShape.shortcut}</kbd>
          </div>
        </div>
      </button>

      {/* Dropdown Arrow Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          relative group px-1 py-2 rounded-r-md transition-all duration-200
          flex items-center justify-center border-l border-gray-300
          ${isActive ? 'bg-blue-600 text-white border-blue-500' : 'hover:bg-gray-100 text-gray-700'}
        `}
        title="Change Shape"
      >
        <svg 
          className={`w-3 h-3 transition-transform rotate-180 ${isOpen ? 'rotate-0' : ''}`}
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
        <div className="absolute bottom-full mb-2 left-full ml-2 hidden group-hover:block">
          <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            Change Shape
          </div>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute bottom-full mb-1 left-0 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[140px]">
          {shapes.map((shape) => (
            <button
              key={shape.id}
              onClick={() => {
                onShapeChange(shape.id);
                setIsOpen(false);
              }}
              className={`
                w-full px-3 py-2 flex items-center gap-2 transition-colors
                ${selectedShape === shape.id 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'hover:bg-gray-50 text-gray-700'
                }
              `}
            >
              {shape.icon}
              <span className="text-sm font-medium">{shape.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

