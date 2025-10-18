/**
 * AI Input Component
 * Text input for sending AI commands
 */

import { useState, forwardRef, useEffect, type KeyboardEvent } from 'react';

interface AIInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  initialValue?: string;
}

export const AIInput = forwardRef<HTMLTextAreaElement, AIInputProps>(
  ({ onSendMessage, isLoading, initialValue }, ref) => {
    const [value, setValue] = useState('');

    // Set initial value if provided
    useEffect(() => {
      if (initialValue) {
        setValue(initialValue);
      }
    }, [initialValue]);

    const handleSubmit = () => {
      const trimmed = value.trim();
      if (!trimmed || isLoading) return;

      onSendMessage(trimmed);
      setValue('');
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    };

    return (
      <div className="flex flex-col gap-2">
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 dark:border-blue-400 border-t-transparent"></div>
            <span>AI is thinking...</span>
          </div>
        )}
        
        <div className="flex gap-2">
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Ask AI to create or move shapes..."
            rows={3}
            className="flex-1 px-3 py-2 bg-theme-surface text-theme-primary border border-theme rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-theme-surface-hover disabled:cursor-not-allowed text-sm resize-none overflow-y-auto scrollbar-thin"
          />
          <button
            onClick={handleSubmit}
            disabled={!value.trim() || isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-theme-surface-hover disabled:text-theme-secondary disabled:cursor-not-allowed transition-colors text-sm font-medium"
            title="Send message"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    );
  }
);

AIInput.displayName = 'AIInput';

