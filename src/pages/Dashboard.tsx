import React, { useEffect, useState } from 'react';
import { StorageService } from '../services/storage';
import { Appointment, Transaction, Company } from '../types';
import { Card, Badge } from '../components/UI';
import { DollarSign, Calendar, CheckCircle, Clock, Building2, TrendingUp, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useAuth } from '../services/authContext';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  useEffect(() => {
    const load = async () => {
      const a = await StorageService.getAppointments();
      const t = await StorageService.getAll<Transaction>(StorageService.KEYS.TRANSACTIONS);
      const c = await StorageService.getAll<Company>(StorageService.KEYS.COMPANIES);
      setAppointments(a);
      setTransactions(t);
      setCompanies(c);
    };
    load();
  }, [user]);

  const StatsCard = ({ title, value, icon: Icon, color }: any) => (
    <Card className="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </Card>
  );

  // --- MASTER ADMIN VIEW ---
  if (user?.role === 'MASTER_ADMIN') {
    const totalRevenue = transactions.filter(t => t.type === 'INCOME').reduce((acc, curr) => acc + curr.amount, 0);
    
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-800">Painel Master</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Empresas Ativas" value={companies.filter(c => c.active).length} icon={Building2} color="bg-indigo-600" />
          <StatsCard title="Receita Global" value={`R$ ${totalRevenue.toLocaleString()}`} icon={TrendingUp} color="bg-emerald-600" />
          <StatsCard title="Agendamentos Hoje" value={appointments.filter(a => a.date === new Date().toISOString().split('T')[0]).length} icon={Calendar} color="bg-blue-600" />
          <StatsCard title="Usuários Totais" value="45" icon={Users} color="bg-slate-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Empresas Cadastradas">
             <div className="space-y-4">
               {companies.map(c => (
                 <div key={c.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center font-bold text-slate-700">
                       {c.name.charAt(0)}
                     </div>
                     <div>
                       <p className="font-semibold text-slate-900">{c.name}</p>
                       <p className="text-xs text-slate-500">Desde {new Date(c.createdAt).toLocaleDateString()}</p>
                     </div>
                   </div>
                   <div className="flex items-center gap-2">
                     <Badge color="indigo">{c.plan}</Badge>
                     <Badge color={c.active ? 'green' : 'red'}>{c.active ? 'Ativa' : 'Inativa'}</Badge>
                   </div>
                 </div>
               ))}
             </div>
          </Card>

          <Card title="Atividade Recente (Sistema)">
             <div className="space-y-3">
               {appointments.slice(0, 5).map(a => (
                 <div key={a.id} className="text-sm p-3 bg-slate-50 rounded border border-slate-100">
                   <span className="font-bold text-slate-700">Agendamento #{a.id}</span>
                   <span className="text-slate-500"> - {a.date} - Status: {a.status}</span>
                 </div>
               ))}
             </div>
          </Card>
        </div>
      </div>
    );
  }

  // --- EMPRESA ADMIN & CLIENTE VIEW ---
  const totalRevenue = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const pendingAppointments = appointments.filter(a => a.status === 'PENDING').length;
  const todayAppointments = appointments.filter(a => a.date === new Date().toISOString().split('T')[0]).length;

  const chartData = appointments.reduce((acc: any[], curr) => {
    const day = curr.date.split('-')[2];
    const found = acc.find(i => i.name === day);
    if (found) found.count++;
    else acc.push({ name: day, count: 1 });
    return acc;
  }, []).sort((a, b) => parseInt(a.name) - parseInt(b.name)).slice(-7);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Visão Geral</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Receita Total" value={`R$ ${totalRevenue}`} icon={DollarSign} color="bg-emerald-500" />
        <StatsCard title="Agendamentos Hoje" value={todayAppointments} icon={Calendar} color="bg-indigo-500" />
        <StatsCard title="Pendentes" value={pendingAppointments} icon={Clock} color="bg-amber-500" />
        <StatsCard title="Concluídos Total" value={appointments.filter(a => a.status === 'COMPLETED').length} icon={CheckCircle} color="bg-blue-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Agendamentos por Dia" className="h-full">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div>
          <Card title="Próximos Agendamentos">
            <div className="space-y-4">
              {appointments
                .filter(a => a.status === 'CONFIRMED' || a.status === 'PENDING')
                .slice(0, 5)
                .map(a => (
                <div key={a.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{a.date.split('-').reverse().slice(0, 2).join('/')} - {a.startTime}</p>
                    <Badge color={a.status === 'PENDING' ? 'yellow' : 'blue'}>{a.status}</Badge>
                  </div>
                </div>
              ))}
              {appointments.length === 0 && <p className="text-slate-400 text-sm">Nenhum agendamento.</p>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};