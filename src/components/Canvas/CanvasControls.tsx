/**
 * Canvas Controls Component
 * Provides UI controls for zoom in, zoom out, and reset view
 */

import { MIN_ZOOM, MAX_ZOOM } from '../../utils/constants';

interface CanvasControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  currentZoom: number;
}

export function CanvasControls({
  onZoomIn,
  onZoomOut,
  onResetView,
  currentZoom,
}: CanvasControlsProps) {
  const isZoomInDisabled = currentZoom >= MAX_ZOOM;
  const isZoomOutDisabled = currentZoom <= MIN_ZOOM;

  return (
    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-2 flex flex-col gap-2 z-10">
      {/* Zoom In Button */}
      <button
        onClick={onZoomIn}
        disabled={isZoomInDisabled}
        className="w-10 h-10 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Zoom In"
      >
        <svg
          className="w-5 h-5 text-gray-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>

      {/* Zoom Out Button */}
      <button
        onClick={onZoomOut}
        disabled={isZoomOutDisabled}
        className="w-10 h-10 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Zoom Out"
      >
        <svg
          className="w-5 h-5 text-gray-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 12H4"
          />
        </svg>
      </button>

      {/* Divider */}
      <div className="border-t border-gray-200"></div>

      {/* Reset View Button */}
      <button
        onClick={onResetView}
        className="w-10 h-10 flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
        title="Reset View"
      >
        <svg
          className="w-5 h-5 text-gray-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </button>

      {/* Zoom Percentage Display */}
      <div className="text-xs text-center text-gray-600 font-medium mt-1">
        {(currentZoom * 100).toFixed(0)}%
      </div>
    </div>
  );
}

