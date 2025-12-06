import React, { useEffect, useState } from 'react';
import { StorageService } from '../services/storage';
import { Service } from '../types';
import { Button, Card, Input, Modal } from '../components/UI';
import { Plus, Trash2 } from 'lucide-react';

export const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Service>>({ name: '', price: 0, durationMinutes: 30 });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setServices(await StorageService.getAll(StorageService.KEYS.SERVICES));
  };

  const handleSave = async () => {
    await StorageService.create(StorageService.KEYS.SERVICES, { ...formData, id: Math.random().toString(), customFields: [] } as Service);
    setIsModalOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if(confirm('Remover serviço?')) {
        await StorageService.delete(StorageService.KEYS.SERVICES, id);
        load();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Serviços</h1>
        <Button onClick={() => setIsModalOpen(true)}><Plus size={18} /> Novo Serviço</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {services.map(s => (
          <Card key={s.id} className="hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg text-slate-900">{s.name}</h3>
                <p className="text-slate-500 text-sm">{s.durationMinutes} min</p>
              </div>
              <button onClick={() => handleDelete(s.id)} className="text-red-400 hover:text-red-600"><Trash2 size={18} /></button>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
              <span className="font-bold text-indigo-600">R$ {s.price.toFixed(2)}</span>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Adicionar Serviço">
        <div className="space-y-4">
          <Input label="Nome" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Price (R$)" type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
            <Input label="Duração (min)" type="number" value={formData.durationMinutes} onChange={e => setFormData({...formData, durationMinutes: Number(e.target.value)})} />
          </div>
          <Button onClick={handleSave} className="w-full">Salvar</Button>
        </div>
      </Modal>
    </div>
  );
};