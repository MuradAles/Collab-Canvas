/**
 * Tool Executor
 * Executes AI tool calls on the canvas (create shapes, move shapes, query state)
 */

import type { Shape, CanvasContextType, User } from '../../types';
import type { ToolCall } from './openai';
import type { ExecutionResult } from './types/toolTypes';
import { executeCreateShape } from './tools/createShape';
import { executeMoveShape } from './tools/moveShape';
import { executeGetCanvasState } from './tools/queryCanvas';
import { executeDeleteShape } from './tools/deleteShape';
import { executeResizeShape, executeRotateShape } from './tools/transformShape';
import { executeChangeShapeColor, executeChangeShapeStyle } from './tools/styleShape';
import { executeAlignShapes } from './tools/alignShapes';
import { executeChangeLayer } from './tools/layerShape';
import { generateSuccessMessage, sleep } from './utils/messageGenerator';

// ============================================================================
// Main Execution Function
// ============================================================================

/**
 * Execute all tool calls from AI response
 */
export async function executeToolCalls(
  toolCalls: ToolCall[],
  canvasContext: CanvasContextType,
  _currentUser: User,
  shapes: Shape[]
): Promise<ExecutionResult> {
  const debugLog: string[] = [];
  const errors: string[] = [];
  const createdShapeIds: string[] = [];
  const createdShapeNames: string[] = [];
  
  if (toolCalls.length === 0) {
    return {
      success: false,
      message: 'No actions to execute',
      debugLog: ['[Executor] No tool calls provided'],
      createdShapeIds: [],
      createdShapeNames: [],
      errors: ['No tool calls to execute'],
    };
  }

  debugLog.push(`[Executor] Executing ${toolCalls.length} tool call(s)`);

  // Determine execution strategy
  const shouldExecuteSequentially = toolCalls.length >= 4;
  const delay = toolCalls.length >= 11 ? 50 : 100;

  let successCount = 0;
  const initialShapeCount = canvasContext.shapes.length;

  for (let i = 0; i < toolCalls.length; i++) {
    const toolCall = toolCalls[i];
    
    try {
      const params = JSON.parse(toolCall.function.arguments);
      debugLog.push(`[Tool ${i + 1}/${toolCalls.length}] ${toolCall.function.name}(${JSON.stringify(params)})`);

      switch (toolCall.function.name) {
        case 'createShape': {
          const result = await executeCreateShape(params, canvasContext, shapes, debugLog);
          if (result.shapeId) {
            createdShapeIds.push(result.shapeId);
            successCount++;
          } else if (result.error) {
            errors.push(result.error);
          }
          break;
        }

        case 'moveShape': {
          const result = await executeMoveShape(params, canvasContext, shapes, debugLog);
          if (result.success) {
            successCount++;
          } else if (result.error) {
            errors.push(result.error);
          }
          break;
        }

        case 'getCanvasState': {
          const result = executeGetCanvasState(params, shapes, debugLog);
          debugLog.push(result.message);
          // Store the query result to be included in the final message
          errors.push(`[Query Result] ${result.message}`);
          successCount++;
          break;
        }

        case 'deleteShape': {
          const result = await executeDeleteShape(params, canvasContext, shapes, debugLog);
          if (result.success) {
            successCount++;
          } else if (result.error) {
            errors.push(result.error);
          }
          break;
        }

        case 'resizeShape': {
          const result = await executeResizeShape(params, canvasContext, shapes, debugLog);
          if (result.success) {
            successCount++;
          } else if (result.error) {
            errors.push(result.error);
          }
          break;
        }

        case 'rotateShape': {
          const result = await executeRotateShape(params, canvasContext, shapes, debugLog);
          if (result.success) {
            successCount++;
          } else if (result.error) {
            errors.push(result.error);
          }
          break;
        }

        case 'changeShapeColor': {
          const result = await executeChangeShapeColor(params, canvasContext, shapes, debugLog);
          if (result.success) {
            successCount++;
          } else if (result.error) {
            errors.push(result.error);
          }
          break;
        }

        case 'alignShapes': {
          const result = await executeAlignShapes(params, canvasContext, shapes, debugLog);
          if (result.success) {
            successCount++;
          } else if (result.error) {
            errors.push(result.error);
          }
          break;
        }

        case 'changeLayer': {
          const result = await executeChangeLayer(params, canvasContext, shapes, debugLog);
          if (result.success) {
            successCount++;
          } else if (result.error) {
            errors.push(result.error);
          }
          break;
        }

        case 'changeShapeStyle': {
          const result = await executeChangeShapeStyle(params, canvasContext, shapes, debugLog);
          if (result.success) {
            successCount++;
          } else if (result.error) {
            errors.push(result.error);
          }
          break;
        }

        default:
          debugLog.push(`[Warning] Unknown tool: ${toolCall.function.name}`);
          errors.push(`Unknown tool: ${toolCall.function.name}`);
      }

      // Add delay for sequential execution
      if (shouldExecuteSequentially && i < toolCalls.length - 1) {
        await sleep(delay);
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      debugLog.push(`[Error] ${errorMsg}`);
      errors.push(errorMsg);
    }
  }

  // If we created shapes, wait for Firestore to sync and get their actual names
  if (createdShapeIds.length > 0) {
    debugLog.push(`[Executor] Waiting for Firestore to sync ${createdShapeIds.length} new shape(s)...`);
    
    // Retry logic: Try up to 3 times with increasing delays
    let newShapeCount = 0;
    for (let attempt = 0; attempt < 3; attempt++) {
      const waitTime = 500 + (attempt * 300); // 500ms, 800ms, 1100ms
      await sleep(waitTime);
      
      const currentShapes = canvasContext.shapes;
      newShapeCount = currentShapes.length - initialShapeCount;
      
      if (newShapeCount >= createdShapeIds.length) {
        // Got all shapes!
        debugLog.push(`[Executor] Shapes synced after ${attempt + 1} attempt(s)`);
        break;
      }
      
      if (attempt < 2) {
        debugLog.push(`[Executor] Attempt ${attempt + 1}: Found ${newShapeCount}/${createdShapeIds.length} shapes, retrying...`);
      }
    }
    
    // Get the newly created shapes (they'll have the highest zIndexes)
    const currentShapes = canvasContext.shapes;
    newShapeCount = currentShapes.length - initialShapeCount;
    
    if (newShapeCount > 0) {
      // Sort by zIndex descending and take the newest shapes
      const newestShapes = [...currentShapes]
        .sort((a, b) => b.zIndex - a.zIndex)
        .slice(0, Math.min(newShapeCount, createdShapeIds.length));
      
      // Reverse to get them in creation order
      newestShapes.reverse();
      
      // Extract names
      newestShapes.forEach(shape => {
        createdShapeNames.push(shape.name);
      });
      
      debugLog.push(`[Executor] Retrieved ${createdShapeNames.length} shape names: ${createdShapeNames.join(', ')}`);
      
      if (createdShapeNames.length < createdShapeIds.length) {
        debugLog.push(`[Executor] Warning: Only ${createdShapeNames.length}/${createdShapeIds.length} shapes synced`);
      }
    } else {
      debugLog.push(`[Executor] Warning: Shapes not synced after retries. AI may not know the new shape names.`);
    }
  }

  // Generate user-friendly success message
  const message = generateSuccessMessage(toolCalls, successCount, errors);

  // Extract query results from errors array (they were marked with [Query Result])
  const queryResults = errors.filter(e => e.startsWith('[Query Result]')).map(e => e.replace('[Query Result] ', ''));
  const actualErrors = errors.filter(e => !e.startsWith('[Query Result]'));

  return {
    success: successCount > 0,
    message: queryResults.length > 0 ? queryResults.join('\n') : message,
    debugLog,
    createdShapeIds,
    createdShapeNames,
    errors: actualErrors,
  };
}
