
'use client';

import type { ReactNode, Dispatch, SetStateAction } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { type User, onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut, type FirebaseError } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  setUser: Dispatch<SetStateAction<User | null>>; // Allow manual user setting if needed
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    }, (error) => {
      console.error('Auth state change error:', error);
      setLoading(false);
      toast({
        title: 'Authentication Error',
        description: 'There was an issue with verifying your session. Please try refreshing the page.',
        variant: 'destructive',
      });
    });
    return () => unsubscribe();
  }, [toast]);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      if (!auth.app) { // Check if Firebase app was initialized
        console.error("Firebase app is not initialized. Cannot sign in.");
        toast({
          title: 'Configuration Error',
          description: 'Firebase is not configured correctly. Please contact support or check environment variables.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }
      await signInWithPopup(auth, googleProvider);
      toast({
        title: 'Signed In',
        description: 'Successfully signed in with Google.',
      });
    } catch (error) {
      const firebaseError = error as FirebaseError;
      console.error('Error signing in with Google:', firebaseError.code, firebaseError.message, firebaseError);
      toast({
        title: 'Sign In Failed',
        description: `Could not sign in with Google. ${firebaseError.message || 'Please try again or check your connection.'} (Code: ${firebaseError.code})`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      if (!auth.app) { // Check if Firebase app was initialized
        console.error("Firebase app is not initialized. Cannot sign out.");
        // Optionally, still clear local user state if desired
        // setUser(null); 
        setLoading(false);
        return;
      }
      await firebaseSignOut(auth);
      toast({
        title: 'Signed Out',
        description: 'Successfully signed out.',
      });
    } catch (error) {
      const firebaseError = error as FirebaseError;
      console.error('Error signing out:', firebaseError.code, firebaseError.message, firebaseError);
      toast({
        title: 'Sign Out Failed',
        description: `Could not sign out. ${firebaseError.message || 'Please try again.'} (Code: ${firebaseError.code})`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
