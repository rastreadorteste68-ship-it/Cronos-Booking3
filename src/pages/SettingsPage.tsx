import React, { useEffect, useState } from 'react';
import { StorageService } from '../services/storage';
import { Company, NotificationLog } from '../types';
import { Button, Card, Input, Select, Badge } from '../components/UI';
import { MessageCircle, Save, History, Settings } from 'lucide-react';
import { format } from 'date-fns';

export const SettingsPage: React.FC = () => {
  const [company, setCompany] = useState<Company | null>(null);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [activeTab, setActiveTab] = useState<'config' | 'logs'>('config');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const c = await StorageService.getCompanySettings();
    const l = await StorageService.getAll<NotificationLog>(StorageService.KEYS.NOTIFICATIONS);
    setCompany(c || null);
    setLogs(l.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const handleSave = async () => {
    if (!company) return;
    await StorageService.update(StorageService.KEYS.COMPANIES, company);
    alert('Configurações salvas com sucesso!');
  };

  if (!company || !company.notificationSettings) return <div className="p-8">Carregando configurações...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-slate-800">Configurações & Integrações</h1>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('config')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'config' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}
        >
          <div className="flex items-center gap-2"><Settings size={16} /> WhatsApp API</div>
        </button>
        <button 
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'logs' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}
        >
           <div className="flex items-center gap-2"><History size={16} /> Histórico de Envios</div>
        </button>
      </div>

      {activeTab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Conexão com Provedor">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-100 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><MessageCircle size={24} /></div>
                  <div>
                    <h4 className="font-bold text-emerald-900">Integração WhatsApp</h4>
                    <p className="text-xs text-emerald-700">Automatize lembretes e confirmações</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <input 
                      type="checkbox" 
                      className="toggle" 
                      checked={company.notificationSettings.active}
                      onChange={e => setCompany({
                        ...company, 
                        notificationSettings: { ...company.notificationSettings!, active: e.target.checked }
                      })}
                   />
                   <span className="text-sm font-medium">{company.notificationSettings.active ? 'Ativo' : 'Inativo'}</span>
                </div>
              </div>

              <Select 
                label="Provedor de API" 
                value={company.notificationSettings.provider}
                onChange={e => setCompany({
                   ...company, 
                   notificationSettings: { ...company.notificationSettings!, provider: e.target.value as any }
                })}
              >
                <option value="MOCK">Modo Simulação (Grátis)</option>
                <option value="WHATSAPP_CLOUD">WhatsApp Cloud API (Meta)</option>
                <option value="Z_API">Z-API</option>
                <option value="ULTRAMSG">UltraMsg</option>
              </Select>

              <Input 
                label="API Token / Chave de Acesso" 
                type="password"
                value={company.notificationSettings.apiKey}
                onChange={e => setCompany({
                   ...company, 
                   notificationSettings: { ...company.notificationSettings!, apiKey: e.target.value }
                })}
              />
              
              {(company.notificationSettings.provider === 'Z_API' || company.notificationSettings.provider === 'ULTRAMSG') && (
                 <Input 
                  label="Instance ID" 
                  value={company.notificationSettings.instanceId || ''}
                  onChange={e => setCompany({
                     ...company, 
                     notificationSettings: { ...company.notificationSettings!, instanceId: e.target.value }
                  })}
                />
              )}
            </div>
          </Card>

          <Card title="Modelos de Mensagem (Templates)">
            <div className="space-y-4">
               <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded">
                 Variáveis disponíveis: {'{client_name}'}, {'{service_name}'}, {'{date}'}, {'{time}'}, {'{professional_name}'}
               </p>

               <div>
                 <label className="text-xs font-semibold text-slate-700 uppercase">Agendamento Criado</label>
                 <textarea 
                    className="w-full mt-1 p-2 border border-slate-200 rounded text-sm h-24"
                    value={company.notificationSettings.templates.appointmentCreated}
                    onChange={e => setCompany({
                       ...company, 
                       notificationSettings: { 
                         ...company.notificationSettings!, 
                         templates: { ...company.notificationSettings!.templates, appointmentCreated: e.target.value }
                       }
                    })}
                 />
               </div>

               <div>
                 <label className="text-xs font-semibold text-slate-700 uppercase">Cancelamento</label>
                 <textarea 
                    className="w-full mt-1 p-2 border border-slate-200 rounded text-sm h-24"
                    value={company.notificationSettings.templates.appointmentCancelled}
                    onChange={e => setCompany({
                       ...company, 
                       notificationSettings: { 
                         ...company.notificationSettings!, 
                         templates: { ...company.notificationSettings!.templates, appointmentCancelled: e.target.value }
                       }
                    })}
                 />
               </div>
            </div>
          </Card>

          <div className="lg:col-span-2 flex justify-end">
             <Button onClick={handleSave} className="w-full md:w-auto"><Save size={18} /> Salvar Configurações</Button>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <Card className="overflow-hidden">
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm">
               <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                 <tr>
                   <th className="p-4">Data/Hora</th>
                   <th className="p-4">Evento</th>
                   <th className="p-4">Destinatário</th>
                   <th className="p-4">Mensagem</th>
                   <th className="p-4">Status</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {logs.map(log => (
                   <tr key={log.id} className="hover:bg-slate-50">
                     <td className="p-4 whitespace-nowrap text-slate-500">{format(new Date(log.date), 'dd/MM HH:mm')}</td>
                     <td className="p-4">
                       <Badge color="indigo" className="text-[10px]">{log.trigger}</Badge>
                     </td>
                     <td className="p-4 text-slate-700 font-medium">{log.to}</td>
                     <td className="p-4 text-slate-600 max-w-xs truncate" title={log.message}>{log.message}</td>
                     <td className="p-4">
                       <Badge color="green">ENVIADO</Badge>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
             {logs.length === 0 && <div className="p-8 text-center text-slate-400">Nenhum envio registrado.</div>}
           </div>
        </Card>
      )}
    </div>
  );
};