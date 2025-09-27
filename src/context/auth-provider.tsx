
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
    try {
      const userDocRef = doc(db, "users", userToFetch.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        setProfile(userDoc.data() as UserProfile);
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      setProfile(null);
    } finally {
      setLoading(false);
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
      setLoading(false);
    }
  }, [fetchUserProfile]);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (userState) => {
      setLoading(true);
      setUser(userState);
      if (userState) {
        fetchUserProfile(userState);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [fetchUserProfile]);


  const value = { user, profile, loading, refreshAuth, setAuth };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}
