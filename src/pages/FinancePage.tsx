import React, { useEffect, useState } from 'react';
import { StorageService } from '../services/storage';
import { Transaction } from '../types';
import { Card, Badge, Button } from '../components/UI';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { Download, TrendingUp, TrendingDown } from 'lucide-react';

export const FinancePage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const load = async () => setTransactions(await StorageService.getAll(StorageService.KEYS.TRANSACTIONS));
    load();
  }, []);

  const income = transactions.filter(t => t.type === 'INCOME').reduce((acc, c) => acc + c.amount, 0);
  const expense = transactions.filter(t => t.type === 'EXPENSE').reduce((acc, c) => acc + c.amount, 0);
  const balance = income - expense;

  const rawData = [
    { name: 'Entradas', value: income, color: '#10b981' },
    { name: 'Saídas', value: expense, color: '#ef4444' }
  ];

  // Handle empty state to avoid chart errors or invisible charts
  const hasData = income > 0 || expense > 0;
  const chartData = hasData 
    ? rawData 
    : [{ name: 'Sem dados', value: 1, color: '#e2e8f0' }];

  const exportCSV = () => {
    const headers = "ID,Data,Tipo,Valor,Categoria,Status\n";
    const rows = transactions.map(t => 
      `${t.id},${t.date},${t.type},${t.amount},${t.category},${t.status}`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'financeiro.csv';
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Financeiro</h1>
        <Button variant="secondary" onClick={exportCSV}><Download size={16} /> Exportar CSV</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-emerald-50 border-emerald-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><TrendingUp size={20} /></div>
            <span className="text-emerald-700 font-medium">Receitas</span>
          </div>
          <p className="text-2xl font-bold text-emerald-900">R$ {income.toFixed(2)}</p>
        </Card>
        <Card className="bg-rose-50 border-rose-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-rose-100 rounded-lg text-rose-600"><TrendingDown size={20} /></div>
            <span className="text-rose-700 font-medium">Despesas</span>
          </div>
          <p className="text-2xl font-bold text-rose-900">R$ {expense.toFixed(2)}</p>
        </Card>
        <Card className="bg-slate-900 text-white border-slate-800">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-slate-300 font-medium">Saldo Atual</span>
          </div>
          <p className="text-3xl font-bold">R$ {balance.toFixed(2)}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Distribuição">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={chartData} 
                  innerRadius={60} 
                  outerRadius={80} 
                  paddingAngle={hasData ? 5 : 0} 
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                {hasData && <RechartsTooltip />}
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Últimas Transações" className="lg:col-span-2 h-[350px] overflow-y-auto">
          <div className="space-y-3">
            {transactions.map(t => (
              <div key={t.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">{t.description}</p>
                  <p className="text-xs text-slate-500">{new Date(t.date).toLocaleDateString()} - {t.category}</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {t.type === 'INCOME' ? '+' : '-'} R$ {t.amount}
                  </p>
                  <Badge color={t.status === 'PAID' ? 'green' : 'yellow'}>{t.status}</Badge>
                </div>
              </div>
            ))}
            {transactions.length === 0 && (
              <p className="text-center text-slate-400 py-8">Nenhuma transação registrada.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};