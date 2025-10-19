/**
 * Keyboard Shortcuts Hook
 * Handles all keyboard shortcuts for canvas operations
 */

import { useEffect, useRef } from 'react';
import type { Shape, Tool } from '../types';

interface UseKeyboardShortcutsProps {
  selectedIds: string[];
  shapes: Shape[];
  currentTool: string;
  mousePositionRef: React.MutableRefObject<{ x: number; y: number }>;
  setCurrentTool: (tool: Tool) => void;
  selectShape: (id: string | null, shiftKey?: boolean) => void;
  selectMultipleShapes: (ids: string[], additive: boolean) => Promise<void>;
  deleteShapes: (ids: string[]) => Promise<void>;
  duplicateShapes: (ids: string[]) => Promise<string[]>;
  addShape: (shape: any, options?: { skipAutoLock?: boolean }) => Promise<string>;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleResetView: () => void;
}

export function useKeyboardShortcuts({
  selectedIds,
  shapes,
  currentTool,
  mousePositionRef,
  setCurrentTool,
  selectShape,
  selectMultipleShapes,
  deleteShapes,
  duplicateShapes,
  addShape,
  handleZoomIn,
  handleZoomOut,
  handleResetView,
}: UseKeyboardShortcutsProps) {
  // Clipboard for copy/paste
  const clipboardRef = useRef<typeof shapes>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Tool shortcuts (only when Ctrl/Cmd is NOT pressed)
      if (!e.ctrlKey && !e.metaKey) {
        if (e.key === 'v' || e.key === 'V') {
          setCurrentTool('select');
          return;
        }
        if (e.key === 'r' || e.key === 'R') {
          setCurrentTool('rectangle');
          return;
        }
        if (e.key === 'c' || e.key === 'C') {
          setCurrentTool('circle');
          return;
        }
        if (e.key === 't' || e.key === 'T') {
          setCurrentTool('text');
          return;
        }
        if (e.key === 'l' || e.key === 'L') {
          setCurrentTool('line');
          return;
        }
      }

      // Copy (Ctrl+C / Cmd+C)
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        if (selectedIds.length > 0 && !(e.target as HTMLElement).isContentEditable) {
          e.preventDefault();
          // Copy selected shapes to clipboard
          const selectedShapes = shapes.filter(s => selectedIds.includes(s.id));
          
          // Write to system clipboard as JSON
          const clipboardData = {
            type: 'collab-canvas-shapes',
            shapes: selectedShapes.map(shape => {
              // Remove internal fields that shouldn't be copied
              const { id, name, isLocked, lockedBy, lockedByName, ...shapeData } = shape;
              return shapeData;
            }),
            timestamp: Date.now(),
          };
          
          navigator.clipboard.writeText(JSON.stringify(clipboardData))
            .catch(err => {
              console.error('Failed to write to clipboard:', err);
              // Fallback to internal clipboard
              clipboardRef.current = selectedShapes;
            });
        }
        return;
      }

      // Paste (Ctrl+V / Cmd+V)
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        if (!(e.target as HTMLElement).isContentEditable) {
          e.preventDefault();
          
          // Read from system clipboard
          navigator.clipboard.readText()
            .then(text => {
              let clipboardData;
              
              try {
                clipboardData = JSON.parse(text);
                
                // Verify it's our data format
                if (clipboardData.type !== 'collab-canvas-shapes' || !Array.isArray(clipboardData.shapes)) {
                  // Not our format, silently ignore
                  return;
                }
              } catch (parseError) {
                // Not valid JSON or not our format, silently ignore
                // This is normal when pasting text into other inputs
                return;
              }
              
              try {
                
                // Calculate the center of copied shapes
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                
                clipboardData.shapes.forEach((shapeData: any) => {
                  if (shapeData.type === 'line') {
                    minX = Math.min(minX, shapeData.x1, shapeData.x2);
                    minY = Math.min(minY, shapeData.y1, shapeData.y2);
                    maxX = Math.max(maxX, shapeData.x1, shapeData.x2);
                    maxY = Math.max(maxY, shapeData.y1, shapeData.y2);
                  } else {
                    const width = shapeData.width || 0;
                    const height = shapeData.height || 0;
                    minX = Math.min(minX, shapeData.x);
                    minY = Math.min(minY, shapeData.y);
                    maxX = Math.max(maxX, shapeData.x + width);
                    maxY = Math.max(maxY, shapeData.y + height);
                  }
                });
                
                const centerX = (minX + maxX) / 2;
                const centerY = (minY + maxY) / 2;
                
                // Calculate offset to paste at cursor position
                const cursorX = mousePositionRef.current.x;
                const cursorY = mousePositionRef.current.y;
                const offsetX = cursorX - centerX;
                const offsetY = cursorY - centerY;
                
                // Create new shapes at cursor position, removing all metadata fields
                const shapesToCreate = clipboardData.shapes.map((shapeData: any) => {
                  // Remove all metadata fields that should be regenerated
                  const { id, name, createdAt, updatedAt, createdBy, isLocked, lockedBy, lockedByName, zIndex, ...cleanData } = shapeData;
                  
                  if (cleanData.type === 'line') {
                    return {
                      ...cleanData,
                      x1: cleanData.x1 + offsetX,
                      y1: cleanData.y1 + offsetY,
                      x2: cleanData.x2 + offsetX,
                      y2: cleanData.y2 + offsetY,
                    };
                  } else if (cleanData.type === 'text' || cleanData.type === 'circle' || cleanData.type === 'rectangle') {
                    return {
                      ...cleanData,
                      x: cleanData.x + offsetX,
                      y: cleanData.y + offsetY,
                    };
                  }
                  return cleanData;
                });
                
                if (shapesToCreate.length === 0) {
                  return;
                }
                
                // Add shapes one by one and collect their IDs
                const createPromises = shapesToCreate.map((shapeData: any) => {
                  return addShape(shapeData, { skipAutoLock: true }).catch(error => {
                    console.error('Failed to create shape:', error);
                    return null;
                  });
                });
                
                Promise.all(createPromises).then((newShapeIds) => {
                  // Filter out any failed creations (null values) and select the newly pasted shapes
                  const validIds = newShapeIds.filter((id): id is string => id !== null);
                  
                  if (validIds.length > 0) {
                    // Small delay to ensure shapes are rendered before selecting
                    setTimeout(() => {
                      selectMultipleShapes(validIds, false);
                    }, 50);
                  }
                });
              } catch (error) {
                console.error('Failed to parse clipboard data:', error);
              }
            })
            .catch(err => {
              console.error('Failed to read clipboard:', err);
              alert('Failed to read clipboard. Make sure you granted clipboard permissions.');
            });
        }
        return;
      }

      // Delete selected shapes (only Delete key, not Backspace)
      if (e.key === 'Delete') {
        if (selectedIds.length > 0) {
          e.preventDefault();
          // ⚡ BATCH DELETE - all shapes delete at once!
          deleteShapes(selectedIds).catch(error => {
            console.error('Failed to delete shapes:', error);
          });
        }
      }
      
      // Duplicate selected shapes (Ctrl+Shift+D / Cmd+Shift+D)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        if (selectedIds.length > 0 && !e.repeat) {
          e.preventDefault();
          // Duplicate all selected shapes
          duplicateShapes(selectedIds).catch(error => {
            console.error('Failed to duplicate shapes:', error);
          });
        }
      }
      
      // Escape to deselect all
      if (e.key === 'Escape') {
        selectShape(null);
      }

      // Zoom shortcuts
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
        return;
      }
      if (e.key === '-') {
        e.preventDefault();
        handleZoomOut();
        return;
      }
      
      // Reset view (Ctrl/Cmd + 0)
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        handleResetView();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, shapes, currentTool, setCurrentTool, deleteShapes, selectShape, duplicateShapes, addShape, selectMultipleShapes, handleZoomIn, handleZoomOut, handleResetView, mousePositionRef]);
}

