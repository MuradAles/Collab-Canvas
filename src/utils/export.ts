/**
 * Export utilities for saving canvas and shapes as PNG/SVG
 */

import Konva from 'konva';
import type { Shape } from '../types';

/**
 * Downloads a data URL as a file
 */
function downloadURI(uri: string, name: string) {
  const link = document.createElement('a');
  link.download = name;
  link.href = uri;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export the entire canvas as PNG
 */
export function exportCanvasAsPNG(stage: Konva.Stage, filename: string = 'canvas.png') {
  try {
    const dataURL = stage.toDataURL({ pixelRatio: 2 }); // 2x for better quality
    downloadURI(dataURL, filename);
  } catch (error) {
    console.error('Failed to export canvas as PNG:', error);
    throw new Error('Failed to export canvas as PNG');
  }
}

/**
 * Export selected shapes as PNG
 * Creates a temporary layer with only the selected shapes
 */
export function exportSelectedShapesAsPNG(
  stage: Konva.Stage,
  selectedShapeIds: string[],
  filename: string = 'shapes.png'
) {
  try {
    if (selectedShapeIds.length === 0) {
      throw new Error('No shapes selected');
    }

    // Find the main layer
    const mainLayer = stage.findOne('.main-layer') as Konva.Layer;
    if (!mainLayer) {
      throw new Error('Main layer not found');
    }

    // Get selected shapes
    const selectedNodes = selectedShapeIds
      .map(id => mainLayer.findOne(`#${id}`))
      .filter(Boolean) as Konva.Node[];

    if (selectedNodes.length === 0) {
      throw new Error('Selected shapes not found on canvas');
    }

    // Calculate bounding box of all selected shapes
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    selectedNodes.forEach(node => {
      const box = node.getClientRect();
      minX = Math.min(minX, box.x);
      minY = Math.min(minY, box.y);
      maxX = Math.max(maxX, box.x + box.width);
      maxY = Math.max(maxY, box.y + box.height);
    });

    const width = maxX - minX;
    const height = maxY - minY;
    const padding = 20; // Add padding around shapes

    // Create temporary stage for export
    const tempStage = new Konva.Stage({
      container: document.createElement('div'),
      width: width + padding * 2,
      height: height + padding * 2,
    });

    const tempLayer = new Konva.Layer();
    tempStage.add(tempLayer);

    // Clone selected shapes and adjust positions
    selectedNodes.forEach(node => {
      const clone = node.clone();
      const pos = node.position();
      clone.position({
        x: pos.x - minX + padding,
        y: pos.y - minY + padding,
      });
      tempLayer.add(clone);
    });

    tempLayer.batchDraw();

    // Export
    const dataURL = tempStage.toDataURL({ pixelRatio: 2 });
    downloadURI(dataURL, filename);

    // Cleanup
    tempStage.destroy();
  } catch (error) {
    console.error('Failed to export selected shapes as PNG:', error);
    throw error;
  }
}

/**
 * Export canvas as SVG
 * Note: This is a simplified SVG export. For full fidelity, consider using a library
 */
export function exportCanvasAsSVG(shapes: Shape[], filename: string = 'canvas.svg') {
  try {
    // Calculate bounding box
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    shapes.forEach(shape => {
      if (shape.type === 'line') {
        minX = Math.min(minX, shape.x1, shape.x2);
        minY = Math.min(minY, shape.y1, shape.y2);
        maxX = Math.max(maxX, shape.x1, shape.x2);
        maxY = Math.max(maxY, shape.y1, shape.y2);
      } else {
        const x = shape.x || 0;
        const y = shape.y || 0;
        let width = 0;
        let height = 0;
        
        if (shape.type === 'circle') {
          width = shape.radius * 2;
          height = shape.radius * 2;
        } else if (shape.type === 'rectangle') {
          width = shape.width;
          height = shape.height;
        } else if (shape.type === 'text') {
          width = shape.width || 0;
          height = shape.fontSize;
        }
        
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + width);
        maxY = Math.max(maxY, y + height);
      }
    });

    const width = maxX - minX || 800;
    const height = maxY - minY || 600;
    const padding = 20;

    // Build SVG
    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width + padding * 2}" height="${height + padding * 2}" viewBox="0 0 ${width + padding * 2} ${height + padding * 2}">
`;

    // Add shapes
    shapes.forEach(shape => {
      const offsetX = padding - minX;
      const offsetY = padding - minY;

      if (shape.type === 'rectangle') {
        const rotation = shape.rotation || 0;
        const transformOrigin = `${shape.x + offsetX + shape.width / 2} ${shape.y + offsetY + shape.height / 2}`;
        svg += `  <rect x="${shape.x + offsetX}" y="${shape.y + offsetY}" width="${shape.width}" height="${shape.height}" 
          rx="${shape.cornerRadius}" ry="${shape.cornerRadius}"
          fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}"
          ${rotation ? `transform="rotate(${rotation} ${transformOrigin})"` : ''}
        />\n`;
      } else if (shape.type === 'circle') {
        const rotation = shape.rotation || 0;
        const cx = shape.x + offsetX + shape.radius;
        const cy = shape.y + offsetY + shape.radius;
        svg += `  <circle cx="${cx}" cy="${cy}" r="${shape.radius}" 
          fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}"
          ${rotation ? `transform="rotate(${rotation} ${cx} ${cy})"` : ''}
        />\n`;
      } else if (shape.type === 'line') {
        svg += `  <line x1="${shape.x1 + offsetX}" y1="${shape.y1 + offsetY}" x2="${shape.x2 + offsetX}" y2="${shape.y2 + offsetY}" 
          stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" stroke-linecap="${shape.lineCap}"
        />\n`;
      } else if (shape.type === 'text') {
        const rotation = shape.rotation || 0;
        const fontStyle = shape.fontStyle || 'normal';
        const fontWeight = fontStyle.includes('bold') ? 'bold' : 'normal';
        const fontStyleAttr = fontStyle.includes('italic') ? 'italic' : 'normal';
        const textDecoration = shape.textDecoration || 'none';
        const transformOrigin = `${shape.x + offsetX + (shape.width || 100) / 2} ${shape.y + offsetY}`;
        
        svg += `  <text x="${shape.x + offsetX}" y="${shape.y + offsetY + shape.fontSize}" 
          font-family="${shape.fontFamily}" font-size="${shape.fontSize}" 
          font-weight="${fontWeight}" font-style="${fontStyleAttr}"
          text-decoration="${textDecoration}"
          fill="${shape.fill}"
          ${rotation ? `transform="rotate(${rotation} ${transformOrigin})"` : ''}
        >${shape.text}</text>\n`;
      }
    });

    svg += `</svg>`;

    // Download
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    downloadURI(url, filename);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export canvas as SVG:', error);
    throw new Error('Failed to export canvas as SVG');
  }
}

/**
 * Export selected shapes as SVG
 */
export function exportSelectedShapesAsSVG(
  allShapes: Shape[],
  selectedShapeIds: string[],
  filename: string = 'shapes.svg'
) {
  if (selectedShapeIds.length === 0) {
    throw new Error('No shapes selected');
  }

  const selectedShapes = allShapes.filter(shape => selectedShapeIds.includes(shape.id));
  exportCanvasAsSVG(selectedShapes, filename);
}

