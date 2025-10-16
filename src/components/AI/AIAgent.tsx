/**
 * AI Agent Component
 * Chat interface for AI-powered canvas operations
 */

import { useState, useRef, useEffect } from 'react';
import { useCanvasContext } from '../../contexts/CanvasContext';
import { useAuth } from '../../contexts/AuthContext';
import { processAICommand, generateCanvasStateSummary } from '../../services/ai';
import { broadcastAIActivity } from '../../services/presence';
import type { AIMessage } from '../../types';
import type OpenAI from 'openai';

interface AIAgentProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIAgent({ isOpen, onClose }: AIAgentProps) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const { shapes, addShape, updateShape, deleteShape } = useCanvasContext();
  const { currentUser } = useAuth();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize Web Speech API
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true; // Keep listening even during pauses
      recognitionRef.current.interimResults = true; // Show real-time results
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        // Build full transcript from all results
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript;
        }
        setInput(fullTranscript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        // Only stop if user manually stopped (not if it auto-stopped)
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      console.warn('Voice input is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleToolCall = async (toolName: string, args: any): Promise<any> => {
    console.log(`[AI Tool] ${toolName}`, args);

    switch (toolName) {
      case 'createShape': {
        const { type, x, y, width, height, radius, fill, text, fontSize } = args;
        
        const newShape: any = {
          type,
          x: x || 500,
          y: y || 500,
          rotation: 0,
          zIndex: shapes.length,
        };

        if (type === 'rectangle') {
          newShape.width = width || 100;
          newShape.height = height || 100;
          newShape.fill = fill || '#3b82f6';
          newShape.stroke = '#1e40af';
          newShape.strokeWidth = 2;
          newShape.cornerRadius = 0;
        } else if (type === 'circle') {
          newShape.radius = radius || 50;
          newShape.fill = fill || '#ef4444';
          newShape.stroke = '#b91c1c';
          newShape.strokeWidth = 2;
        } else if (type === 'text') {
          newShape.text = text || 'Text';
          newShape.fontSize = fontSize || 24;
          newShape.fontFamily = 'Arial';
          newShape.fill = fill || '#000000';
        }

        await addShape(newShape);
        return { success: true };
      }

      case 'moveShape': {
        const { shapeId, x, y } = args;
        await updateShape(shapeId, { x, y });
        return { success: true };
      }

      case 'resizeShape': {
        const { shapeId, width, height, radius } = args;
        const updates: any = {};
        if (width !== undefined) updates.width = width;
        if (height !== undefined) updates.height = height;
        if (radius !== undefined) updates.radius = radius;
        await updateShape(shapeId, updates);
        return { success: true };
      }

      case 'rotateShape': {
        const { shapeId, degrees } = args;
        await updateShape(shapeId, { rotation: degrees });
        return { success: true };
      }

      case 'deleteShape': {
        const { shapeId } = args;
        await deleteShape(shapeId);
        return { success: true };
      }

      case 'editShape': {
        const { shapeId, fill, stroke, strokeWidth, text, fontSize } = args;
        const updates: any = {};
        if (fill !== undefined) updates.fill = fill;
        if (stroke !== undefined) updates.stroke = stroke;
        if (strokeWidth !== undefined) updates.strokeWidth = strokeWidth;
        if (text !== undefined) updates.text = text;
        if (fontSize !== undefined) updates.fontSize = fontSize;
        await updateShape(shapeId, updates);
        return { success: true };
      }

      case 'arrangeShapes': {
        const { shapeIds, direction, spacing = 20, columns = 3 } = args;
        // Filter out line shapes since they don't have x, y properties (they use x1, y1, x2, y2)
        const shapesToArrange = shapes.filter(s => shapeIds.includes(s.id) && s.type !== 'line');
        
        if (shapesToArrange.length === 0) {
          return { success: false, error: 'No valid shapes to arrange (lines cannot be arranged)' };
        }
        
        if (direction === 'horizontal') {
          const firstShape = shapesToArrange[0];
          let currentX = (firstShape && 'x' in firstShape) ? firstShape.x : 100;
          for (const shape of shapesToArrange) {
            if ('x' in shape && 'y' in shape) {
              await updateShape(shape.id, { x: currentX, y: shape.y });
              const shapeWidth = (shape as any).width || (shape as any).radius * 2 || 100;
              currentX += shapeWidth + spacing;
            }
          }
        } else if (direction === 'vertical') {
          const firstShape = shapesToArrange[0];
          let currentY = (firstShape && 'y' in firstShape) ? firstShape.y : 100;
          for (const shape of shapesToArrange) {
            if ('x' in shape && 'y' in shape) {
              await updateShape(shape.id, { x: shape.x, y: currentY });
              const shapeHeight = (shape as any).height || (shape as any).radius * 2 || 100;
              currentY += shapeHeight + spacing;
            }
          }
        } else if (direction === 'grid') {
          const firstShape = shapesToArrange[0];
          let currentX = (firstShape && 'x' in firstShape) ? firstShape.x : 100;
          let currentY = (firstShape && 'y' in firstShape) ? firstShape.y : 100;
          let col = 0;

          for (const shape of shapesToArrange) {
            if ('x' in shape && 'y' in shape) {
              await updateShape(shape.id, { x: currentX, y: currentY });
              
              col++;
              if (col >= columns) {
                col = 0;
                currentX = (firstShape && 'x' in firstShape) ? firstShape.x : 100;
                currentY += 120 + spacing;
              } else {
                currentX += 120 + spacing;
              }
            }
          }
        }
        return { success: true };
      }

      case 'alignShapes': {
        const { shapeIds, alignment } = args;
        // Filter out line shapes since they don't have x, y properties (they use x1, y1, x2, y2)
        const shapesToAlign = shapes.filter(s => shapeIds.includes(s.id) && s.type !== 'line');
        
        if (shapesToAlign.length === 0) {
          return { success: false, error: 'No valid shapes to align (lines cannot be aligned)' };
        }
        
        if (alignment === 'left') {
          const xValues = shapesToAlign.filter(s => 'x' in s).map(s => (s as any).x);
          const minX = Math.min(...xValues);
          for (const shape of shapesToAlign) {
            if ('x' in shape) {
              await updateShape(shape.id, { x: minX });
            }
          }
        } else if (alignment === 'right') {
          const xValues = shapesToAlign.filter(s => 'x' in s).map(s => (s as any).x);
          const maxX = Math.max(...xValues);
          for (const shape of shapesToAlign) {
            if ('x' in shape) {
              await updateShape(shape.id, { x: maxX });
            }
          }
        } else if (alignment === 'top') {
          const yValues = shapesToAlign.filter(s => 'y' in s).map(s => (s as any).y);
          const minY = Math.min(...yValues);
          for (const shape of shapesToAlign) {
            if ('y' in shape) {
              await updateShape(shape.id, { y: minY });
            }
          }
        } else if (alignment === 'bottom') {
          const yValues = shapesToAlign.filter(s => 'y' in s).map(s => (s as any).y);
          const maxY = Math.max(...yValues);
          for (const shape of shapesToAlign) {
            if ('y' in shape) {
              await updateShape(shape.id, { y: maxY });
            }
          }
        } else if (alignment === 'center') {
          const xValues = shapesToAlign.filter(s => 'x' in s).map(s => (s as any).x);
          const avgX = xValues.reduce((sum, x) => sum + x, 0) / xValues.length;
          for (const shape of shapesToAlign) {
            if ('x' in shape) {
              await updateShape(shape.id, { x: avgX });
            }
          }
        } else if (alignment === 'middle') {
          const yValues = shapesToAlign.filter(s => 'y' in s).map(s => (s as any).y);
          const avgY = yValues.reduce((sum, y) => sum + y, 0) / yValues.length;
          for (const shape of shapesToAlign) {
            if ('y' in shape) {
              await updateShape(shape.id, { y: avgY });
            }
          }
        }
        return { success: true };
      }

      case 'getCanvasState': {
        return { state: generateCanvasStateSummary(shapes) };
      }

      default:
        return { success: false, error: 'Unknown tool' };
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    // Broadcast AI activity to other users
    if (currentUser) {
      await broadcastAIActivity(currentUser.uid, currentUser.displayName || 'User', input.trim());
    }

    try {
      // Build conversation history for OpenAI
      const conversationHistory: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      const result = await processAICommand({
        userMessage: userMessage.content,
        conversationHistory,
        shapes,
        onToolCall: handleToolCall,
      });

      const assistantMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.message,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
            />
          </svg>
          <h3 className="font-semibold text-lg">AI Assistant</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleClearHistory}
            className="px-2 py-1 text-xs bg-purple-500 hover:bg-purple-400 rounded transition-colors"
            title="Clear history"
          >
            Clear
          </button>
          <button
            onClick={onClose}
            className="hover:bg-purple-600 p-1 rounded transition-colors"
            title="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-lg mb-2">👋 Hi! I'm your AI assistant</p>
            <p className="text-sm">Try commands like:</p>
            <ul className="text-xs mt-2 space-y-1 text-left max-w-xs mx-auto">
              <li>• "Create a red square at 500, 500"</li>
              <li>• "Make a login form"</li>
              <li>• "Create 10 circles in a row"</li>
              <li>• "Arrange shapes in a grid"</li>
            </ul>
          </div>
        )}
        
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-4 py-2 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-2 rounded-lg">
              <p className="text-sm text-gray-600">AI is thinking...</p>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ask AI to create shapes..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            disabled={isProcessing}
          />
          <button
            onClick={toggleVoiceInput}
            className={`p-2 rounded-lg transition-colors ${
              isListening
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
            title={isListening ? 'Stop listening' : 'Voice input'}
            disabled={isProcessing}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
          </button>
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isProcessing}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

