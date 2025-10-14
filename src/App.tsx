/**
 * Main App Component
 * Handles authentication routing and app layout
 */

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CanvasProvider } from './contexts/CanvasContext';
import { Login } from './components/Auth/Login';
import { Navbar } from './components/Layout/Navbar';
import { Canvas } from './components/Canvas/Canvas';

function AppContent() {
  const { currentUser, loading } = useAuth();

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
    <CanvasProvider>
      <div className="h-screen w-screen flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 bg-gray-50 overflow-hidden">
          <Canvas />
        </main>
      </div>
    </CanvasProvider>
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
