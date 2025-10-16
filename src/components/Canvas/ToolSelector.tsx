/**
 * Tool Selector Component
 * Allows users to switch between different tools (Select, Shapes, Text)
 */

import type { ReactNode } from 'react';
import { ShapeDropdown, type ShapeTool } from './ShapeDropdown';
import type { Tool } from '../../types';

export type { Tool };

interface ToolSelectorProps {
  selectedTool: Tool;
  onToolChange: (tool: Tool) => void;
}

export function ToolSelector({ selectedTool, onToolChange }: ToolSelectorProps) {
  const isShapeTool = selectedTool === 'rectangle' || selectedTool === 'circle' || selectedTool === 'line';
  
  const tools: { id: 'select' | 'text'; label: string; icon: ReactNode; shortcut: string }[] = [
    {
      id: 'select',
      label: 'Select',
      shortcut: 'V',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
          />
        </svg>
      ),
    },
    {
      id: 'text',
      label: 'Text',
      shortcut: 'T',
      icon: (
        <span className="text-xl font-bold flex items-center justify-center">T</span>
      ),
    },
  ];

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
      <div className="bg-white rounded-lg shadow-lg p-2 flex gap-1 items-center">
        {/* Select Tool */}
        <button
          onClick={() => onToolChange('select')}
          className={`
            relative group px-3 py-2 rounded-md transition-all duration-200
            flex items-center justify-center
            ${
              selectedTool === 'select'
                ? 'bg-blue-600 text-white'
                : 'hover:bg-gray-100 text-gray-700'
            }
          `}
          title="Select (V)"
        >
          {tools[0].icon}
          <div className="absolute top-full mt-2 hidden group-hover:block">
            <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              Select
              <kbd className="ml-2 px-1 bg-gray-700 rounded text-xs">V</kbd>
            </div>
          </div>
        </button>

        {/* Shape Dropdown */}
        <ShapeDropdown
          selectedShape={isShapeTool ? (selectedTool as ShapeTool) : 'rectangle'}
          onShapeChange={(shape) => onToolChange(shape as Tool)}
          isActive={isShapeTool}
        />

        {/* Text Tool */}
        <button
          onClick={() => onToolChange('text')}
          className={`
            relative group px-3 py-2 rounded-md transition-all duration-200
            flex items-center justify-center
            ${
              selectedTool === 'text'
                ? 'bg-blue-600 text-white'
                : 'hover:bg-gray-100 text-gray-700'
            }
          `}
          title="Text (T)"
        >
          {tools[1].icon}
          <div className="absolute top-full mt-2 hidden group-hover:block">
            <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              Text
              <kbd className="ml-2 px-1 bg-gray-700 rounded text-xs">T</kbd>
            </div>
          </div>
        </button>

      </div>
    </div>
  );
}

