import { initializeApp, getApps, getApp, FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// IMPORTANT: Replace with your own Firebase configuration values.
// These are placeholder values and will not work.
// For production, use environment variables to store your Firebase config.
const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyBEOTbJGZasNNBUSldkYLqAMQ5hWKm2ORE",
  authDomain: "fixit-5cb48.firebaseapp.com",
  projectId: "fixit-5cb48",
  storageBucket: "fixit-5cb48.appspot.com",
  messagingSenderId: "698646198537",
  appId: "1:698646198537:web:4ba4d09afc33979fe87bd8"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
