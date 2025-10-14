/**
 * useTextEditing Hook
 * Manages text shape editing state and handlers
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { TextShape, Shape } from '../types';

interface UseTextEditingProps {
  shapes: Shape[];
  stageScale: number;
  stagePosition: { x: number; y: number };
  updateShape: (id: string, updates: Partial<Shape>) => Promise<void>;
  deleteShape: (id: string) => Promise<void>;
}

export function useTextEditing({
  shapes,
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
    // If shapeId is special signal, get last shape
    let targetId = shapeId;
    if (shapeId === '_last_created_') {
      const lastShape = shapes[shapes.length - 1];
      if (lastShape && lastShape.type === 'text') {
        targetId = lastShape.id;
      } else {
        return;
      }
    }

    const textShape = shapes.find(s => s.id === targetId);
    if (textShape && textShape.type === 'text') {
      setEditingTextId(targetId);
      setTextAreaValue('Text');
      // Focus the textarea and select all text for easy replacement
      requestAnimationFrame(() => {
        textAreaRef.current?.focus();
        textAreaRef.current?.select();
      });
    }
  }, [shapes]);

  /**
   * Finish editing text and update shape
   */
  const handleTextEditEnd = useCallback(() => {
    if (editingTextId) {
      const trimmedText = textAreaValue.trim();
      if (trimmedText) {
        updateShape(editingTextId, { text: trimmedText });
      } else {
        // If text is empty, delete the shape
        deleteShape(editingTextId);
      }
      setEditingTextId(null);
      setTextAreaValue('');
    }
  }, [editingTextId, textAreaValue, updateShape, deleteShape]);

  /**
   * Auto-focus textarea when editing starts
   */
  useEffect(() => {
    if (editingTextId && textAreaRef.current) {
      textAreaRef.current.focus();
      textAreaRef.current.select();
    }
  }, [editingTextId]);

  /**
   * Get screen position for text editing overlay
   */
  const getTextEditPosition = useCallback(() => {
    if (!editingTextId) return null;
    
    const textShape = shapes.find(s => s.id === editingTextId);
    if (!textShape || textShape.type !== 'text') return null;
    
    // Convert canvas coordinates to screen coordinates relative to container
    const x = textShape.x * stageScale + stagePosition.x;
    const y = textShape.y * stageScale + stagePosition.y;
    
    return { x, y, shape: textShape };
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

