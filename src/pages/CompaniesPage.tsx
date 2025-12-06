import React, { useEffect, useState } from 'react';
import { StorageService } from '../services/storage';
import { Company, User } from '../types';
import { Button, Card, Input, Modal, Select, Badge } from '../components/UI';
import { Plus, Edit2, Trash2, Building2 } from 'lucide-react';

export const CompaniesPage: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Company>>({
    name: '', plan: 'PRO', active: true
  });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setCompanies(await StorageService.getAll<Company>(StorageService.KEYS.COMPANIES));
  };

  const handleSave = async () => {
    if (formData.id) {
      await StorageService.update(StorageService.KEYS.COMPANIES, formData as Company);
    } else {
      // 1. Create the Company
      const newCompanyId = Math.random().toString(36).substr(2, 9);
      const newCompany: Company = { 
        ...formData, 
        id: newCompanyId,
        createdAt: new Date().toISOString() 
      } as Company;
      
      await StorageService.create(StorageService.KEYS.COMPANIES, newCompany);

      // 2. Auto-create a Default Admin User for this company (so it appears on Login screen)
      const cleanName = formData.name?.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'empresa';
      const defaultUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        companyId: newCompanyId,
        name: `Admin ${formData.name}`,
        email: `admin@${cleanName}.com`,
        role: 'EMPRESA_ADMIN'
      };
      
      // We use direct localStorage access or a specialized method because StorageService.create might rely on current user context
      // but here we are master admin creating another user.
      const users = await StorageService.getAll<User>(StorageService.KEYS.USERS);
      users.push(defaultUser);
      localStorage.setItem(StorageService.KEYS.USERS, JSON.stringify(users));

      alert(`Empresa criada! Usuário gerado: ${defaultUser.email}`);
    }
    setIsModalOpen(false);
    load();
    setFormData({ name: '', plan: 'PRO', active: true });
  };

  const handleEdit = (c: Company) => {
    setFormData(c);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza? Isso pode afetar dados vinculados.')) {
      await StorageService.delete(StorageService.KEYS.COMPANIES, id);
      load();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Gerenciar Empresas</h1>
        <Button onClick={() => { setFormData({ name: '', plan: 'PRO', active: true }); setIsModalOpen(true); }}>
          <Plus size={18} /> Nova Empresa
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map(c => (
          <Card key={c.id} className="relative overflow-hidden group">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{c.name}</h3>
                  <p className="text-xs text-slate-500">ID: {c.id}</p>
                </div>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(c)} className="p-1.5 text-slate-400 hover:text-indigo-600"><Edit2 size={16} /></button>
                <button onClick={() => handleDelete(c.id)} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Plano</span>
                <Badge color="blue">{c.plan}</Badge>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Status</span>
                <Badge color={c.active ? 'green' : 'gray'}>{c.active ? 'Ativo' : 'Inativo'}</Badge>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Criado em</span>
                <span className="text-slate-700">{new Date(c.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={formData.id ? 'Editar Empresa' : 'Nova Empresa'}>
        <div className="space-y-4">
          <Input label="Nome da Empresa" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          
          <Select label="Plano" value={formData.plan} onChange={e => setFormData({...formData, plan: e.target.value as any})}>
            <option value="FREE">Free</option>
            <option value="PRO">Pro</option>
            <option value="ENTERPRISE">Enterprise</option>
          </Select>

          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="active" 
              checked={formData.active} 
              onChange={e => setFormData({...formData, active: e.target.checked})}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="active" className="text-sm font-medium text-slate-700">Empresa Ativa</label>
          </div>

          <Button onClick={handleSave} className="w-full mt-4">
             {formData.id ? 'Salvar Alterações' : 'Criar Empresa (+ Usuário Admin)'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};