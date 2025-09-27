import { initializeApp, getApps, getApp, FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// IMPORTANT: Replace with your own Firebase configuration values.
// These are placeholder values and will not work.
// For production, use environment variables to store your Firebase config.
const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyDFG345345k_9_o1353sdfsdf-gqexxx",
  authDomain: "fir-studio-demos-1.firebaseapp.com",
  projectId: "fir-studio-demos-1",
  storageBucket: "fir-studio-demos-1.appspot.com",
  messagingSenderId: "962534509423",
  appId: "1:962534509423:web:f395a565860ol11b183a6b",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
