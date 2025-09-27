
"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { UserProfile } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshAuth: () => Promise<void>;
  setAuth: (user: User | null, profile: UserProfile | null) => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  refreshAuth: async () => {},
  setAuth: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const setAuth = useCallback((user: User | null, profile: UserProfile | null) => {
    setUser(user);
    setProfile(profile);
  }, []);

  const fetchUserProfile = useCallback(async (userToFetch: User) => {
      const userDocRef = doc(db, "users", userToFetch.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        setProfile(userDoc.data() as UserProfile);
      } else {
        setProfile(null);
      }
  }, []);

  const refreshAuth = useCallback(async () => {
    setLoading(true);
    const currentUser = auth.currentUser;
    setUser(currentUser);
    if (currentUser) {
      await fetchUserProfile(currentUser);
    } else {
      setProfile(null);
    }
    setLoading(false);
  }, [fetchUserProfile]);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (userState) => {
      if (userState) {
        setUser(userState);
        const userDocRef = doc(db, "users", userState.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setProfile(userDoc.data() as UserProfile);
        } else {
          setProfile(null); // Profile not found
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      // Only set loading to false after all auth-related state is settled.
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);


  const value = { user, profile, loading, refreshAuth, setAuth };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}
