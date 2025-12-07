import React, { useState, useEffect } from 'react';
import { useAuth } from '../services/authContext';
import { Button, Input, Card, Modal } from '../components/UI';
import { Command, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthService } from '../lib/authService';

export const Login: React.FC = () => {
  const [searchParams] = useSearchParams();
  const accountType = searchParams.get('type') || 'client'; // Default to client if missing

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // Reset Password State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState('');

  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  // Mapping types to UI text
  const typeConfig: Record<string, { title: string, subtitle: string, color: string }> = {
    client: { title: 'Login Cliente', subtitle: 'Acesse seus agendamentos', color: 'text-blue-600' },
    company: { title: 'Login Empresa', subtitle: 'Gerencie seu negócio', color: 'text-indigo-600' },
    admin: { title: 'Login Administrador', subtitle: 'Gestão do sistema', color: 'text-slate-800' }
  };

  const currentConfig = typeConfig[accountType] || typeConfig['client'];

  // Load Remembered Email
  useEffect(() => {
    const savedEmail = localStorage.getItem('cronos_remember_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
        setError('Preencha todos os campos.');
        return;
    }
    setError('');
    
    try {
      await login(email, password);
      
      // Handle Remember Me
      if (rememberMe) {
        localStorage.setItem('cronos_remember_email', email);
      } else {
        localStorage.removeItem('cronos_remember_email');
      }

      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('E-mail ou senha inválidos.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Muitas tentativas. Tente novamente mais tarde.');
      } else {
        setError('Erro ao autenticar. Verifique suas credenciais.');
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) return;
    try {
      setResetStatus('Enviando...');
      await AuthService.recoverPassword(resetEmail);
      setResetStatus('Link de redefinição enviado! Verifique seu e-mail.');
      setTimeout(() => {
        setIsResetModalOpen(false);
        setResetStatus('');
      }, 3000);
    } catch (err: any) {
      setResetStatus('Erro ao enviar. Verifique o e-mail digitado.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        {/* Top Link: Voltar */}
        <div className="mb-6">
          <Link to="/" className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-2">
            <ArrowLeft size={16} /> Voltar para seleção
          </Link>
        </div>

        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-white rounded-xl mx-auto flex items-center justify-center text-indigo-600 mb-4 shadow-sm border border-slate-200">
            <Command size={24} />
          </div>
          <h1 className={`text-2xl font-bold ${currentConfig.color}`}>{currentConfig.title}</h1>
          <p className="text-slate-500 mt-2">{currentConfig.subtitle}</p>
        </div>

        <Card className="shadow-xl border-0">
            <form onSubmit={handleSubmit} className="space-y-5 pt-2">
                <Input 
                  label="Email" 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="seu@email.com"
                  required 
                  autoFocus
                />
                
                <div className="relative">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
                  <div className="relative">
                    <input 
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-slate-900 pr-10"
                      type={showPassword ? "text" : "password"}
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      placeholder="••••••••"
                      required 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                    <input 
                      type="checkbox" 
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300" 
                    />
                    Lembrar de mim
                  </label>
                  <button 
                    type="button" 
                    onClick={() => { setResetEmail(email); setIsResetModalOpen(true); }}
                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Esqueci minha senha
                  </button>
                </div>
                
                {error && <p className="text-sm text-red-500 bg-red-50 p-2 rounded border border-red-100">{error}</p>}

                <Button type="submit" className="w-full justify-center" disabled={isLoading}>
                    {isLoading ? 'Carregando...' : 'Entrar'}
                </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-600 mb-3">Ainda não tem conta?</p>
              
              <Link 
                to={`/register?type=${accountType}`} 
                className="block w-full text-center bg-slate-50 border border-slate-200 rounded-lg py-2 hover:bg-slate-100 transition text-slate-700 font-medium"
              >
                 Criar Conta
              </Link>
            </div>
        </Card>
      </div>

      {/* Forgot Password Modal */}
      <Modal 
        isOpen={isResetModalOpen} 
        onClose={() => setIsResetModalOpen(false)} 
        title="Redefinir Senha"
      >
        <div className="space-y-4">
          <p className="text-slate-600 text-sm">Digite seu e-mail abaixo para receber um link de redefinição de senha.</p>
          <Input 
            label="E-mail" 
            value={resetEmail} 
            onChange={(e) => setResetEmail(e.target.value)} 
            placeholder="seu@email.com"
          />
          {resetStatus && (
            <p className={`text-sm p-2 rounded ${resetStatus.includes('Erro') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
              {resetStatus}
            </p>
          )}
          <Button onClick={handleForgotPassword} className="w-full">
            Enviar Link
          </Button>
        </div>
      </Modal>
    </div>
  );
};