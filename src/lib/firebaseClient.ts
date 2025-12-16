// src/lib/firebaseClient.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCTROUrI_zfmYuYVfFEmvx4hz4HaFgghYE",
  authDomain: "login-email-link.firebaseapp.com",
  projectId: "login-email-link",
  storageBucket: "login-email-link.firebasestorage.app",
  messagingSenderId: "1038649382740",
  appId: "1:1038649382740:web:bebb00b343ae4a2822dac1",
  measurementId: "G-ZN3LQTFNXF"
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);

// ADICIONE/EXPORTE o Firestore
export const db = getFirestore(firebaseApp);




