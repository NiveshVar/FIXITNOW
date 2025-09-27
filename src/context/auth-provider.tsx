"use client";

import React, { createContext, useState, useEffect, ReactNode } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setUser(user);
        // This check is for phone auth, but we'll also handle Google sign in user creation here if needed
        if (user.phoneNumber && !user.email) {
          await findOrCreateUser(user.uid, user.phoneNumber);
        }
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setProfile(userDoc.data() as UserProfile);
        } else {
           // This case can happen if a user signs in with a method (like Google)
           // for the first time, and we created the user doc in the handleGoogleSignIn action.
           // To be safe, we'll fetch it again.
           const freshUserDoc = await getDoc(userDocRef);
           if (freshUserDoc.exists()){
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
  }, []);

  const value = { user, profile, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}
