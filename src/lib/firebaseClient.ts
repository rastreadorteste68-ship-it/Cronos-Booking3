import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

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

if (typeof window !== "undefined") {
  isSupported().then((yes) => yes && getAnalytics(firebaseApp));
}