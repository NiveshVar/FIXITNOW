
"use client";

import React, { createContext, useState, useEffect, ReactNode } from "react";
import { onAuthStateChanged, User, getRedirectResult } from "firebase/auth";
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
    // This function runs when the component mounts.
    // It handles the redirect result from Google Sign-In and sets up the listener for auth state changes.

    const handleAuth = async () => {
      setLoading(true);

      try {
        const result = await getRedirectResult(auth);
        if (result) {
          // User just signed in via redirect.
          const user = result.user;
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);

          if (!userDoc.exists()) {
            // Create a new user document if it's their first time.
            await setDoc(userDocRef, {
              uid: user.uid,
              name: user.displayName,
              email: user.email,
              role: "user",
            });
          }
        }
      } catch (error) {
        console.error("Google Sign-in redirect result error:", error);
      }

      // Set up the listener for auth state changes.
      // This will fire right after the redirect is handled, and on subsequent page loads.
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          setUser(user);
          // Handle phone users who might not have an email
           if (user.phoneNumber && !user.email) {
              await findOrCreateUser(user.uid, user.phoneNumber);
            }
          // Fetch the user's profile from Firestore.
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setProfile(userDoc.data() as UserProfile);
          } else {
            // This case might happen if the doc creation was delayed.
            // A re-fetch might be needed in complex scenarios, but for now, null is safe.
            setProfile(null);
          }
        } else {
          // No user is signed in.
          setUser(null);
          setProfile(null);
        }
        setLoading(false); // Set loading to false after all auth checks are done.
      });

      // Cleanup subscription on unmount
      return unsubscribe;
    };

    handleAuth();

  }, []);

  const value = { user, profile, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}
