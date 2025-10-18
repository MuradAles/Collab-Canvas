/**
 * AI Message Component
 * Displays individual chat messages with optional debug info
 */

import type { ChatMessage } from './AIPanel';

interface AIMessageProps {
  message: ChatMessage;
  isDebugMode: boolean;
}

export function AIMessage({ message, isDebugMode }: AIMessageProps) {
  const isUser = message.type === 'user';
  const isError = message.type === 'error';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] ${isUser ? 'order-2' : 'order-1'}`}>
        {/* Message bubble */}
        <div
          className={`rounded-lg px-4 py-2 ${
            isUser
              ? 'bg-blue-500 text-white'
              : isError
              ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 border border-red-300 dark:border-red-700'
              : 'bg-theme-surface-hover text-theme-primary'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Timestamp */}
        <p className="text-xs text-theme-secondary mt-1 px-1">
          {new Date(message.timestamp).toLocaleTimeString()}
        </p>

        {/* Debug info */}
        {!isUser && isDebugMode && message.debugInfo && message.debugInfo.length > 0 && (
          <div className="mt-2 p-3 bg-gray-800 dark:bg-gray-900 text-gray-100 dark:text-gray-200 rounded-lg text-xs font-mono">
            <p className="font-semibold text-green-400 mb-2">Debug Info:</p>
            {message.debugInfo.map((info, idx) => (
              <p key={idx} className="mb-1 text-gray-300 dark:text-gray-400">
                {info}
              </p>
            ))}
          </div>
        )}

        {/* Tool calls (debug mode) */}
        {!isUser && isDebugMode && message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg text-xs">
            <p className="font-semibold text-blue-700 dark:text-blue-400 mb-2">
              Tool Calls ({message.toolCalls.length}):
            </p>
            {message.toolCalls.map((tc, idx) => (
              <div key={tc.id} className="mb-2 last:mb-0">
                <p className="font-semibold text-blue-600 dark:text-blue-400">
                  {idx + 1}. {tc.function.name}
                </p>
                <pre className="mt-1 p-2 bg-theme-surface text-theme-primary rounded text-xs overflow-x-auto">
                  {JSON.stringify(JSON.parse(tc.function.arguments), null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

