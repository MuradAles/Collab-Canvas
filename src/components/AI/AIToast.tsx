/**
 * AI Toast Component
 * Toast notification for AI activity
 */

import { useEffect, useState } from 'react';

export interface ToastMessage {
  id: string;
  userName: string;
  summary: string;
  timestamp: number;
}

interface AIToastProps {
  messages: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function AIToast({ messages, onDismiss }: AIToastProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {messages.map((message) => (
        <ToastItem
          key={message.id}
          message={message}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}

function ToastItem({ message, onDismiss }: { message: ToastMessage; onDismiss: (id: string) => void }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Slide in animation
    setTimeout(() => setIsVisible(true), 10);

    // Auto-dismiss after 4 seconds
    const timer = setTimeout(() => {
      handleDismiss();
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss(message.id);
    }, 300); // Wait for slide-out animation
  };

  return (
    <div
      className={`
        bg-theme-surface border border-theme rounded-lg shadow-lg p-4 min-w-[300px] max-w-[400px]
        transform transition-all duration-300 ease-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">🤖</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-theme-primary">
            {message.userName} used AI
          </p>
          <p className="text-sm text-theme-secondary mt-1">{message.summary}</p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-theme-secondary hover:text-theme-primary transition-colors"
          title="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

