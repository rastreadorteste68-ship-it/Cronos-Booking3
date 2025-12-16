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

import { firebaseApp, db } from "./firebaseClient";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { Role } from "../types";

const auth = getAuth(firebaseApp);

export async function loginWithEmail(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

/**
 * Cria usuário no Auth E garante a criação do documento no Firestore.
 * Esta função espera a gravação no banco antes de retornar.
 */
export async function registerWithEmail(
  email: string, 
  password: string, 
  name: string, 
  role: Role 
) {
  // 1. Criar Auth User
  const result = await createUserWithEmailAndPassword(auth, email, password);

  if (result.user) {
    try {
      // 2. Atualiza Display Name
      await updateProfile(result.user, { displayName: name });

      // 3. Determina Company ID
      let companyId = null;
      if (role === 'EMPRESA_ADMIN' || role === 'PROFESSIONAL') {
        companyId = Math.random().toString(36).substr(2, 9);
      }

      // 4. Grava no Firestore (FONTE DA VERDADE)
      // Await aqui é crucial para evitar race condition
      await setDoc(doc(db, "users", result.user.uid), {
        uid: result.user.uid,
        name,
        email,
        role, 
        companyId, 
        createdAt: new Date().toISOString()
      });
      
      return { 
        user: result.user, 
        role, 
        companyId 
      };

    } catch (error) {
      console.error("Erro crítico ao criar perfil no Firestore:", error);
      // Opcional: Deletar usuário do Auth se falhar no Firestore para manter consistência
      throw new Error("Falha ao registrar dados do usuário.");
    }
  }

  throw new Error("Falha ao criar usuário.");
}

export async function recoverPassword(email: string) {
  await sendPasswordResetEmail(auth, email);
}

export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    const methods = await fetchSignInMethodsForEmail(auth, email);
    return methods.length > 0;
  } catch {
    return false;
  }
}

export async function confirmMagicLogin() {
  if (isSignInWithEmailLink(auth, window.location.href)) {
    let email = window.localStorage.getItem('emailForSignIn');

    if (!email) {
      email = window.prompt('Confirme seu email para continuar:') || "";
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

/**
 * Busca a role do usuário diretamente no Firestore.
 * Essencial para o processo de Login.
 */
export async function getUserRoleFromFirestore(uid: string): Promise<{ role: Role, companyId?: string, name?: string } | null> {
    try {
        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) {
            const data = snap.data();
            return {
                role: data.role as Role,
                companyId: data.companyId,
                name: data.name
            };
        }
        return null;
    } catch (e) {
        console.error("Erro ao ler Firestore:", e);
        return null;
    }
}

export const AuthService = {
  loginWithEmail,
  registerWithEmail,
  recoverPassword,
  checkEmailExists,
  confirmMagicLogin,
  logout,
  getUserRoleFromFirestore
};