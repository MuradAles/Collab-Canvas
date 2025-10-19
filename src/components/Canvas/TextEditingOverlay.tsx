/**
 * Text Editing Overlay
 * Floating textarea for editing text shapes
 */

import type { TextShape } from '../../types';

interface TextEditPosition {
  x: number;
  y: number;
  width: number;
  shape: TextShape;
}

interface TextEditingOverlayProps {
  editingTextId: string | null;
  textAreaValue: string;
  textAreaRef: React.RefObject<HTMLTextAreaElement | null>;
  textEditPosition: TextEditPosition | null;
  stageScale: number;
  onTextChange: (value: string) => void;
  onTextEditEnd: () => void;
  onUpdateShape: (id: string, updates: { text: string }, localOnly: boolean) => void;
}

export function TextEditingOverlay({
  editingTextId,
  textAreaValue,
  textAreaRef,
  textEditPosition,
  stageScale,
  onTextChange,
  onTextEditEnd,
  onUpdateShape,
}: TextEditingOverlayProps) {
  if (!editingTextId || !textEditPosition) {
    return null;
  }

  return (
    <textarea
      ref={textAreaRef}
      value={textAreaValue}
      onChange={(e) => {
        const newValue = e.target.value;
        onTextChange(newValue);
        // Update canvas text in real-time (local only, no Firebase)
        if (editingTextId) {
          onUpdateShape(editingTextId, { text: newValue }, true);
        }
        // Auto-resize textarea height to fit content
        if (textAreaRef.current) {
          textAreaRef.current.style.height = 'auto';
          textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
        }
      }}
      onBlur={onTextEditEnd}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onTextEditEnd();
        } else if (e.key === 'Escape') {
          onTextEditEnd();
        }
        e.stopPropagation();
      }}
      style={{
        position: 'absolute',
        left: `${textEditPosition.x}px`,
        top: `${textEditPosition.y}px`,
        width: `${textEditPosition.width}px`,
        height: 'auto',
        fontSize: `${textEditPosition.shape.fontSize * stageScale}px`,
        fontFamily: textEditPosition.shape.fontFamily,
        fontStyle: textEditPosition.shape.fontStyle || 'normal',
        textDecoration: textEditPosition.shape.textDecoration || 'none',
        color: 'transparent',
        border: 'none',
        background: 'transparent',
        padding: '0',
        margin: '0',
        resize: 'none',
        outline: 'none',
        boxShadow: 'none',
        lineHeight: '1',
        textAlign: 'left',
        verticalAlign: 'top',
        overflow: 'hidden',
        overflowY: 'hidden',
        zIndex: 500,
        boxSizing: 'border-box',
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
        caretColor: textEditPosition.shape.fill,
      }}
      autoFocus
      onInput={(e) => {
        const target = e.target as HTMLTextAreaElement;
        target.style.height = 'auto';
        target.style.height = `${target.scrollHeight}px`;
      }}
    />
  );
}

