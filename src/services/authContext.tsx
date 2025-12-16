import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { StorageService } from './storage';
import { 
    loginWithEmail, 
    registerWithEmail, 
    logout as firebaseLogout,
    getUserRoleFromFirestore 
} from '../lib/authService';
import { auth } from '../lib/firebaseClient';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<User | null>; // Retorna User para facilitar redirecionamento
  register: (name: string, email: string, pass: string, role: Role) => Promise<User | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Listener Global de Sessão
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser && firebaseUser.email) {
        // NÃO definimos isLoading=false aqui imediatamente.
        // Precisamos primeiro garantir a Role do Firestore.
        
        try {
          const firestoreData = await getUserRoleFromFirestore(firebaseUser.uid);
          
          if (firestoreData) {
              // Sucesso: Temos Auth + Firestore Data. Sincroniza e Loga.
              const appUser = await StorageService.syncFirebaseUser(
                  firebaseUser.email, 
                  firestoreData.role, 
                  firestoreData.name || firebaseUser.displayName || "", 
                  firestoreData.companyId
              );
              setUser(appUser);
          } else {
              // Caso Raro: Auth existe mas Firestore não (ex: erro na criação ou delete manual)
              // Logamos erro e NÃO logamos o usuário para evitar inconsistência
              console.error("Auth existe, mas documento Firestore não encontrado.");
              setUser(null);
          }
        } catch (err) {
            console.error("Erro no Listener Auth:", err);
            setUser(null);
        }
      } else {
        setUser(null);
        StorageService.logout();
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Login
  const login = async (email: string, pass: string): Promise<User | null> => {
    setIsLoading(true);
    try {
      const fbUser = await loginWithEmail(email, pass);
      
      if (fbUser) {
          // Busca forçada no Firestore para garantir redirecionamento correto imediato
          const firestoreData = await getUserRoleFromFirestore(fbUser.uid);
          
          if (firestoreData) {
             const appUser = await StorageService.syncFirebaseUser(
                  fbUser.email!, 
                  firestoreData.role, 
                  firestoreData.name, 
                  firestoreData.companyId
             );
             setUser(appUser);
             return appUser;
          }
      }
      return null;
    } catch (err) {
      console.error("Login falhou:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Register
  const register = async (name: string, email: string, pass: string, role: Role): Promise<User | null> => {
    setIsLoading(true);
    try {
      // registerWithEmail agora espera a criação do Doc no Firestore
      const result = await registerWithEmail(email, pass, name, role);
      
      // Sincroniza localmente com os dados retornados (garantidos)
      const appUser = await StorageService.syncFirebaseUser(
          email, 
          role, 
          name, 
          result.companyId || undefined
      );
      
      setUser(appUser);
      return appUser;

    } catch (err) {
      console.error("Registro falhou:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await firebaseLogout();
      await StorageService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);