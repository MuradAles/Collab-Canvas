/**
 * AI Panel Component
 * Bottom floating panel with simple input interface
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
  onSendMessage: (message: string, history: ConversationHistory[]) => Promise<AIResponse>;
  isLoading: boolean;
  initialMessage?: string;
  isChatExpanded?: boolean;
  isDebugMode?: boolean;
}

// ============================================================================
// AI Panel Component
// ============================================================================

export function AIPanel({ 
  isOpen, 
  onSendMessage,
  isLoading,
  initialMessage,
  isChatExpanded = false,
  isDebugMode = false,
}: AIPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
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

  // Expose messages for parent component
  useEffect(() => {
    // We'll pass messages count to parent via a callback if needed
  }, [messages]);

  // Don't render if panel is not open
  if (!isOpen) return null;

  return (
    <div 
      className="w-full"
      style={{
        position: 'fixed',
        bottom: '110px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        maxWidth: '500px',
        animation: 'slideUpPanel 0.3s ease-out forwards',
        opacity: 0,
      }}
    >
      <style>{`
        @keyframes slideUpPanel {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
      {/* Main Panel Container */}
      <div className="bg-theme-surface border border-theme rounded-lg shadow-2xl flex flex-col">
        
        {/* Collapsible Chat History - Expands UPWARD */}
        <div 
          className="overflow-hidden"
          style={{ 
            maxHeight: isChatExpanded ? '400px' : '0px',
            borderBottom: isChatExpanded ? '1px solid var(--border-color)' : 'none',
            transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), border-bottom 0.3s ease-in-out',
          }}
        >
          {/* Messages */}
          <div className="overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin bg-theme-surface-hover" style={{ maxHeight: '400px' }}>
            {messages.length === 0 ? (
              <div className="text-center text-theme-secondary text-sm py-8">
                <p>No messages yet</p>
                <p className="text-xs mt-2 opacity-70">Start a conversation with AI!</p>
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
        </div>

        {/* Input Section - Always Visible */}
        <div className="p-3">
        <AIInput
          ref={inputRef}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          initialValue={initialMessage}
        />
        </div>
      </div>
    </div>
  );
}

