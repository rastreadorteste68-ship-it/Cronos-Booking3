import React, { useState } from 'react';
import { useAuth } from '../services/authContext';
import { Button, Input, Card } from '../components/UI';
import { Command, ArrowLeft, Shield, Building2, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Role } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { AuthService } from '../lib/authService';

export const Register: React.FC = () => {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role>('CLIENTE');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  // Existing Email Logic
  const [emailExists, setEmailExists] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleRoleSelect = (selected: Role) => {
    setRole(selected);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
        setError('Preencha todos os campos.');
        return;
    }
    setError('');
    setEmailExists(false);
    
    try {
      // 1. Check if email exists (Optional pre-check, but helpful for UX)
      // Note: Firebase create() also throws 'auth/email-already-in-use', we handle both.
      
      await register(name, email, password, role);
      navigate('/');
      
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

  const RoleCard = ({ r, icon: Icon, title, desc }: any) => (
    <button 
      onClick={() => handleRoleSelect(r)}
      className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-indigo-600 hover:bg-indigo-50 transition-all group bg-white"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
          <Icon size={24} />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-500">{desc}</p>
        </div>
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl mx-auto flex items-center justify-center text-white mb-4 shadow-lg shadow-indigo-200">
            <Command size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Criar Conta</h1>
          <p className="text-slate-500 mt-2">Junte-se ao Cronos Booking</p>
        </div>

        {step === 1 ? (
           <div className="space-y-4 animate-in slide-in-from-bottom duration-300">
              <p className="text-center text-slate-600 font-medium mb-2">Qual tipo de conta você deseja?</p>
              <RoleCard r="CLIENTE" icon={User} title="Sou Cliente" desc="Quero agendar serviços" />
              <RoleCard r="EMPRESA_ADMIN" icon={Building2} title="Sou Empresa" desc="Quero gerenciar meu negócio" />
              <RoleCard r="MASTER_ADMIN" icon={Shield} title="Master Admin" desc="Acesso administrativo" />
              
              <div className="text-center mt-6">
                <Link to="/login" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                  Já tem conta? Faça login
                </Link>
              </div>
           </div>
        ) : (
          <Card className="shadow-xl border-0 overflow-hidden relative">
            <button onClick={() => setStep(1)} className="absolute top-4 left-4 text-xs font-semibold text-slate-400 hover:text-indigo-600 flex items-center gap-1">
              <ArrowLeft size={12} /> Voltar
            </button>
            <div className="mt-6 text-center">
              <h2 className="text-lg font-semibold text-slate-800">Cadastro {role === 'CLIENTE' ? 'Cliente' : role === 'EMPRESA_ADMIN' ? 'Empresa' : 'Admin'}</h2>
              <p className="text-sm text-slate-500">Preencha seus dados abaixo.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 mt-6">
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
                      {isLoading ? 'Criando Conta...' : 'Cadastrar e Entrar'}
                  </Button>
                )}
                
                {emailExists && (
                   <Button type="button" onClick={() => { setEmailExists(false); setError(''); }} variant="ghost" className="w-full">
                     Tentar outro e-mail
                   </Button>
                )}
            </form>
          </Card>
        )}
      </div>
    </div>
  );
};