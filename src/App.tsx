/**
 * Main App Component
 * Handles authentication routing and app layout
 */

import { AuthProvider, useAuth } from './contexts/AuthContext';
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
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
          <main className="flex-1 bg-gray-50 overflow-hidden">
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
      <AppContent />
    </AuthProvider>
  );
}

export default App;
