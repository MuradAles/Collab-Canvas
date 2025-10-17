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

      {/* Help Section */}
      {showHelp && (
        <div className="border-b border-gray-200 bg-blue-50 p-4 max-h-[300px] overflow-y-auto">
          <h3 className="font-semibold text-gray-800 mb-3">📚 Available Commands</h3>
          <div className="space-y-3 text-sm">
            {/* Create Shapes */}
            <div className="bg-white p-2 rounded">
              <span className="font-semibold text-blue-600">🎨 Create Shapes</span>
              <p className="text-xs text-gray-600 mt-1">Create rectangles, circles, lines, and text</p>
              <p className="text-xs text-gray-500 italic mt-1">Ex: "Create 3 red circles", "Create a blue rectangle at center"</p>
            </div>

            {/* Move Shapes */}
            <div className="bg-white p-2 rounded">
              <span className="font-semibold text-green-600">↔️ Move Shapes</span>
              <p className="text-xs text-gray-600 mt-1">Move shapes to positions, arrange in lines</p>
              <p className="text-xs text-gray-500 italic mt-1">Ex: "Move Rectangle 1 to top-left", "Arrange all circles in a line"</p>
            </div>

            {/* Resize Shapes */}
            <div className="bg-white p-2 rounded">
              <span className="font-semibold text-purple-600">↔️ Resize Shapes</span>
              <p className="text-xs text-gray-600 mt-1">Change size, width, height, or radius</p>
              <p className="text-xs text-gray-500 italic mt-1">Ex: "Resize all circles to radius 50", "Make Rectangle 1 200x300"</p>
            </div>

            {/* Rotate Shapes */}
            <div className="bg-white p-2 rounded">
              <span className="font-semibold text-orange-600">↻ Rotate Shapes</span>
              <p className="text-xs text-gray-600 mt-1">Rotate rectangles and lines</p>
              <p className="text-xs text-gray-500 italic mt-1">Ex: "Rotate all rectangles to 45 degrees", "Rotate Line 1 by 90"</p>
            </div>

            {/* Change Color */}
            <div className="bg-white p-2 rounded">
              <span className="font-semibold text-red-600">🎨 Change Color</span>
              <p className="text-xs text-gray-600 mt-1">Change fill color of shapes</p>
              <p className="text-xs text-gray-500 italic mt-1">Ex: "Make all circles blue", "Change Rectangle 1 to red"</p>
            </div>

            {/* Align Shapes */}
            <div className="bg-white p-2 rounded">
              <span className="font-semibold text-teal-600">⫼ Align Shapes</span>
              <p className="text-xs text-gray-600 mt-1">Align shapes left, right, top, bottom, or center</p>
              <p className="text-xs text-gray-500 italic mt-1">Ex: "Align all rectangles to the left", "Center all circles vertically"</p>
            </div>

            {/* Change Layer */}
            <div className="bg-white p-2 rounded">
              <span className="font-semibold text-indigo-600">📚 Change Layer (Z-Index)</span>
              <p className="text-xs text-gray-600 mt-1">Bring to front, send to back, or reorder</p>
              <p className="text-xs text-gray-500 italic mt-1">Ex: "Bring Rectangle 1 to front", "Send Circle 1 to back"</p>
            </div>

            {/* Change Style */}
            <div className="bg-white p-2 rounded">
              <span className="font-semibold text-pink-600">✏️ Change Style</span>
              <p className="text-xs text-gray-600 mt-1">Modify stroke, corner radius, line caps</p>
              <p className="text-xs text-gray-500 italic mt-1">Ex: "Add 5px red stroke to Rectangle 1", "Set corner radius to 20"</p>
            </div>

            {/* Delete Shapes */}
            <div className="bg-white p-2 rounded">
              <span className="font-semibold text-red-700">🗑️ Delete Shapes</span>
              <p className="text-xs text-gray-600 mt-1">Remove shapes from canvas</p>
              <p className="text-xs text-gray-500 italic mt-1">Ex: "Delete all circles", "Delete Rectangle 1"</p>
            </div>

            {/* Query Canvas */}
            <div className="bg-white p-2 rounded">
              <span className="font-semibold text-gray-600">❓ Query Canvas</span>
              <p className="text-xs text-gray-600 mt-1">Get information about shapes on canvas</p>
              <p className="text-xs text-gray-500 italic mt-1">Ex: "What shapes are on the canvas?", "Show me all rectangles"</p>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-sm">Ask me to create or move shapes!</p>
            <p className="text-xs text-gray-400 mt-2">
              Click the <span className="font-semibold">❓</span> icon above to see all available commands
            </p>
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

