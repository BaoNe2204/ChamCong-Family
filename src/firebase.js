import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyAIdotoUqbUODGg4t3iJWXiv9mXETKmmzM",
  authDomain: "chamcongfamily.firebaseapp.com",
  projectId: "chamcongfamily",
  storageBucket: "chamcongfamily.firebasestorage.app",
  messagingSenderId: "308243907411",
  appId: "1:308243907411:web:31ed63a29e745b842317a6",
  measurementId: "G-XXJHFE0T5K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
