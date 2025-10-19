/**
 * Message Generator
 * Generates user-friendly success messages for tool execution
 */

import type { ToolCall } from '../openai';

/**
 * Generate user-friendly success message
 */
export function generateSuccessMessage(
  toolCalls: ToolCall[],
  successCount: number,
  errors: string[]
): string {
  if (successCount === 0) {
    return errors.length > 0 
      ? `❌ Failed: ${errors[0]}`
      : '❌ No actions completed';
  }

  const createCalls = toolCalls.filter(tc => tc.function.name === 'createShape');
  const createMultipleCalls = toolCalls.filter(tc => tc.function.name === 'createMultipleShapes');
  const moveCalls = toolCalls.filter(tc => tc.function.name === 'moveShape');
  const queryCalls = toolCalls.filter(tc => tc.function.name === 'getCanvasState');
  const deleteCalls = toolCalls.filter(tc => tc.function.name === 'deleteShape');
  const resizeCalls = toolCalls.filter(tc => tc.function.name === 'resizeShape');
  const rotateCalls = toolCalls.filter(tc => tc.function.name === 'rotateShape');
  const colorCalls = toolCalls.filter(tc => tc.function.name === 'changeShapeColor');
  const alignCalls = toolCalls.filter(tc => tc.function.name === 'alignShapes');
  const layerCalls = toolCalls.filter(tc => tc.function.name === 'changeLayer');
  const styleCalls = toolCalls.filter(tc => tc.function.name === 'changeShapeStyle');

  const parts: string[] = [];
  
  if (createCalls.length > 0) {
    parts.push(`Created ${createCalls.length} shape${createCalls.length > 1 ? 's' : ''}`);
  }

  if (createMultipleCalls.length > 0) {
    // Count total shapes created from bulk operations
    const totalBulkShapes = createMultipleCalls.reduce((sum, call) => {
      try {
        const params = JSON.parse(call.function.arguments);
        return sum + (params.count || 0);
      } catch {
        return sum;
      }
    }, 0);
    parts.push(`Bulk created ${totalBulkShapes} shapes`);
  }
  
  if (moveCalls.length > 0) {
    parts.push(`Moved ${moveCalls.length} shape${moveCalls.length > 1 ? 's' : ''}`);
  }
  
  if (deleteCalls.length > 0) {
    // Count actual shapes from parameters
    const totalDeleted = deleteCalls.reduce((sum, call) => {
      try {
        const params = JSON.parse(call.function.arguments);
        return sum + (params.shapeNames?.length || 0);
      } catch {
        return sum + 1;
      }
    }, 0);
    parts.push(`Deleted ${totalDeleted} shape${totalDeleted > 1 ? 's' : ''}`);
  }
  
  if (resizeCalls.length > 0) {
    parts.push(`Resized ${resizeCalls.length} shape${resizeCalls.length > 1 ? 's' : ''}`);
  }
  
  if (rotateCalls.length > 0) {
    parts.push(`Rotated ${rotateCalls.length} shape${rotateCalls.length > 1 ? 's' : ''}`);
  }
  
  if (colorCalls.length > 0) {
    // Count actual shapes from parameters
    const totalRecolored = colorCalls.reduce((sum, call) => {
      try {
        const params = JSON.parse(call.function.arguments);
        return sum + (params.shapeNames?.length || 0);
      } catch {
        return sum + 1;
      }
    }, 0);
    parts.push(`Recolored ${totalRecolored} shape${totalRecolored > 1 ? 's' : ''}`);
  }
  
  if (alignCalls.length > 0) {
    parts.push(`Aligned shapes`);
  }
  
  if (layerCalls.length > 0) {
    parts.push(`Changed layers`);
  }
  
  if (styleCalls.length > 0) {
    // Count actual shapes from parameters
    const totalStyled = styleCalls.reduce((sum, call) => {
      try {
        const params = JSON.parse(call.function.arguments);
        return sum + (params.shapeNames?.length || 0);
      } catch {
        return sum + 1;
      }
    }, 0);
    parts.push(`Styled ${totalStyled} shape${totalStyled > 1 ? 's' : ''}`);
  }
  
  if (queryCalls.length > 0) {
    parts.push(`Queried canvas`);
  }

  let message = `✓ ${parts.join(', ')}`;
  
  if (errors.length > 0) {
    message += ` (${errors.length} error${errors.length > 1 ? 's' : ''})`;
  }

  return message;
}

/**
 * Sleep utility for sequential execution
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

