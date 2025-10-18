/**
 * Theme Context
 * Provides theme state (light/dark mode and custom colors) to the entire application
 */

import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { ReactNode } from 'react';
import { ref, set, get } from 'firebase/database';
import { rtdb } from '../services/firebase';
import { useAuth } from './AuthContext';

// ============================================================================
// Types
// ============================================================================

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  primary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
}

export interface ThemeContextType {
  mode: ThemeMode;
  colors: ThemeColors;
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
  updateColors: (colors: Partial<ThemeColors>) => void;
  resetColors: () => void;
}

// ============================================================================
// Default Theme Colors
// ============================================================================

const DEFAULT_LIGHT_COLORS: ThemeColors = {
  primary: '#2563eb', // blue-600
  accent: '#8b5cf6', // purple-600
  background: '#f9fafb', // gray-50
  surface: '#ffffff', // white
  text: '#111827', // gray-900
  textSecondary: '#6b7280', // gray-500
  border: '#e5e7eb', // gray-200
};

const DEFAULT_DARK_COLORS: ThemeColors = {
  primary: '#3b82f6', // blue-500
  accent: '#a78bfa', // purple-400
  background: '#111827', // gray-900
  surface: '#1f2937', // gray-800
  text: '#f9fafb', // gray-50
  textSecondary: '#9ca3af', // gray-400
  border: '#374151', // gray-700
};

// ============================================================================
// Context Creation
// ============================================================================

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ============================================================================
// Theme Provider Component
// ============================================================================

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { currentUser } = useAuth();
  
  // Initialize state from localStorage immediately using lazy initialization
  // The function is only called once during initial render, not on every render
  const [mode, setModeState] = useState<ThemeMode>(() => {
    try {
      const savedMode = localStorage.getItem('theme-mode') as ThemeMode;
      return savedMode || 'light';
    } catch {
      return 'light';
    }
  });
  
  const [lightColors, setLightColors] = useState<ThemeColors>(() => {
    try {
      const savedLightColors = localStorage.getItem('theme-light-colors');
      return savedLightColors ? JSON.parse(savedLightColors) : DEFAULT_LIGHT_COLORS;
    } catch {
      return DEFAULT_LIGHT_COLORS;
    }
  });
  
  const [darkColors, setDarkColors] = useState<ThemeColors>(() => {
    try {
      const savedDarkColors = localStorage.getItem('theme-dark-colors');
      return savedDarkColors ? JSON.parse(savedDarkColors) : DEFAULT_DARK_COLORS;
    } catch {
      return DEFAULT_DARK_COLORS;
    }
  });

  // Get current theme colors based on mode
  const colors = mode === 'light' ? lightColors : darkColors;

  // ============================================================================
  // Theme Functions
  // ============================================================================

  /**
   * Toggle between light and dark mode
   */
  const toggleMode = useCallback(() => {
    setModeState(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  /**
   * Set theme mode
   */
  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
  }, []);

  /**
   * Update theme colors
   */
  const updateColors = useCallback((newColors: Partial<ThemeColors>) => {
    if (mode === 'light') {
      setLightColors(prev => ({ ...prev, ...newColors }));
    } else {
      setDarkColors(prev => ({ ...prev, ...newColors }));
    }
  }, [mode]);

  /**
   * Reset colors to default
   */
  const resetColors = useCallback(() => {
    if (mode === 'light') {
      setLightColors(DEFAULT_LIGHT_COLORS);
    } else {
      setDarkColors(DEFAULT_DARK_COLORS);
    }
  }, [mode]);

  // ============================================================================
  // Persistence: Load from Firebase when user logs in
  // ============================================================================

  useEffect(() => {
    if (!currentUser) return;

    const loadUserTheme = async () => {
      try {
        const themeRef = ref(rtdb, `users/${currentUser.uid}/theme`);
        const snapshot = await get(themeRef);
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          if (data.mode) setModeState(data.mode);
          if (data.lightColors) setLightColors(data.lightColors);
          if (data.darkColors) setDarkColors(data.darkColors);
        }
      } catch (error) {
        console.error('Failed to load theme from Firebase:', error);
      }
    };

    loadUserTheme();
  }, [currentUser]);

  // ============================================================================
  // Persistence: Save to localStorage and Firebase when theme changes
  // ============================================================================

  useEffect(() => {
    // Save to localStorage
    try {
      localStorage.setItem('theme-mode', mode);
      localStorage.setItem('theme-light-colors', JSON.stringify(lightColors));
      localStorage.setItem('theme-dark-colors', JSON.stringify(darkColors));
    } catch (error) {
      console.error('Failed to save theme to localStorage:', error);
    }

    // Save to Firebase if user is logged in
    if (currentUser) {
      try {
        const themeRef = ref(rtdb, `users/${currentUser.uid}/theme`);
        set(themeRef, {
          mode,
          lightColors,
          darkColors,
        });
      } catch (error) {
        console.error('Failed to save theme to Firebase:', error);
      }
    }
  }, [mode, lightColors, darkColors, currentUser]);

  // ============================================================================
  // Apply CSS Variables to Document Root
  // ============================================================================

  useEffect(() => {
    const root = document.documentElement;
    
    // Helper to convert hex to RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result 
        ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
        : '0, 0, 0';
    };
    
    // Set theme mode
    root.setAttribute('data-theme', mode);
    
    // Set CSS variables
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-accent', colors.accent);
    root.style.setProperty('--color-accent-rgb', hexToRgb(colors.accent));
    root.style.setProperty('--color-background', colors.background);
    root.style.setProperty('--color-surface', colors.surface);
    root.style.setProperty('--color-text', colors.text);
    root.style.setProperty('--color-text-secondary', colors.textSecondary);
    root.style.setProperty('--color-border', colors.border);

    // Also set background color on body
    document.body.style.backgroundColor = colors.background;
  }, [mode, colors]);

  // ============================================================================
  // Context Value
  // ============================================================================

  const value: ThemeContextType = useMemo(() => ({
    mode,
    colors,
    toggleMode,
    setMode,
    updateColors,
    resetColors,
  }), [mode, colors, toggleMode, setMode, updateColors, resetColors]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// ============================================================================
// Custom Hook
// ============================================================================

/**
 * Custom hook to use theme context
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

