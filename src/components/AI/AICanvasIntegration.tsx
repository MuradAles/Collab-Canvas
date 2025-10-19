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
  onPanToShapes?: (shapeIds: string[], onlyIfFar?: boolean) => void;
  isChatExpanded?: boolean;
  isDebugMode?: boolean;
  onChatExpandedChange?: (expanded: boolean) => void;
  onDebugModeChange?: (debug: boolean) => void;
}

export function AICanvasIntegration({ 
  onOpenPanel, 
  initialMessage, 
  forceOpen, 
  viewportCenter, 
  viewportBounds,
  onPanToShapes,
  isChatExpanded = false,
  isDebugMode = false,
}: AICanvasIntegrationProps) {
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
  const handleSendMessage = async (message: string): Promise<AIResponse> => {
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
      // Round viewport coordinates to make AI math easier (avoid decimal arithmetic errors)
      const roundedViewport = viewportCenter && viewportBounds ? {
        center: {
          x: Math.round(viewportCenter.x),
          y: Math.round(viewportCenter.y)
        },
        bounds: {
          minX: Math.round(viewportBounds.minX),
          maxX: Math.round(viewportBounds.maxX),
          minY: Math.round(viewportBounds.minY),
          maxY: Math.round(viewportBounds.maxY)
        }
      } : undefined;
      
      // Send message to OpenAI (each command is independent, no history)
      const aiResponse = await sendAICommand(message, shapes, { viewport: roundedViewport });

      // Console log for debugging
      console.time('⏱️ AI Response Time');
      console.log(`\n🎯 User Command: "${message}"`);
      console.log(`🗺️ Viewport Center (original): (${viewportCenter?.x}, ${viewportCenter?.y})`);
      console.log(`🗺️ Viewport Center (rounded for AI): (${roundedViewport?.center.x}, ${roundedViewport?.center.y})`);
      console.log(`💬 AI Response: "${aiResponse.message}"`);
      console.log(`🔧 Tool Calls: ${aiResponse.toolCalls.length}`);
      console.timeEnd('⏱️ AI Response Time');
      if (aiResponse.toolCalls.length > 0) {
        console.log(`📋 Tools to execute:`, aiResponse.toolCalls.map(tc => tc.function.name));
      }

      // Execute tool calls
      if (aiResponse.toolCalls.length > 0) {
        const executionResult = await executeToolCalls(
          aiResponse.toolCalls,
          canvasContext,
          currentUser,
          shapes,
          {
            viewport: roundedViewport, // Use same rounded viewport that AI used
          }
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

        // Auto-pan camera to show created shapes (Option B: only if far away)
        if (executionResult.createdShapeIds.length > 0 && onPanToShapes) {
          // Small delay to ensure Firestore sync completes
          setTimeout(() => {
            onPanToShapes(executionResult.createdShapeIds, true);
          }, 1500);
        }

        // Use AI's natural response if available, otherwise use generated message
        let finalMessage = aiResponse.message || executionResult.message;
        
        // If shapes were created, append their actual names for reference
        if (executionResult.createdShapeNames.length > 0) {
          finalMessage += `\n\n📝 Shapes: ${executionResult.createdShapeNames.map(n => `"${n}"`).join(', ')}`;
        }
        
        // If execution had errors, append them with details
        if (executionResult.errors.length > 0) {
          finalMessage += `\n\n⚠️ ${executionResult.errors.length} error${executionResult.errors.length > 1 ? 's' : ''} occurred:\n`;
          executionResult.errors.forEach((error, index) => {
            finalMessage += `${index + 1}. ${error}\n`;
          });
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

  // Sync panel state with forceOpen prop
  useEffect(() => {
    if (forceOpen) {
      setIsPanelOpen(true);
    } else {
      setIsPanelOpen(false);
    }
  }, [forceOpen]);

  // Open panel when initialMessage is provided
  useEffect(() => {
    if (initialMessage !== undefined) {
      setIsPanelOpen(true);
    }
  }, [initialMessage]);

  return (
    <>
      {/* AI Panel */}
      <AIPanel
        isOpen={isPanelOpen}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        initialMessage={panelMessage}
        isChatExpanded={isChatExpanded}
        isDebugMode={isDebugMode}
      />

      {/* Toast Notifications */}
      <AIToast
        messages={toastMessages}
        onDismiss={handleDismissToast}
      />
    </>
  );
}

// Export component only (hook is exported from src/hooks/useAIIntegration.ts)
export { AICanvasIntegration as default };

