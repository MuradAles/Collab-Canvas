/**
 * Tool Selector Component
 * Allows users to switch between different tools (Select, Shapes, Text)
 */

import type { ReactNode } from 'react';
import { ShapeDropdown, type ShapeTool } from './ShapeDropdown';
import { Tutorial } from './Tutorial';
import type { Tool } from '../../types';

export type { Tool };

interface ToolSelectorProps {
  selectedTool: Tool;
  onToolChange: (tool: Tool) => void;
  onOpenAIPanel?: () => void;
}

export function ToolSelector({ selectedTool, onToolChange, onOpenAIPanel }: ToolSelectorProps) {
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
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
      <div className="bg-theme-surface border border-theme rounded-lg shadow-lg p-2 flex gap-1 items-center">
        {/* Select Tool */}
        <button
          onClick={() => onToolChange('select')}
          className={`
            relative group px-3 py-2 rounded-md transition-all duration-200
            flex items-center justify-center
            ${
              selectedTool === 'select'
                ? 'bg-blue-600 text-white'
                : 'hover:bg-theme-surface-hover text-theme-primary'
            }
          `}
        >
          {tools[0].icon}
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block">
            <div className="bg-gray-900 dark:bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap backdrop-blur-sm">
              Select
              <kbd className="ml-2 px-1 bg-gray-700 dark:bg-gray-900 rounded text-xs">V</kbd>
            </div>
          </div>
        </button>

        {/* Shape Dropdown */}
        <ShapeDropdown
          selectedShape={isShapeTool ? (selectedTool as ShapeTool) : 'rectangle'}
          onShapeChange={(shape) => onToolChange(shape as Tool)}
          onToolActivate={(shape) => onToolChange(shape as Tool)}
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
                : 'hover:bg-theme-surface-hover text-theme-primary'
            }
          `}
        >
          {tools[1].icon}
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block">
            <div className="bg-gray-900 dark:bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap backdrop-blur-sm">
              Text
              <kbd className="ml-2 px-1 bg-gray-700 dark:bg-gray-900 rounded text-xs">T</kbd>
            </div>
          </div>
        </button>

        {/* AI Assistant Button */}
        {onOpenAIPanel && (
          <button
            onClick={onOpenAIPanel}
            className="relative group px-3 py-2 rounded-md transition-all duration-200 flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 hover:scale-110"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block">
              <div className="bg-gray-900 dark:bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap backdrop-blur-sm">
                AI Assistant
                <kbd className="ml-2 px-1 bg-gray-700 dark:bg-gray-900 rounded text-xs">/</kbd>
              </div>
            </div>
          </button>
        )}

        {/* Tutorial Button */}
        <Tutorial />

      </div>
    </div>
  );
}

