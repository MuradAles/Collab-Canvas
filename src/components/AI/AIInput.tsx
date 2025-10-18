/**
 * AI Input Component
 * Text input for sending AI commands
 */

import { useState, forwardRef, useEffect } from 'react';

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

    return (
      <div className="flex items-center gap-2 w-full">
        <div className="flex-1 relative">
          <input
            ref={ref}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            disabled={isLoading}
            placeholder={isLoading ? "AI is thinking..." : "Ask AI to create or move shapes..."}
            className="w-full px-3 py-2 bg-theme-surface-hover text-theme-primary placeholder-theme-secondary border border-theme rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
            </div>
          )}
        </div>
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || isLoading}
          className="flex-shrink-0 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-theme-surface-hover disabled:text-theme-secondary disabled:cursor-not-allowed font-medium text-sm"
          title="Send (Enter)"
        >
          Send
        </button>
      </div>
    );
  }
);

AIInput.displayName = 'AIInput';

