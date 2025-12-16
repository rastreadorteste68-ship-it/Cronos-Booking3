import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './services/authContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AccountTypePage } from './pages/AccountTypePage';
import { Dashboard } from './pages/Dashboard';
import { Agenda } from './pages/Agenda';
import { ServicesPage } from './pages/ServicesPage';
import { ProfessionalsPage } from './pages/ProfessionalsPage';
import { ClientsPage } from './pages/ClientsPage';
import { FinancePage } from './pages/FinancePage';
import { EventsPage } from './pages/EventsPage';
import { CompaniesPage } from './pages/CompaniesPage';
import { SettingsPage } from './pages/SettingsPage';
import { Role } from './types';

// Componente para proteger rotas e verificar role
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: Role[] }> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-slate-50 text-indigo-600 font-medium">Carregando Perfil...</div>;
  
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />; 

  // Validação de Role (opcional, para reforçar segurança)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
      // Se tentar acessar área errada, manda para a correta
      if (user.role === 'MASTER_ADMIN') return <Navigate to="/admin" />;
      if (user.role === 'EMPRESA_ADMIN') return <Navigate to="/empresa" />;
      if (user.role === 'PROFESSIONAL') return <Navigate to="/profissional" />;
      if (user.role === 'CLIENTE') return <Navigate to="/cliente" />;
  }

  return <Layout>{children}</Layout>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<AccountTypePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Rota Genérica (Redireciona para específica) */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

          {/* Rotas Específicas por Role (Solicitadas no Prompt) */}
          {/* Todas renderizam o Dashboard, mas a URL reflete o tipo de usuário */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['MASTER_ADMIN']}>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/empresa" element={
            <ProtectedRoute allowedRoles={['EMPRESA_ADMIN']}>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/profissional" element={
            <ProtectedRoute allowedRoles={['PROFESSIONAL']}>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/cliente" element={
            <ProtectedRoute allowedRoles={['CLIENTE']}>
              <Dashboard />
            </ProtectedRoute>
          } />

          {/* Feature Routes */}
          <Route path="/empresas" element={<ProtectedRoute allowedRoles={['MASTER_ADMIN']}><CompaniesPage /></ProtectedRoute>} />
          <Route path="/agenda" element={<ProtectedRoute><Agenda /></ProtectedRoute>} />
          <Route path="/servicos" element={<ProtectedRoute><ServicesPage /></ProtectedRoute>} />
          <Route path="/profissionais" element={<ProtectedRoute><ProfessionalsPage /></ProtectedRoute>} />
          <Route path="/clientes" element={<ProtectedRoute><ClientsPage /></ProtectedRoute>} />
          <Route path="/financeiro" element={<ProtectedRoute><FinancePage /></ProtectedRoute>} />
          <Route path="/eventos" element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
          <Route path="/configuracoes" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;