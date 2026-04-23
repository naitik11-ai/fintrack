import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../lib/firebase';
import { createOrUpdateUserProfile, getUserProfile } from '../lib/firestore';
import { UserProfile } from '../types';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  configError: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState(!isFirebaseConfigured);

  async function refreshProfile() {
    if (user) {
      const p = await getUserProfile(user.uid);
      setProfile(p);
    }
  }

  useEffect(() => {
    // If Firebase is not configured, stop loading immediately
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    // Safety timeout — if Firebase never calls back within 8 s, unblock the UI
    const timeout = setTimeout(() => {
      setLoading(false);
      setConfigError(true);
    }, 8000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(timeout);
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          await createOrUpdateUserProfile({
            uid:         firebaseUser.uid,
            displayName: firebaseUser.displayName,
            email:       firebaseUser.email,
            photoURL:    firebaseUser.photoURL,
          });
          const p = await getUserProfile(firebaseUser.uid);
          setProfile(p);
        } catch (err) {
          console.error('Profile sync failed:', err);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    }, (err) => {
      // onAuthStateChanged error callback (e.g. bad API key)
      clearTimeout(timeout);
      console.error('Firebase auth error:', err);
      setLoading(false);
      setConfigError(true);
    });

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  async function signInWithGoogle() {
    if (!isFirebaseConfigured) {
      toast.error('Firebase is not configured. Please add your credentials first.');
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Welcome to FinTrack! 🎉');
    } catch (err: any) {
      console.error('Sign-in error:', err);
      const code: string = err?.code ?? '';
      if (code === 'auth/popup-blocked') {
        toast.error('Popup was blocked. Please allow popups for this site and try again.');
      } else if (code === 'auth/popup-closed-by-user') {
        toast.error('Sign-in cancelled.');
      } else if (code === 'auth/unauthorized-domain') {
        toast.error('This domain is not authorised in Firebase. Add localhost to Authorised Domains in your Firebase Console.');
      } else if (code === 'auth/invalid-api-key') {
        toast.error('Invalid Firebase API key. Please check your credentials.');
        setConfigError(true);
      } else {
        toast.error(`Sign in failed: ${err?.message ?? 'Unknown error'}`);
      }
    }
  }

  async function logout() {
    try {
      await signOut(auth);
      toast.success('Signed out successfully.');
    } catch {
      toast.error('Sign out failed.');
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, configError, signInWithGoogle, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
