/**
 * Settings Panel Component
 * Panel for theme customization (light/dark mode and color picker)
 */

import { useTheme } from '../../contexts/ThemeContext';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { mode, colors, toggleMode, updateColors, resetColors, saveToFirebase } = useTheme();
  const { currentUser } = useAuth();
  const [tempColors, setTempColors] = useState(colors);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Sync tempColors with actual colors when they change (e.g., after reset or theme switch)
  useEffect(() => {
    setTempColors(colors);
  }, [colors]);

  // Clear save status after 3 seconds
  useEffect(() => {
    if (saveStatus !== 'idle') {
      const timer = setTimeout(() => setSaveStatus('idle'), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  if (!isOpen) return null;

  const handleColorChange = (key: keyof typeof colors, value: string) => {
    const newColors = { ...tempColors, [key]: value };
    setTempColors(newColors);
    // Live preview - apply immediately to see changes
    updateColors(newColors);
  };

  const handleApplyColors = async () => {
    if (!currentUser) {
      // If not logged in, just apply locally
      updateColors(tempColors);
      setSaveStatus('success');
      return;
    }

    setIsSaving(true);
    setSaveStatus('idle');
    
    try {
      // Save to Firebase
      await saveToFirebase();
      setSaveStatus('success');
    } catch (error) {
      console.error('Failed to save theme:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetColors = async () => {
    resetColors();
    setTempColors(colors);
    
    // Save to Firebase after reset
    if (currentUser) {
      try {
        await saveToFirebase();
      } catch (error) {
        console.error('Failed to save reset colors:', error);
      }
    }
  };

  const handleToggleMode = async () => {
    toggleMode();
    
    // Save to Firebase after mode change
    if (currentUser) {
      // Wait a tick for the mode state to update
      setTimeout(async () => {
        try {
          await saveToFirebase();
        } catch (error) {
          console.error('Failed to save theme mode:', error);
        }
      }, 0);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Settings Panel */}
      <div 
        className="fixed right-0 top-0 h-full w-96 bg-theme-surface border-l border-theme shadow-2xl z-50 overflow-y-auto animate-slide-in-right"
      >
        {/* Header */}
        <div className="sticky top-0 bg-theme-surface border-b border-theme px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-theme-primary">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-theme-surface-hover rounded-lg transition-colors"
            aria-label="Close settings"
          >
            <svg className="w-5 h-5 text-theme-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Theme Mode Section */}
          <div>
            <h3 className="text-sm font-semibold text-theme-primary uppercase tracking-wider mb-4">
              Theme Mode
            </h3>
            <div className="flex gap-3">
              <button
                onClick={() => mode === 'dark' && handleToggleMode()}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                  mode === 'light'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-theme bg-theme-surface hover:bg-theme-surface-hover'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-theme-primary">Light</span>
                </div>
              </button>
              <button
                onClick={() => mode === 'light' && handleToggleMode()}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                  mode === 'dark'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-theme bg-theme-surface hover:bg-theme-surface-hover'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <svg className="w-6 h-6 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                  <span className="text-sm font-medium text-theme-primary">Dark</span>
                </div>
              </button>
            </div>
          </div>

          {/* Color Customization Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-theme-primary uppercase tracking-wider">
                Custom Colors ({mode === 'light' ? 'Light' : 'Dark'} Mode)
              </h3>
              <button
                onClick={handleResetColors}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Reset
              </button>
            </div>

            <div className="space-y-4">
              {/* Primary Color */}
              <div>
                <label className="block text-sm font-medium text-theme-primary mb-2">
                  Primary Color
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={tempColors.primary}
                    onChange={(e) => handleColorChange('primary', e.target.value)}
                    className="h-10 w-16 rounded border-2 border-theme cursor-pointer"
                  />
                  <input
                    type="text"
                    value={tempColors.primary}
                    onChange={(e) => handleColorChange('primary', e.target.value)}
                    className="flex-1 px-3 py-2 border border-theme rounded-lg bg-theme-surface text-theme-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Accent Color */}
              <div>
                <label className="block text-sm font-medium text-theme-primary mb-2">
                  Accent Color
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={tempColors.accent}
                    onChange={(e) => handleColorChange('accent', e.target.value)}
                    className="h-10 w-16 rounded border-2 border-theme cursor-pointer"
                  />
                  <input
                    type="text"
                    value={tempColors.accent}
                    onChange={(e) => handleColorChange('accent', e.target.value)}
                    className="flex-1 px-3 py-2 border border-theme rounded-lg bg-theme-surface text-theme-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Background Color */}
              <div>
                <label className="block text-sm font-medium text-theme-primary mb-2">
                  Background Color
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={tempColors.background}
                    onChange={(e) => handleColorChange('background', e.target.value)}
                    className="h-10 w-16 rounded border-2 border-theme cursor-pointer"
                  />
                  <input
                    type="text"
                    value={tempColors.background}
                    onChange={(e) => handleColorChange('background', e.target.value)}
                    className="flex-1 px-3 py-2 border border-theme rounded-lg bg-theme-surface text-theme-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Surface Color */}
              <div>
                <label className="block text-sm font-medium text-theme-primary mb-2">
                  Surface Color
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={tempColors.surface}
                    onChange={(e) => handleColorChange('surface', e.target.value)}
                    className="h-10 w-16 rounded border-2 border-theme cursor-pointer"
                  />
                  <input
                    type="text"
                    value={tempColors.surface}
                    onChange={(e) => handleColorChange('surface', e.target.value)}
                    className="flex-1 px-3 py-2 border border-theme rounded-lg bg-theme-surface text-theme-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Text Color */}
              <div>
                <label className="block text-sm font-medium text-theme-primary mb-2">
                  Text Color
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={tempColors.text}
                    onChange={(e) => handleColorChange('text', e.target.value)}
                    className="h-10 w-16 rounded border-2 border-theme cursor-pointer"
                  />
                  <input
                    type="text"
                    value={tempColors.text}
                    onChange={(e) => handleColorChange('text', e.target.value)}
                    className="flex-1 px-3 py-2 border border-theme rounded-lg bg-theme-surface text-theme-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Border Color */}
              <div>
                <label className="block text-sm font-medium text-theme-primary mb-2">
                  Border Color
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={tempColors.border}
                    onChange={(e) => handleColorChange('border', e.target.value)}
                    className="h-10 w-16 rounded border-2 border-theme cursor-pointer"
                  />
                  <input
                    type="text"
                    value={tempColors.border}
                    onChange={(e) => handleColorChange('border', e.target.value)}
                    className="flex-1 px-3 py-2 border border-theme rounded-lg bg-theme-surface text-theme-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Apply Button */}
            <div className="mt-6 space-y-2">
              <button
                onClick={handleApplyColors}
                disabled={isSaving}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  currentUser ? 'Save to Cloud' : 'Apply Locally'
                )}
              </button>
              
              {/* Save Status Message */}
              {saveStatus === 'success' && (
                <div className="text-sm text-green-600 dark:text-green-400 text-center flex items-center justify-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {currentUser ? 'Saved to cloud!' : 'Applied locally!'}
                </div>
              )}
              
              {saveStatus === 'error' && (
                <div className="text-sm text-red-600 dark:text-red-400 text-center flex items-center justify-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  Failed to save. Try again.
                </div>
              )}
              
              {!currentUser && (
                <p className="text-xs text-theme-secondary text-center">
                  Login to save settings across devices
                </p>
              )}
            </div>
          </div>

          {/* Preview Section */}
          <div>
            <h3 className="text-sm font-semibold text-theme-primary uppercase tracking-wider mb-4">
              Preview
            </h3>
            <div className="border-2 border-theme rounded-lg p-4 space-y-3">
              <div className="flex gap-2">
                <div className="px-4 py-2 bg-theme-primary text-white rounded-lg text-sm font-medium">
                  Primary Button
                </div>
                <div className="px-4 py-2 bg-theme-accent text-white rounded-lg text-sm font-medium">
                  Accent Button
                </div>
              </div>
              <div className="p-3 bg-theme-background rounded-lg">
                <p className="text-theme-primary text-sm font-medium">Background Area</p>
                <p className="text-theme-secondary text-xs">Secondary text</p>
              </div>
              <div className="p-3 bg-theme-surface border border-theme rounded-lg">
                <p className="text-theme-primary text-sm">Surface with border</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </>
  );
}

