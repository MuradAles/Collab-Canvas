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

export const AIInput = forwardRef<HTMLInputElement, AIInputProps>(
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

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    };

    return (
      <div className="flex flex-col gap-2">
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
            <span>AI is thinking...</span>
          </div>
        )}
        
        <div className="flex gap-2">
          <input
            ref={ref}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Ask AI to create or move shapes..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
          />
          <button
            onClick={handleSubmit}
            disabled={!value.trim() || isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
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

