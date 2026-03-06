import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDJ53fIr5_aWs7LZHMldOgjOTlp86DaZbo",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "expense-tracker-dev94.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "expense-tracker-dev94",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "expense-tracker-dev94.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "58934905684",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:58934905684:web:1145d940e396a2ffe816c1",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);
