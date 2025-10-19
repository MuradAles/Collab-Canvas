/**
 * Layers Panel Component
 * Figma-style left panel showing all shapes with drag-to-reorder and arrow controls
 * Optimized with React.memo to prevent unnecessary re-renders
 */

import { useState, useCallback, memo, useMemo, useRef, useEffect } from 'react';
import type { Shape } from '../../types';

interface LayersPanelProps {
  shapes: Shape[];
  selectedIds: string[];
  onSelectShape: (id: string, addToSelection?: boolean) => void;
  onReorderShapes: (newOrder: Shape[]) => void;
  currentUserId?: string;
  cullingStats?: {
    totalShapes: number;
    visibleShapes: number;
    culledShapes: number;
    cullingPercentage: number;
  };
  onNavigateToShape?: (shapeId: string) => void;
}

const MIN_PANEL_WIDTH = 180;
const MAX_PANEL_WIDTH = 400;
const DEFAULT_PANEL_WIDTH = 240;

function LayersPanelComponent({ shapes, selectedIds, onSelectShape, onReorderShapes, currentUserId, cullingStats, onNavigateToShape }: LayersPanelProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [panelWidth, setPanelWidth] = useState(() => {
    const saved = localStorage.getItem('layersPanelWidth');
    return saved ? parseInt(saved, 10) : DEFAULT_PANEL_WIDTH;
  });
  const [isResizing, setIsResizing] = useState(false);
  
  // Refs for auto-scroll functionality
  const layerRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const resizeStartX = useRef<number>(0);
  const resizeStartWidth = useRef<number>(0);

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

  // Resize handlers
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = panelWidth;
  }, [panelWidth]);

  useEffect(() => {
    if (!isResizing) return;

    const handleResizeMove = (e: MouseEvent) => {
      const delta = e.clientX - resizeStartX.current;
      const newWidth = Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, resizeStartWidth.current + delta));
      setPanelWidth(newWidth);
    };

    const handleResizeEnd = () => {
      setIsResizing(false);
      localStorage.setItem('layersPanelWidth', panelWidth.toString());
    };

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);

    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing, panelWidth]);

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
    if (shape.type === 'line') {
      return (
        <div 
          className="flex items-center justify-center flex-shrink-0"
          style={{ width: '32px', height: '32px' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <line 
              x1="4" 
              y1="20" 
              x2="20" 
              y2="4" 
              stroke={getStroke()} 
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
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
  // Memoize to avoid creating new array on every render
  const reversedShapes = useMemo(() => [...shapes].reverse(), [shapes]);

  // Auto-scroll to selected shape when selection changes
  useEffect(() => {
    if (selectedIds.length === 1 && !isCollapsed) {
      const selectedId = selectedIds[0];
      const selectedElement = layerRefs.current.get(selectedId);
      const container = scrollContainerRef.current;
      
      if (selectedElement && container) {
        // Calculate if element is visible
        const containerRect = container.getBoundingClientRect();
        const elementRect = selectedElement.getBoundingClientRect();
        
        const isVisible = 
          elementRect.top >= containerRect.top &&
          elementRect.bottom <= containerRect.bottom;
        
        if (!isVisible) {
          // Scroll to center the element
          const containerHeight = container.clientHeight;
          const elementHeight = selectedElement.clientHeight;
          const elementTop = selectedElement.offsetTop;
          
          // Calculate position to center the element
          const scrollTo = elementTop - (containerHeight / 2) + (elementHeight / 2);
          
          container.scrollTo({
            top: Math.max(0, scrollTo),
            behavior: 'smooth'
          });
        }
      }
    }
  }, [selectedIds, isCollapsed]);

  return (
    <div 
      className={`bg-theme-surface border-r border-theme flex flex-col h-full relative ${
        isResizing ? 'resizing' : 'panel-width-transition'
      }`}
      style={{ width: isCollapsed ? '64px' : `${panelWidth}px`, zIndex: 2000 }}
    >
      <style>{`
        /* Custom Scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(155, 155, 155, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(155, 155, 155, 0.7);
        }
      `}</style>
      {/* Header */}
      <div className={`${isCollapsed ? 'px-2' : 'px-4'} py-3 border-b border-theme flex items-center justify-between transition-all duration-300 ease-in-out`}>
        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isCollapsed ? 'opacity-0 max-w-0' : 'opacity-100 max-w-full'}`}>
          <h3 className="text-sm font-semibold text-theme-primary uppercase tracking-wide whitespace-nowrap">
            Layers
          </h3>
          <div className="flex items-center justify-between mt-1">
            {cullingStats && cullingStats.totalShapes > 0 ? (
              <p className="text-xs text-theme-secondary leading-6 whitespace-nowrap">
                <span className="text-blue-600 dark:text-blue-400 font-medium">{cullingStats.visibleShapes}</span> of {cullingStats.totalShapes} {cullingStats.totalShapes === 1 ? 'shape' : 'shapes'}
              </p>
            ) : (
              <p className="text-xs text-theme-secondary leading-6 whitespace-nowrap">
                {shapes.length} {shapes.length === 1 ? 'shape' : 'shapes'}
              </p>
            )}
            {selectedIds.length > 0 && (
              <p className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 rounded leading-6 ml-2 whitespace-nowrap">
                {selectedIds.length} selected
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 hover:bg-theme-surface-hover rounded transition-colors flex-shrink-0"
          title={isCollapsed ? 'Expand panel' : 'Collapse panel'}
        >
          <svg 
            className={`w-4 h-4 text-theme-secondary transition-transform duration-300 ease-in-out ${isCollapsed ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Layers List */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-2 custom-scrollbar transition-all duration-300 ease-in-out">
        {reversedShapes.length === 0 ? (
          <div className={`text-center text-theme-secondary text-sm mt-8 transition-all duration-300 ease-in-out ${isCollapsed ? 'px-1' : 'px-4'}`}>
            {!isCollapsed ? (
              <div className="transition-all duration-300 ease-in-out">
                <svg
                  className="w-12 h-12 mx-auto mb-2 text-theme-secondary opacity-50"
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
              </div>
            ) : (
              <div className="transition-all duration-300 ease-in-out">
                <svg
                  className="w-6 h-6 mx-auto text-theme-secondary opacity-50"
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
              </div>
            )}
          </div>
        ) : (
          reversedShapes.map((shape, index) => {
            const isSelected = selectedIds.includes(shape.id);
            const isDragging = draggedIndex === index;
            const isDragOver = dragOverIndex === index;
            const isLockedByOther = shape.isLocked && shape.lockedBy !== null && shape.lockedBy !== currentUserId;
            const isLockedByMe = shape.isLocked && shape.lockedBy === currentUserId;

            return (
              <div
                key={shape.id}
                ref={(el) => {
                  if (el) {
                    layerRefs.current.set(shape.id, el);
                  } else {
                    layerRefs.current.delete(shape.id);
                  }
                }}
                className="relative mb-2"
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
                  onClick={(e) => {
                    if (!isLockedByOther) {
                      onSelectShape(shape.id, e.shiftKey);
                    }
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    if (onNavigateToShape) {
                      onNavigateToShape(shape.id);
                    }
                  }}
                  title={onNavigateToShape ? "Double-click to jump to this shape" : undefined}
                  className={`
                    group flex items-center gap-2 px-2 py-2 rounded-md 
                    transition-all duration-150
                    ${isCollapsed ? 'justify-center' : ''}
                    ${isLockedByOther 
                      ? 'opacity-50 cursor-not-allowed bg-theme-surface-hover shadow-[0_0_0_2px_rgba(239,68,68,0.3)] shadow-red-500/30' 
                      : 'cursor-pointer'
                    }
                    ${isSelected && isLockedByMe
                      ? 'bg-green-50 dark:bg-green-900/20 shadow-[inset_0_0_0_2px] shadow-green-500/50' 
                      : isSelected 
                      ? 'bg-theme-accent/10 shadow-[inset_0_0_0_2px] shadow-theme-accent' 
                      : !isLockedByOther ? 'bg-theme-surface-hover hover:opacity-80 hover:shadow-sm' : ''
                    }
                    ${isDragging ? 'opacity-40 scale-95' : ''}
                  `}
                >
                  {/* Drag Handle */}
                  <div className={`text-theme-secondary hover:text-theme-primary cursor-grab active:cursor-grabbing transition-all duration-300 ease-in-out overflow-hidden ${isCollapsed ? 'opacity-0 max-w-0' : 'opacity-100 max-w-full'}`}>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="9" cy="5" r="1.5" />
                      <circle cx="9" cy="12" r="1.5" />
                      <circle cx="9" cy="19" r="1.5" />
                      <circle cx="15" cy="5" r="1.5" />
                      <circle cx="15" cy="12" r="1.5" />
                      <circle cx="15" cy="19" r="1.5" />
                    </svg>
                  </div>

                  {/* Shape Preview */}
                  {getShapePreview(shape)}

                  {/* Shape Name */}
                  <div className={`flex-1 min-w-0 transition-all duration-300 ease-in-out overflow-hidden ${isCollapsed ? 'opacity-0 max-w-0' : 'opacity-100 max-w-full'}`}>
                    <div className={`text-sm truncate ${
                      isSelected && isLockedByMe 
                        ? 'font-bold text-green-900 dark:text-green-400' 
                        : isSelected 
                        ? 'font-bold text-theme-accent' 
                        : 'font-medium text-theme-primary'
                    }`}>
                      {getShapeName(shape)}
                    </div>
                    {shape.type === 'rectangle' && (
                      <div className={`text-xs ${isSelected ? 'text-theme-accent/70' : 'text-theme-secondary'}`}>
                        {Math.round(shape.width)} × {Math.round(shape.height)}
                      </div>
                    )}
                    {shape.type === 'circle' && (
                      <div className={`text-xs ${isSelected ? 'text-theme-accent/70' : 'text-theme-secondary'}`}>
                        r = {Math.round(shape.radius)}
                      </div>
                    )}
                    {shape.type === 'line' && (
                      <div className={`text-xs ${isSelected ? 'text-theme-accent/70' : 'text-theme-secondary'}`}>
                        {Math.round(Math.sqrt(Math.pow(shape.x2 - shape.x1, 2) + Math.pow(shape.y2 - shape.y1, 2)))} px
                      </div>
                    )}
                  </div>

                  {/* Lock Indicator - Shows when OTHERS are controlling this object */}
                  {isLockedByOther && (
                    <div className={`flex items-center gap-1 text-red-500 text-xs transition-all duration-300 ease-in-out overflow-hidden ${isCollapsed ? 'opacity-0 max-w-0' : 'opacity-100 max-w-full'}`} title={`Locked by ${shape.lockedByName}`}>
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
      <div className={`px-4 py-2 border-t border-theme bg-theme-surface-hover transition-all duration-300 ease-in-out overflow-hidden ${isCollapsed ? 'opacity-0 max-h-0 py-0' : 'opacity-100 max-h-20'}`}>
        <p className="text-xs text-theme-secondary whitespace-nowrap">
          Drag to reorder • Top = front
        </p>
      </div>

      {/* Resize Handle */}
      {!isCollapsed && (
        <div
          className={`resize-handle resize-handle-right ${isResizing ? 'resizing' : ''}`}
          onMouseDown={handleResizeStart}
          title="Drag to resize panel"
        />
      )}
    </div>
  );
}

// Export memoized component to prevent unnecessary re-renders
export const LayersPanel = memo(LayersPanelComponent, (prevProps, nextProps) => {
  // Only re-render if shapes array changed or selectedIds changed or cullingStats changed
  // Compare only properties that affect LayersPanel UI (not JSON.stringify - too expensive!)
  
  // Check if selected IDs changed
  if (prevProps.selectedIds.length !== nextProps.selectedIds.length) return false;
  if (!prevProps.selectedIds.every((id, index) => id === nextProps.selectedIds[index])) return false;
  
  // Check if shapes changed (only compare properties displayed in LayersPanel)
  if (prevProps.shapes.length !== nextProps.shapes.length) return false;
  
  // Check if culling stats changed (for the "Visible X of Y" header)
  if (prevProps.cullingStats?.visibleShapes !== nextProps.cullingStats?.visibleShapes) return false;
  if (prevProps.cullingStats?.totalShapes !== nextProps.cullingStats?.totalShapes) return false;
  
  // Compare only critical properties that affect LayersPanel rendering:
  // - id, name, zIndex (what we display)
  // - isDragging, draggingBy (visual indicators)
  // - isLocked, lockedBy (lock icons)
  return prevProps.shapes.every((shape, index) => {
    const nextShape = nextProps.shapes[index];
    return (
      shape.id === nextShape.id &&
      shape.name === nextShape.name &&
      shape.zIndex === nextShape.zIndex &&
      shape.type === nextShape.type &&
      shape.isDragging === nextShape.isDragging &&
      shape.draggingBy === nextShape.draggingBy &&
      shape.isLocked === nextShape.isLocked &&
      shape.lockedBy === nextShape.lockedBy
    );
  });
});
