import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../lib/authService';
import { StorageService } from '../services/storage';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Verificando link de login...');

  useEffect(() => {
    const confirm = async () => {
      try {
        const firebaseUser = await AuthService.confirmMagicLogin();
        if (firebaseUser && firebaseUser.email) {
            // Ensure local user exists/is synced
            await StorageService.syncFirebaseUser(firebaseUser.email);
            setStatus('Login confirmado! Redirecionando...');
            setTimeout(() => {
                navigate('/');
            }, 1000);
        } else {
            setStatus('Erro: Link inválido ou expirado.');
            setTimeout(() => navigate('/login'), 2000);
        }
      } catch (error) {
        console.error(error);
        setStatus('Erro na autenticação.');
        setTimeout(() => navigate('/login'), 2000);
      }
    };
    confirm();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
      <h2 className="text-lg font-semibold text-slate-800">{status}</h2>
    </div>
  );
};
