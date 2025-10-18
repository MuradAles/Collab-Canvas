/**
 * AI Canvas Integration
 * Integrates AI panel with canvas, handles slash command and AI operations
 */

import { useState, useEffect, useCallback } from 'react';
import { AIPanel } from './AIPanel';
import { AIToast, type ToastMessage } from './AIToast';
import { sendAICommand, type AIResponse } from '../../services/ai/openai';
import { executeToolCalls } from '../../services/ai/toolExecutor';
import { canMakeRequest, recordRequest } from '../../services/ai/rateLimiter';
import { broadcastAIActivity, subscribeToAIActivity } from '../../services/aiNotifications';
import { useCanvasContext } from '../../contexts/CanvasContext';
import { useAuth } from '../../contexts/AuthContext';

interface AICanvasIntegrationProps {
  onOpenPanel?: () => void;
  initialMessage?: string;
  forceOpen?: boolean;
  viewportCenter?: { x: number; y: number };
  viewportBounds?: { minX: number; maxX: number; minY: number; maxY: number };
}

export function AICanvasIntegration({ onOpenPanel, initialMessage, forceOpen, viewportCenter, viewportBounds }: AICanvasIntegrationProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessages, setToastMessages] = useState<ToastMessage[]>([]);
  const [panelMessage, setPanelMessage] = useState<string | undefined>(initialMessage);
  
  const canvasContext = useCanvasContext();
  const { currentUser } = useAuth();
  const { shapes } = canvasContext;

  // Handle opening panel with optional initial message
  const handleOpenPanel = useCallback((message?: string) => {
    setIsPanelOpen(true);
    if (message !== undefined) {
      setPanelMessage(message);
    }
    onOpenPanel?.();
  }, [onOpenPanel]);

  // Global slash command listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if we're in a text input or textarea
      const target = e.target as HTMLElement;
      const isTextInput = 
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.contentEditable === 'true';

      // Open AI panel with "/" if not in text input
      if (e.key === '/' && !isTextInput) {
        e.preventDefault();
        handleOpenPanel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleOpenPanel]);

  // Handle AI command
  const handleSendMessage = async (message: string, history: { role: 'user' | 'assistant'; content: string }[] = []): Promise<AIResponse> => {
    if (!currentUser) {
      throw new Error('You must be logged in to use AI');
    }

    // Check rate limit
    const rateLimitCheck = canMakeRequest();
    if (!rateLimitCheck.allowed) {
      throw new Error(`Rate limit exceeded. Please wait ${rateLimitCheck.waitTime} seconds.`);
    }

    setIsLoading(true);

    try {
      // Send message to OpenAI with conversation history
      const aiResponse = await sendAICommand(message, shapes, history, {
        viewport: viewportCenter && viewportBounds ? {
          center: viewportCenter,
          bounds: viewportBounds,
        } : undefined,
      });

      // Execute tool calls
      if (aiResponse.toolCalls.length > 0) {
        const executionResult = await executeToolCalls(
          aiResponse.toolCalls,
          canvasContext,
          currentUser,
          shapes
        );

        // Record request for rate limiting
        recordRequest();

        // Broadcast AI activity to all users (they will see the toast)
        if (executionResult.success) {
          await broadcastAIActivity(
            currentUser.uid,
            currentUser.displayName || 'Someone',
            message,
            executionResult.message
          );
          
          // Show toast locally for the current user as well
          showToast(
            currentUser.displayName || 'Someone',
            executionResult.message
          );
        }

        // Build a better final message that includes created shape names
        let finalMessage = executionResult.message;
        
        // If shapes were created, append their actual names
        if (executionResult.createdShapeNames.length > 0) {
          finalMessage += `\n\n📝 Created shapes: ${executionResult.createdShapeNames.map(n => `"${n}"`).join(', ')}`;
        }
        
        // If it's a query result, use that
        if (executionResult.message.includes('\n') && executionResult.message.includes('Found')) {
          finalMessage = executionResult.message;
        }

        return {
          message: finalMessage,
          toolCalls: aiResponse.toolCalls,
          debugInfo: [
            ...aiResponse.debugInfo,
            '',
            '=== Execution Results ===',
            ...executionResult.debugLog,
            ...(executionResult.createdShapeNames.length > 0 ? ['', `Created: ${executionResult.createdShapeNames.join(', ')}`] : []),
            ...(executionResult.errors.length > 0 ? ['', 'Errors:', ...executionResult.errors] : []),
          ],
        };
      }

      // No tool calls, just return AI's message
      return aiResponse;

    } catch (error) {
      console.error('AI command error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Show toast notification
  const showToast = (userName: string, summary: string) => {
    const toast: ToastMessage = {
      id: Date.now().toString(),
      userName,
      summary,
      timestamp: Date.now(),
    };

    setToastMessages(prev => [...prev, toast]);
  };

  // Dismiss toast
  const handleDismissToast = (id: string) => {
    setToastMessages(prev => prev.filter(t => t.id !== id));
  };

  // Subscribe to AI activity notifications from other users
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToAIActivity(
      currentUser.uid,
      (notification) => {
        // Show toast for notifications from other users
        showToast(notification.userName, notification.summary);
      }
    );

    return unsubscribe;
  }, [currentUser]);

  // Open panel when initialMessage is provided or forceOpen is true
  useEffect(() => {
    if (initialMessage !== undefined || forceOpen) {
      setIsPanelOpen(true);
    }
  }, [initialMessage, forceOpen]);

  return (
    <>
      {/* AI Panel */}
      <AIPanel
        isOpen={isPanelOpen}
        onClose={() => {
          setIsPanelOpen(false);
          onOpenPanel?.();  // Notify parent that panel is closed
        }}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        initialMessage={panelMessage}
      />

      {/* Toast Notifications */}
      <AIToast
        messages={toastMessages}
        onDismiss={handleDismissToast}
      />
    </>
  );
}

// Hook for using AI integration in other components
export function useAIIntegration() {
  const [openPanelTrigger, setOpenPanelTrigger] = useState<string | undefined>();

  const openAIPanel = useCallback((message?: string) => {
    setOpenPanelTrigger(message);
  }, []);

  return {
    openAIPanel,
    AIIntegrationComponent: AICanvasIntegration,
    panelMessage: openPanelTrigger,
  };
}

