import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  isSignInWithEmailLink,
  signInWithEmailLink,
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail
} from "firebase/auth";
import { firebaseApp } from "./firebaseClient";

const auth = getAuth(firebaseApp);

export async function loginWithEmail(email: string, password: string) {
  // Strict Login
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function registerWithEmail(email: string, password: string, name: string) {
  // Explicit Registration
  const result = await createUserWithEmailAndPassword(auth, email, password);
  
  // Update Firebase Profile Display Name
  if (result.user) {
    await updateProfile(result.user, { displayName: name });
  }
  
  return result.user;
}

export async function recoverPassword(email: string) {
  await sendPasswordResetEmail(auth, email);
}

export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    const methods = await fetchSignInMethodsForEmail(auth, email);
    return methods.length > 0;
  } catch (error: any) {
    // Newer Firebase instances protect email enumeration and might throw error or return empty
    // But createUserWithEmailAndPassword throws auth/email-already-in-use which we catch in the UI
    return false;
  }
}

export async function confirmMagicLogin() {
  if (isSignInWithEmailLink(auth, window.location.href)) {
    let email = window.localStorage.getItem('emailForSignIn');
    if (!email) {
      email = window.prompt('Por favor, confirme seu email para continuar:');
    }
    if (email) {
      const result = await signInWithEmailLink(auth, email, window.location.href);
      window.localStorage.removeItem('emailForSignIn');
      return result.user;
    }
  }
  return null;
}

export function logout() {
  return auth.signOut();
}

export const AuthService = {
  loginWithEmail,
  registerWithEmail,
  recoverPassword,
  checkEmailExists,
  confirmMagicLogin,
  logout
};