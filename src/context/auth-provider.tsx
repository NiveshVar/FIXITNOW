
"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback } from "react";
import { onAuthStateChanged, User, getRedirectResult } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { UserProfile } from "@/lib/types";
import { findOrCreateUser } from "@/app/actions";

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

  const fetchUserProfile = useCallback(async (user: User | null) => {
    if (user) {
      if (user.phoneNumber && !user.email) {
        await findOrCreateUser(user.uid, user.phoneNumber);
      }
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        setProfile(userDoc.data() as UserProfile);
      } else {
        setProfile(null);
      }
    } else {
      setProfile(null);
    }
  }, []);

  const setAuth = useCallback((user: User | null, profile: UserProfile | null) => {
    setUser(user);
    setProfile(profile);
    setLoading(false);
  }, []);


  const handleAuthState = useCallback(async (user: User | null) => {
    setUser(user);
    await fetchUserProfile(user);
    setLoading(false);
  }, [fetchUserProfile]);


  const refreshAuth = useCallback(async () => {
    setLoading(true);
    const currentUser = auth.currentUser;
    setUser(currentUser);
    await fetchUserProfile(currentUser);
    setLoading(false);
  }, [fetchUserProfile]);


  useEffect(() => {
    const handleAuthRedirect = async () => {
      setLoading(true);
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const user = result.user;
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
          if (!userDoc.exists()) {
            await setDoc(userDocRef, {
              uid: user.uid,
              name: user.displayName,
              email: user.email,
              role: "user",
            });
          }
        }
      } catch (error) {
        console.error("Auth redirect result error:", error);
      }
      setLoading(false);
    };

    handleAuthRedirect();

    const unsubscribe = onAuthStateChanged(auth, handleAuthState);

    return () => unsubscribe();
  }, [handleAuthState]);

  const value = { user, profile, loading, refreshAuth, setAuth };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}
