/**
 * useTextEditing Hook
 * Manages text shape editing state and handlers
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { TextShape, Shape } from '../types';

interface UseTextEditingProps {
  shapes: Shape[];
  selectedIds: string[];
  stageScale: number;
  stagePosition: { x: number; y: number };
  updateShape: (id: string, updates: Partial<Shape>, localOnly?: boolean) => Promise<void>;
  deleteShape: (id: string) => Promise<void>;
}

export function useTextEditing({
  shapes,
  selectedIds,
  stageScale,
  stagePosition,
  updateShape,
  deleteShape,
}: UseTextEditingProps) {
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [textAreaValue, setTextAreaValue] = useState('');
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  /**
   * Start editing text shape
   */
  const handleTextDoubleClick = useCallback((textShape: TextShape) => {
    setEditingTextId(textShape.id);
    setTextAreaValue(textShape.text);
    setTimeout(() => textAreaRef.current?.focus(), 0);
  }, []);

  /**
   * Start editing a newly created text shape
   */
  const startEditingNewText = useCallback((shapeId: string) => {
    // If shapeId is special signal, get the selected text shape
    // (addShape automatically selects newly created shapes)
    let targetId = shapeId;
    if (shapeId === '_last_created_') {
      // Get the first selected shape (should be the newly created text)
      if (selectedIds.length > 0) {
        const selectedShape = shapes.find(s => s.id === selectedIds[0]);
        if (selectedShape && selectedShape.type === 'text') {
          targetId = selectedShape.id;
        } else {
          return;
        }
      } else {
        return;
      }
    }

    const textShape = shapes.find(s => s.id === targetId);
    if (textShape && textShape.type === 'text') {
      setEditingTextId(targetId);
      setTextAreaValue(textShape.text);
      // Focus the textarea and select all text for easy replacement
      requestAnimationFrame(() => {
        textAreaRef.current?.focus();
        textAreaRef.current?.select();
      });
    }
  }, [shapes, selectedIds]);

  /**
   * Finish editing text and save to Firebase
   */
  const handleTextEditEnd = useCallback(() => {
    if (editingTextId) {
      const trimmedText = textAreaValue.trim();
      if (trimmedText) {
        // Save final text to Firebase (not localOnly)
        updateShape(editingTextId, { text: trimmedText }, false);
      } else {
        // If text is empty, delete the shape
        deleteShape(editingTextId);
      }
      setEditingTextId(null);
      setTextAreaValue('');
    }
  }, [editingTextId, textAreaValue, updateShape, deleteShape]);

  /**
   * Auto-focus textarea when editing starts and set initial height
   */
  useEffect(() => {
    if (editingTextId && textAreaRef.current) {
      textAreaRef.current.focus();
      textAreaRef.current.select();
      // Set initial height to fit content
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
    }
  }, [editingTextId]);

  /**
   * Get screen position and size for text editing overlay
   * Converts canvas coordinates to screen coordinates
   */
  const getTextEditPosition = useCallback(() => {
    if (!editingTextId) return null;
    
    const textShape = shapes.find(s => s.id === editingTextId);
    if (!textShape || textShape.type !== 'text') return null;
    
    // Convert canvas coordinates to screen coordinates
    const screenX = textShape.x * stageScale + stagePosition.x;
    const screenY = textShape.y * stageScale + stagePosition.y;
    
    // Scale the width to match the canvas rendering (default to 200 if not set)
    const screenWidth = (textShape.width || 200) * stageScale;
    
    return { 
      x: screenX, 
      y: screenY, 
      width: screenWidth,
      shape: textShape 
    };
  }, [editingTextId, shapes, stageScale, stagePosition]);

  return {
    editingTextId,
    textAreaValue,
    textAreaRef,
    setTextAreaValue,
    handleTextDoubleClick,
    handleTextEditEnd,
    getTextEditPosition,
    startEditingNewText,
  };
}

