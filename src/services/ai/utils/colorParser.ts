/**
 * Color Parser Utilities
 * Converts color names to hex codes
 */

// ============================================================================
// Color Name to Hex Mapping
// ============================================================================

export const COLOR_MAP: Record<string, string> = {
  'red': '#EF4444',
  'blue': '#3B82F6',
  'green': '#10B981',
  'yellow': '#FBBF24',
  'purple': '#A855F7',
  'orange': '#F97316',
  'pink': '#EC4899',
  'gray': '#6B7280',
  'grey': '#6B7280',
  'black': '#000000',
  'white': '#FFFFFF',
  'cyan': '#06B6D4',
  'lime': '#84CC16',
  'indigo': '#6366F1',
  'teal': '#14B8A6',
  'amber': '#F59E0B',
};

const DEFAULT_COLOR = '#94A3B8'; // slate-400

/**
 * Parse color name or hex code
 * @param color - Color name (e.g., 'red') or hex code (e.g., '#FF0000')
 * @returns Hex color code
 */
export function parseColor(color?: string): string {
  if (!color) return DEFAULT_COLOR;
  
  const normalized = color.toLowerCase().trim();
  
  // Check if it's a known color name
  if (COLOR_MAP[normalized]) {
    return COLOR_MAP[normalized];
  }
  
  // Check if it's already a hex code
  if (/^#[0-9A-F]{6}$/i.test(color)) {
    return color;
  }
  
  return DEFAULT_COLOR;
}

