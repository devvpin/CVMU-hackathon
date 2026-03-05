import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDJ53fIr5_aWs7LZHMldOgjOTlp86DaZbo",
  authDomain: "expense-tracker-dev94.firebaseapp.com",
  projectId: "expense-tracker-dev94",
  storageBucket: "expense-tracker-dev94.firebasestorage.app",
  messagingSenderId: "58934905684",
  appId: "1:58934905684:web:1145d940e396a2ffe816c1",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);
