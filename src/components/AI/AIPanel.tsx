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
  const [showHelp, setShowHelp] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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


  return (
    <div className={`fixed right-0 top-0 h-screen w-64 bg-theme-surface border-l border-theme shadow-lg z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-theme bg-gradient-to-r from-blue-500 to-purple-600">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          <h2 className="text-lg font-semibold text-white">AI Assistant</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
            title="Show available commands"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
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
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between p-3 border-b border-theme bg-theme-surface-hover">
        <button
          onClick={() => setIsDebugMode(!isDebugMode)}
          className={`text-sm px-3 py-1 rounded-md transition-colors ${
            isDebugMode 
              ? 'bg-blue-500 text-white' 
              : 'bg-theme-surface-hover text-theme-primary hover:opacity-80'
          }`}
          title="Toggle debug mode"
        >
          👁️ {isDebugMode ? 'Hide Debug' : 'Show Debug'}
        </button>

        {messages.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="text-sm px-3 py-1 rounded-md bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
            title="Clear chat history"
          >
            Clear History
          </button>
        )}
      </div>

      {/* Help Section */}
      {showHelp && (
        <div className="border-b border-theme bg-blue-50 dark:bg-blue-900/20 p-4 max-h-[300px] overflow-y-auto scrollbar-thin">
          <h3 className="font-semibold text-theme-primary mb-3">📚 Available Commands</h3>
          <div className="space-y-3 text-sm">
            {/* Create Shapes */}
            <div className="bg-theme-surface p-2 rounded">
              <span className="font-semibold text-blue-600 dark:text-blue-400">🎨 Create Shapes</span>
              <p className="text-xs text-theme-secondary mt-1">Create rectangles, circles, lines, and text</p>
              <p className="text-xs text-theme-secondary opacity-70 italic mt-1">Ex: "Create 3 red circles", "Create a blue rectangle at center"</p>
            </div>

            {/* Move Shapes */}
            <div className="bg-theme-surface p-2 rounded">
              <span className="font-semibold text-green-600 dark:text-green-400">↔️ Move Shapes</span>
              <p className="text-xs text-theme-secondary mt-1">Move shapes to positions, arrange in lines</p>
              <p className="text-xs text-theme-secondary opacity-70 italic mt-1">Ex: "Move Rectangle 1 to top-left", "Arrange all circles in a line"</p>
            </div>

            {/* Resize Shapes */}
            <div className="bg-theme-surface p-2 rounded">
              <span className="font-semibold text-purple-600 dark:text-purple-400">↔️ Resize Shapes</span>
              <p className="text-xs text-theme-secondary mt-1">Change size, width, height, or radius</p>
              <p className="text-xs text-theme-secondary opacity-70 italic mt-1">Ex: "Resize all circles to radius 50", "Make Rectangle 1 200x300"</p>
            </div>

            {/* Rotate Shapes */}
            <div className="bg-theme-surface p-2 rounded">
              <span className="font-semibold text-orange-600 dark:text-orange-400">↻ Rotate Shapes</span>
              <p className="text-xs text-theme-secondary mt-1">Rotate rectangles and lines</p>
              <p className="text-xs text-theme-secondary opacity-70 italic mt-1">Ex: "Rotate all rectangles to 45 degrees", "Rotate Line 1 by 90"</p>
            </div>

            {/* Change Color */}
            <div className="bg-theme-surface p-2 rounded">
              <span className="font-semibold text-red-600 dark:text-red-400">🎨 Change Color</span>
              <p className="text-xs text-theme-secondary mt-1">Change fill color of shapes</p>
              <p className="text-xs text-theme-secondary opacity-70 italic mt-1">Ex: "Make all circles blue", "Change Rectangle 1 to red"</p>
            </div>

            {/* Align Shapes */}
            <div className="bg-theme-surface p-2 rounded">
              <span className="font-semibold text-teal-600 dark:text-teal-400">⫼ Align Shapes</span>
              <p className="text-xs text-theme-secondary mt-1">Align shapes left, right, top, bottom, or center</p>
              <p className="text-xs text-theme-secondary opacity-70 italic mt-1">Ex: "Align all rectangles to the left", "Center all circles vertically"</p>
            </div>

            {/* Change Layer */}
            <div className="bg-theme-surface p-2 rounded">
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">📚 Change Layer (Z-Index)</span>
              <p className="text-xs text-theme-secondary mt-1">Bring to front, send to back, or reorder</p>
              <p className="text-xs text-theme-secondary opacity-70 italic mt-1">Ex: "Bring Rectangle 1 to front", "Send Circle 1 to back"</p>
            </div>

            {/* Change Style */}
            <div className="bg-theme-surface p-2 rounded">
              <span className="font-semibold text-pink-600 dark:text-pink-400">✏️ Change Style</span>
              <p className="text-xs text-theme-secondary mt-1">Modify stroke, corner radius, line caps</p>
              <p className="text-xs text-theme-secondary opacity-70 italic mt-1">Ex: "Add 5px red stroke to Rectangle 1", "Set corner radius to 20"</p>
            </div>

            {/* Delete Shapes */}
            <div className="bg-theme-surface p-2 rounded">
              <span className="font-semibold text-red-700 dark:text-red-400">🗑️ Delete Shapes</span>
              <p className="text-xs text-theme-secondary mt-1">Remove shapes from canvas</p>
              <p className="text-xs text-theme-secondary opacity-70 italic mt-1">Ex: "Delete all circles", "Delete Rectangle 1"</p>
            </div>

            {/* Query Canvas */}
            <div className="bg-theme-surface p-2 rounded">
              <span className="font-semibold text-theme-primary">❓ Query Canvas</span>
              <p className="text-xs text-theme-secondary mt-1">Get information about shapes on canvas</p>
              <p className="text-xs text-theme-secondary opacity-70 italic mt-1">Ex: "What shapes are on the canvas?", "Show me all rectangles"</p>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="text-center text-theme-secondary mt-8">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-sm">Ask me to create or move shapes!</p>
            <p className="text-xs text-theme-secondary opacity-70 mt-2">
              Click the <span className="font-semibold">❓</span> icon above to see all available commands
            </p>
            <div className="mt-4 text-xs text-left bg-theme-surface-hover p-3 rounded-lg">
              <p className="font-semibold mb-2 text-theme-primary">Try these commands:</p>
              <ul className="space-y-1 text-theme-secondary">
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
      <div className="border-t border-theme p-4 bg-theme-surface">
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

