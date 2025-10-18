/**
 * Main App Component
 * Handles authentication routing and app layout
 */

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { CanvasProvider } from './contexts/CanvasContext';
import { PresenceProvider } from './contexts/PresenceContext';
import { Login } from './components/Auth/Login';
import { Navbar } from './components/Layout/Navbar';
import { Canvas } from './components/Canvas/Canvas';
import { useState } from 'react';

function AppContent() {
  const { currentUser, loading } = useAuth();
  const [navigateToUser, setNavigateToUser] = useState<((userId: string) => void) | null>(null);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-theme-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!currentUser) {
    return <Login />;
  }

  // Show main app if authenticated
  return (
    <PresenceProvider>
      <CanvasProvider>
        <div className="h-screen w-screen flex flex-col overflow-hidden">
          <Navbar onNavigateToUser={navigateToUser} />
          <main className="flex-1 bg-theme-background overflow-hidden">
            <Canvas onSetNavigateToUser={(fn) => setNavigateToUser(() => fn)} />
          </main>
        </div>
      </CanvasProvider>
    </PresenceProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
