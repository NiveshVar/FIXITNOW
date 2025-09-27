"use client";

import React, { createContext, useState, useEffect, ReactNode } from "react";
import { onAuthStateChanged, User, getRedirectResult, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { UserProfile } from "@/lib/types";
import { findOrCreateUser } from "@/app/actions";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle the redirect result from Google Sign-In
    getRedirectResult(auth)
      .then(async (result) => {
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
      })
      .catch((error) => {
        console.error("Google Sign-in redirect error:", error);
      })
      .finally(() => {
        // Continue with the regular auth state listener
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          setLoading(true);
          if (user) {
            setUser(user);
            if (user.phoneNumber && !user.email) {
              await findOrCreateUser(user.uid, user.phoneNumber);
            }
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              setProfile(userDoc.data() as UserProfile);
            } else {
              const freshUserDoc = await getDoc(userDocRef);
              if (freshUserDoc.exists()) {
                setProfile(freshUserDoc.data() as UserProfile);
              } else {
                setProfile(null);
              }
            }
          } else {
            setUser(null);
            setProfile(null);
          }
          setLoading(false);
        });
        return () => unsubscribe();
      });
  }, []);

  const value = { user, profile, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}
