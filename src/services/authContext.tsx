import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { StorageService } from './storage';
import { loginWithEmail, registerWithEmail, logout as firebaseLogout } from '../lib/authService';
import { auth } from '../lib/firebaseClient';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string, role: Role) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Auth State from Storage
  useEffect(() => {
    const stored = StorageService.getCurrentUser();
    if (stored) setUser(stored);
    setIsLoading(false);
  }, []);

  // Listen to Firebase Auth Changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser && firebaseUser.email) {
        // Sync on page reload or background auth change
        const appUser = await StorageService.syncFirebaseUser(firebaseUser.email);
        setUser(appUser);
      } else {
        if (!StorageService.getCurrentUser()) {
          setUser(null);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const fbUser = await loginWithEmail(email, pass);
      if (fbUser && fbUser.email) {
        // Sync without forcing params (user should exist)
        const appUser = await StorageService.syncFirebaseUser(fbUser.email);
        setUser(appUser);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, pass: string, role: Role) => {
    setIsLoading(true);
    try {
      const fbUser = await registerWithEmail(email, pass, name);
      if (fbUser && fbUser.email) {
         // Create local profile with Name and Role
         const appUser = await StorageService.syncFirebaseUser(fbUser.email, role, name);
         setUser(appUser);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await firebaseLogout();
    StorageService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);