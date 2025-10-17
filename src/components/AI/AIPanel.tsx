/**
 * AI Panel Component
 * Main panel for AI chat interface
 */

import { useState, useRef, useEffect } from 'react';
import { AIInput } from './AIInput';
import { AIMessage } from './AIMessage';
import type { AIResponse, ToolCall } from '../../services/ai/openai';

// ============================================================================
// Type Definitions
// ============================================================================

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'error';
  content: string;
  timestamp: number;
  toolCalls?: ToolCall[];
  debugInfo?: string[];
}

export interface ConversationHistory {
  role: 'user' | 'assistant';
  content: string;
}

interface AIPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (message: string, history: ConversationHistory[]) => Promise<AIResponse>;
  isLoading: boolean;
  initialMessage?: string;
}

// ============================================================================
// AI Panel Component
// ============================================================================

export function AIPanel({ 
  isOpen, 
  onClose, 
  onSendMessage,
  isLoading,
  initialMessage,
}: AIPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isDebugMode, setIsDebugMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle sending a message
  const handleSendMessage = async (content: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      // Build conversation history from messages
      const history: ConversationHistory[] = messages.map(msg => ({
        role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content,
      }));

      const response = await onSendMessage(content, history);
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response.message,
        timestamp: Date.now(),
        toolCalls: response.toolCalls,
        debugInfo: response.debugInfo,
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'error',
        content: error instanceof Error ? error.message : 'An error occurred',
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, errorMessage]);
    }
  };

  // Clear message history
  const handleClearHistory = () => {
    setMessages([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-screen w-[380px] bg-white border-r border-gray-200 shadow-lg z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          <h2 className="text-lg font-semibold text-white">AI Assistant</h2>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
          title="Close AI Panel"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => setIsDebugMode(!isDebugMode)}
          className={`text-sm px-3 py-1 rounded-md transition-colors ${
            isDebugMode 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          title="Toggle debug mode"
        >
          👁️ {isDebugMode ? 'Hide Debug' : 'Show Debug'}
        </button>

        {messages.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="text-sm px-3 py-1 rounded-md bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
            title="Clear chat history"
          >
            Clear History
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-sm">Ask me to create or move shapes!</p>
            <div className="mt-4 text-xs text-left bg-gray-50 p-3 rounded-lg">
              <p className="font-semibold mb-2">Try these commands:</p>
              <ul className="space-y-1 text-gray-600">
                <li>• "Create a blue rectangle at center"</li>
                <li>• "Move Rectangle 1 to top-left"</li>
                <li>• "Create 3 red circles in a row"</li>
                <li>• "What shapes are on the canvas?"</li>
              </ul>
            </div>
          </div>
        ) : (
          messages.slice(-10).map((message) => (
            <AIMessage
              key={message.id}
              message={message}
              isDebugMode={isDebugMode}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <AIInput
          ref={inputRef}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          initialValue={initialMessage}
        />
      </div>
    </div>
  );
}

