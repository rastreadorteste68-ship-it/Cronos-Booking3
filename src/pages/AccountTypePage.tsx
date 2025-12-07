import React from 'react';
import { Link } from 'react-router-dom';
import { User, Building2, Shield, Command } from 'lucide-react';
import { Card } from '../components/UI';

export const AccountTypePage: React.FC = () => {
  const OptionCard = ({ type, icon: Icon, title, desc, color }: any) => (
    <Link 
      to={`/login?type=${type}`}
      className="group relative flex flex-col items-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 w-full"
    >
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${color}`}>
        <Icon size={32} className="text-white" />
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">{title}</h3>
      <p className="text-sm text-slate-500 text-center">{desc}</p>
      
      <div className="mt-6 px-6 py-2 rounded-full bg-slate-50 text-slate-600 text-sm font-medium group-hover:bg-indigo-600 group-hover:text-white transition-colors">
        Acessar Conta
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center text-white mb-6 shadow-xl shadow-indigo-200">
          <Command size={32} />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Bem-vindo ao Cronos</h1>
        <p className="text-slate-500 text-lg">Selecione seu tipo de conta para continuar</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
        <OptionCard 
          type="client" 
          icon={User} 
          title="Sou Cliente" 
          desc="Quero agendar serviços e consultar meus horários" 
          color="bg-blue-500"
        />
        <OptionCard 
          type="company" 
          icon={Building2} 
          title="Sou Empresa" 
          desc="Quero gerenciar meu negócio, agenda e equipe" 
          color="bg-indigo-500"
        />
        <OptionCard 
          type="admin" 
          icon={Shield} 
          title="Master Admin" 
          desc="Acesso administrativo e gestão global" 
          color="bg-slate-800"
        />
      </div>

      <p className="mt-12 text-slate-400 text-sm">© {new Date().getFullYear()} Cronos Booking. Todos os direitos reservados.</p>
    </div>
  );
};