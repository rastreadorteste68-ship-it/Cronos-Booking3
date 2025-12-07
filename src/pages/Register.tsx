import React, { useState, useEffect } from 'react';
import { useAuth } from '../services/authContext';
import { Button, Input, Card } from '../components/UI';
import { Command, ArrowLeft, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Role } from '../types';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthService } from '../lib/authService';

export const Register: React.FC = () => {
  const [searchParams] = useSearchParams();
  const accountType = searchParams.get('type') || 'client';

  const [role, setRole] = useState<Role>('CLIENTE');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  // Existing Email Logic
  const [emailExists, setEmailExists] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  // Map URL type to Role and Config
  useEffect(() => {
    switch(accountType) {
      case 'company':
        setRole('EMPRESA_ADMIN');
        break;
      case 'admin':
        setRole('MASTER_ADMIN');
        break;
      default:
        setRole('CLIENTE');
    }
  }, [accountType]);

  const typeConfig: Record<string, { title: string, subtitle: string }> = {
    client: { title: 'Cadastrar Cliente', subtitle: 'Crie sua conta para agendar' },
    company: { title: 'Cadastrar Empresa', subtitle: 'Comece a gerenciar seu negócio' },
    admin: { title: 'Cadastrar Admin', subtitle: 'Registro administrativo' }
  };
  const currentConfig = typeConfig[accountType] || typeConfig['client'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name || !confirmPassword) {
        setError('Preencha todos os campos.');
        return;
    }
    if (password !== confirmPassword) {
        setError('As senhas não coincidem.');
        return;
    }
    setError('');
    setEmailExists(false);
    
    try {
      await register(name, email, password, role);
      navigate('/dashboard');
      
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setEmailExists(true);
        setError('Já existe uma conta cadastrada com este e-mail.');
      } else if (err.code === 'auth/weak-password') {
        setError('A senha deve ter pelo menos 6 caracteres.');
      } else {
        setError('Erro ao criar conta. Tente novamente.');
      }
    }
  };

  const handleRecoverPassword = async () => {
    try {
      await AuthService.recoverPassword(email);
      setResetSent(true);
      setError('');
    } catch (err) {
      setError('Erro ao enviar e-mail de recuperação.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        {/* Top Link: Voltar */}
        <div className="mb-6">
          <Link to={`/login?type=${accountType}`} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-2">
            <ArrowLeft size={16} /> Voltar para login
          </Link>
        </div>

        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl mx-auto flex items-center justify-center text-white mb-4 shadow-lg shadow-indigo-200">
            <Command size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{currentConfig.title}</h1>
          <p className="text-slate-500 mt-2">{currentConfig.subtitle}</p>
        </div>

        <Card className="shadow-xl border-0">
          <form onSubmit={handleSubmit} className="space-y-5 pt-2">
              <Input 
                label="Nome Completo" 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Seu nome"
                required 
                autoFocus
                disabled={emailExists}
              />

              <Input 
                label="Email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="seu@email.com"
                required 
                disabled={emailExists}
              />
              
              <div className="relative">
                <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
                <div className="relative">
                  <input 
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-slate-900 pr-10 disabled:bg-slate-50 disabled:text-slate-400"
                    type={showPassword ? "text" : "password"}
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="Mínimo 6 caracteres"
                    required 
                    disabled={emailExists}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
                    disabled={emailExists}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar Senha</label>
                <input 
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-slate-900 disabled:bg-slate-50 disabled:text-slate-400"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  placeholder="Repita a senha"
                  required 
                  disabled={emailExists}
                />
              </div>
              
              {error && (
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-red-500 bg-red-50 p-2 rounded border border-red-100 flex items-center gap-2">
                    <AlertCircle size={16} /> {error}
                  </p>
                  {emailExists && !resetSent && (
                    <Button type="button" variant="secondary" onClick={handleRecoverPassword} className="w-full">
                      Recuperar senha deste e-mail
                    </Button>
                  )}
                  {resetSent && (
                      <p className="text-sm text-green-600 bg-green-50 p-2 rounded border border-green-100 text-center">
                        E-mail de redefinição enviado com sucesso!
                      </p>
                  )}
                </div>
              )}

              {!emailExists && (
                <Button type="submit" className="w-full justify-center" disabled={isLoading}>
                    {isLoading ? 'Criando Conta...' : 'Criar Conta'}
                </Button>
              )}
              
              {emailExists && (
                  <Button type="button" onClick={() => { setEmailExists(false); setError(''); }} variant="ghost" className="w-full">
                    Tentar outro e-mail
                  </Button>
              )}
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-600 mb-3">Já tem uma conta?</p>
            <Link to={`/login?type=${accountType}`} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
              Fazer login
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};