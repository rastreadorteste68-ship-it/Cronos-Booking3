import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../services/authContext';
import { 
  Calendar, Users, Briefcase, Settings, DollarSign, 
  LogOut, Menu, X, Mic2, LayoutDashboard, Building2, Sliders
} from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['MASTER_ADMIN', 'EMPRESA_ADMIN'] },
    { label: 'Empresas', path: '/empresas', icon: Building2, roles: ['MASTER_ADMIN'] },
    { label: 'Agenda', path: '/agenda', icon: Calendar, roles: ['MASTER_ADMIN', 'EMPRESA_ADMIN', 'CLIENTE'] },
    { label: 'Clientes', path: '/clientes', icon: Users, roles: ['MASTER_ADMIN', 'EMPRESA_ADMIN'] },
    { label: 'Profissionais', path: '/profissionais', icon: Briefcase, roles: ['MASTER_ADMIN', 'EMPRESA_ADMIN'] },
    { label: 'Serviços', path: '/servicos', icon: Sliders, roles: ['MASTER_ADMIN', 'EMPRESA_ADMIN'] },
    { label: 'Eventos', path: '/eventos', icon: Mic2, roles: ['MASTER_ADMIN', 'EMPRESA_ADMIN'] },
    { label: 'Financeiro', path: '/financeiro', icon: DollarSign, roles: ['MASTER_ADMIN', 'EMPRESA_ADMIN'] },
    { label: 'Configurações', path: '/configuracoes', icon: Settings, roles: ['EMPRESA_ADMIN'] },
  ];

  const filteredNav = navItems.filter(item => user && item.roles.includes(user.role));

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:relative z-30 w-64 h-full bg-white border-r border-slate-200 shadow-xl md:shadow-none transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-600">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">C</div>
              <span className="text-xl font-bold tracking-tight">Cronos</span>
            </div>
            <button className="md:hidden text-slate-400" onClick={() => setSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {filteredNav.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-indigo-50 text-indigo-700' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <item.icon size={18} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                {user?.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate capitalize">{user?.role.replace('_', ' ').toLowerCase()}</p>
              </div>
            </div>
            <button 
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              <LogOut size={16} />
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="md:hidden flex items-center px-4 h-16 bg-white border-b border-slate-200">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-500 hover:text-indigo-600 p-2 -ml-2">
            <Menu size={24} />
          </button>
          <span className="ml-2 font-semibold text-slate-800">Cronos Booking</span>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};