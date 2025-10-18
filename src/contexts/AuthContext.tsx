/**
 * Authentication Context
 * Provides authentication state and methods to the entire application
 */

import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { auth } from '../services/firebase';
import type { User, AuthContextType } from '../types';
import { getDisplayNameFromEmail, truncateDisplayName } from '../utils/helpers';
import { setUserOffline } from '../services/presence';
import { cleanupUserLocks } from '../services/canvas';

// ============================================================================
// Context Creation
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// Auth Provider Component
// ============================================================================

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ============================================================================
  // Authentication Functions
  // ============================================================================

  /**
   * Sign up with email and password
   */
  const signup = useCallback(async (
    email: string,
    password: string,
    displayName?: string
  ): Promise<void> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Set display name
      const name = displayName || getDisplayNameFromEmail(email);
      const truncatedName = truncateDisplayName(name);

      await updateProfile(userCredential.user, {
        displayName: truncatedName,
      });

      // Update current user state
      setCurrentUser({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: truncatedName,
      });
    } catch (error: any) {
      console.error('Signup error:', error);
      throw new Error(error.message || 'Failed to create account');
    }
  }, []);

  /**
   * Log in with email and password
   */
  const login = useCallback(async (email: string, password: string): Promise<void> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Failed to log in');
    }
  }, []);

  /**
   * Sign in with Google
   */
  const loginWithGoogle = useCallback(async (): Promise<void> => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);

      // Ensure display name is set and truncated
      let displayName = userCredential.user.displayName;
      if (!displayName) {
        displayName = getDisplayNameFromEmail(
          userCredential.user.email || 'user'
        );
      }
      const truncatedName = truncateDisplayName(displayName);

      // Update profile if needed
      if (userCredential.user.displayName !== truncatedName) {
        await updateProfile(userCredential.user, {
          displayName: truncatedName,
        });
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      throw new Error(error.message || 'Failed to sign in with Google');
    }
  }, []);

  /**
   * Log out
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      // Clean up user presence and locks BEFORE signing out
      if (currentUser) {
        // Use Promise.allSettled to ensure we attempt all cleanups even if one fails
        // This prevents one failed cleanup from blocking the others
        await Promise.allSettled([
          setUserOffline(currentUser.uid),
          cleanupUserLocks(currentUser.uid)
        ]);
        
        // Give a small delay to ensure cleanup operations complete
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Now sign out from Firebase
      await signOut(auth);
      setCurrentUser(null);
    } catch (error: any) {
      console.error('Logout error:', error);
      // Even if there's an error, try to sign out
      try {
        await signOut(auth);
        setCurrentUser(null);
      } catch {
        // Ignore secondary errors
      }
      throw new Error(error.message || 'Failed to log out');
    }
  }, [currentUser]);

  // ============================================================================
  // Auth State Listener
  // ============================================================================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        setCurrentUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        });
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  // ============================================================================
  // Context Value
  // ============================================================================

  const value: AuthContextType = useMemo(() => ({
    currentUser,
    loading,
    login,
    signup,
    loginWithGoogle,
    logout,
  }), [currentUser, loading, login, signup, loginWithGoogle, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================================================
// Custom Hook
// ============================================================================

/**
 * Custom hook to use auth context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

