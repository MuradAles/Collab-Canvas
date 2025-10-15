/**
 * Layers Panel Component
 * Figma-style left panel showing all shapes with drag-to-reorder and arrow controls
 * Optimized with React.memo to prevent unnecessary re-renders
 */

import { useState, useCallback, memo } from 'react';
import type { Shape } from '../../types';

interface LayersPanelProps {
  shapes: Shape[];
  selectedId: string | null;
  onSelectShape: (id: string) => void;
  onReorderShapes: (newOrder: Shape[]) => void;
  currentUserId?: string;
}

function LayersPanelComponent({ shapes, selectedId, onSelectShape, onReorderShapes, currentUserId }: LayersPanelProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  }, [draggedIndex]);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Don't do anything if dropping at the same position
    if (draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Work with reversed array since that's what we're displaying
    const reversedShapesCopy = [...shapes].reverse();
    const draggedShape = reversedShapesCopy[draggedIndex];
    
    // Remove from old position
    reversedShapesCopy.splice(draggedIndex, 1);
    
    // Insert at new position
    reversedShapesCopy.splice(dropIndex, 0, draggedShape);
    
    // Reverse back to get the correct order for the shapes array
    const newShapes = reversedShapesCopy.reverse();

    onReorderShapes(newShapes);
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, shapes, onReorderShapes]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);


  const getShapePreview = (shape: Shape) => {
    const getFillColor = () => {
      if ('fill' in shape) {
        return shape.fill === 'transparent' ? '#ffffff' : shape.fill;
      }
      return '#e0e0e0';
    };

    const getStroke = () => {
      if (shape.type === 'rectangle' || shape.type === 'circle') {
        return shape.stroke === 'transparent' ? '#d1d5db' : shape.stroke;
      }
      return '#d1d5db';
    };

    // Calculate proportional size (max 32px container)
    const calculateSize = (width: number, height: number) => {
      const maxSize = 32;
      const minSize = 12;
      const aspectRatio = width / height;
      
      let previewWidth, previewHeight;
      
      if (aspectRatio > 1) {
        // Wider than tall
        previewWidth = maxSize;
        previewHeight = Math.max(minSize, maxSize / aspectRatio);
      } else {
        // Taller than wide
        previewHeight = maxSize;
        previewWidth = Math.max(minSize, maxSize * aspectRatio);
      }
      
      return { width: previewWidth, height: previewHeight };
    };

    if (shape.type === 'rectangle') {
      const { width, height } = calculateSize(shape.width, shape.height);
      return (
        <div 
          className="flex items-center justify-center flex-shrink-0"
          style={{ width: '32px', height: '32px' }}
        >
          <div 
            className="rounded border-2"
            style={{ 
              width: `${width}px`,
              height: `${height}px`,
              backgroundColor: getFillColor(),
              borderColor: getStroke(),
              borderRadius: shape.cornerRadius > 0 ? '4px' : '2px'
            }}
          />
        </div>
      );
    }
    if (shape.type === 'circle') {
      const size = Math.min(32, Math.max(16, shape.radius * 0.4)); // Scale down radius for preview
      return (
        <div 
          className="flex items-center justify-center flex-shrink-0"
          style={{ width: '32px', height: '32px' }}
        >
          <div 
            className="rounded-full border-2"
            style={{ 
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: getFillColor(),
              borderColor: getStroke()
            }}
          />
        </div>
      );
    }
    if (shape.type === 'text') {
      // Scale text preview based on fontSize
      const fontSize = Math.min(18, Math.max(12, shape.fontSize * 0.5));
      return (
        <div 
          className="flex items-center justify-center font-bold flex-shrink-0"
          style={{ 
            width: '32px',
            height: '32px',
            color: getFillColor(),
            fontSize: `${fontSize}px`
          }}
        >
          T
        </div>
      );
    }
    return null;
  };

  const getShapeName = (shape: Shape) => {
    // Use the name field directly
    return shape.name;
  };

  // Render shapes in reverse order (top of list = top of canvas)
  const reversedShapes = [...shapes].reverse();

  return (
    <div className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-60'}`}>
      {/* Header */}
      <div className={`${isCollapsed ? 'px-2' : 'px-4'} py-3 border-b border-gray-200 flex items-center justify-between`}>
        <div className={isCollapsed ? 'hidden' : ''}>
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Layers
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {shapes.length} {shapes.length === 1 ? 'shape' : 'shapes'}
          </p>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title={isCollapsed ? 'Expand panel' : 'Collapse panel'}
        >
          <svg 
            className={`w-4 h-4 text-gray-600 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Layers List */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {reversedShapes.length === 0 ? (
          <div className={`text-center text-gray-400 text-sm mt-8 ${isCollapsed ? 'px-1' : 'px-4'}`}>
            {!isCollapsed ? (
              <>
                <svg
                  className="w-12 h-12 mx-auto mb-2 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <p>No shapes yet</p>
                <p className="text-xs mt-1">Create shapes to see them here</p>
              </>
            ) : (
              <svg
                className="w-6 h-6 mx-auto text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            )}
          </div>
        ) : (
          reversedShapes.map((shape, index) => {
            const isSelected = shape.id === selectedId;
            const isDragging = draggedIndex === index;
            const isDragOver = dragOverIndex === index;
            const isLockedByOther = shape.isLocked && shape.lockedBy !== null && shape.lockedBy !== currentUserId;

            return (
              <div
                key={shape.id}
                className="relative mb-1"
              >
                {/* Drop indicator line */}
                {isDragOver && draggedIndex !== null && draggedIndex > index && (
                  <div className="absolute -top-1 left-0 right-0 h-0.5 bg-blue-500 rounded-full z-10" />
                )}
                
                <div
                  draggable={!isLockedByOther}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  onClick={() => !isLockedByOther && onSelectShape(shape.id)}
                  className={`
                    group flex items-center gap-2 px-2 py-2 rounded-md 
                    transition-all duration-150
                    ${isCollapsed ? 'justify-center' : ''}
                    ${isLockedByOther 
                      ? 'opacity-50 cursor-not-allowed bg-gray-100 border-2 border-red-200' 
                      : 'cursor-pointer'
                    }
                    ${isSelected 
                      ? 'bg-blue-50 border-2 border-blue-500 shadow-sm' 
                      : !isLockedByOther ? 'bg-gray-50 border-2 border-transparent hover:bg-gray-100 hover:border-gray-200' : ''
                    }
                    ${isDragging ? 'opacity-40 scale-95' : ''}
                  `}
                >
                  {/* Drag Handle */}
                  {!isCollapsed && (
                    <div className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="9" cy="5" r="1.5" />
                        <circle cx="9" cy="12" r="1.5" />
                        <circle cx="9" cy="19" r="1.5" />
                        <circle cx="15" cy="5" r="1.5" />
                        <circle cx="15" cy="12" r="1.5" />
                        <circle cx="15" cy="19" r="1.5" />
                      </svg>
                    </div>
                  )}

                  {/* Shape Preview */}
                  {getShapePreview(shape)}

                  {/* Shape Name */}
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm truncate ${isSelected ? 'font-medium text-blue-900' : 'text-gray-700'}`}>
                        {getShapeName(shape)}
                      </div>
                      {shape.type === 'rectangle' && (
                        <div className="text-xs text-gray-500">
                          {Math.round(shape.width)} × {Math.round(shape.height)}
                        </div>
                      )}
                      {shape.type === 'circle' && (
                        <div className="text-xs text-gray-500">
                          r = {Math.round(shape.radius)}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Lock Indicator */}
                  {isLockedByOther && !isCollapsed && (
                    <div className="flex items-center gap-1 text-red-500 text-xs" title={`Locked by ${shape.lockedByName}`}>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C9.243 2 7 4.243 7 7v3H6c-1.103 0-2 .897-2 2v8c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-8c0-1.103-.897-2-2-2h-1V7c0-2.757-2.243-5-5-5zM9 7c0-1.654 1.346-3 3-3s3 1.346 3 3v3H9V7zm4 10.723V20h-2v-2.277c-.595-.347-1-.984-1-1.723 0-1.103.897-2 2-2s2 .897 2 2c0 .738-.404 1.376-1 1.723z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Drop indicator line */}
                {isDragOver && draggedIndex !== null && draggedIndex < index && (
                  <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-500 rounded-full z-10" />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Info Footer */}
      {!isCollapsed && (
        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500">
            Drag to reorder • Top = front
          </p>
        </div>
      )}
    </div>
  );
}

// Export memoized component to prevent unnecessary re-renders
export const LayersPanel = memo(LayersPanelComponent, (prevProps, nextProps) => {
  // Only re-render if shapes array changed, selectedId changed, or callbacks changed
  return (
    prevProps.selectedId === nextProps.selectedId &&
    prevProps.shapes.length === nextProps.shapes.length &&
    prevProps.shapes.every((shape, index) => 
      JSON.stringify(shape) === JSON.stringify(nextProps.shapes[index])
    )
  );
});
