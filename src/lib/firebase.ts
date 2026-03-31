import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Ensure Firestore is imported

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Prevent multiple initializations during development
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// --- AUTHENTICATION EXPORTS ---
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// This line ensures the user is always prompted to select an account
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// --- DATABASE EXPORTS ---
// Added this to connect your Admin Dashboard to the live cloud database
export const db = getFirestore(app);

export default app;