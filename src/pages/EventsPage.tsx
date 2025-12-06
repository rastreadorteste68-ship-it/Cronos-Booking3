import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { Event } from '../types';
import { Button, Card, Input, Modal, Badge } from '../components/UI';
import { Calendar, Users, Plus } from 'lucide-react';

export const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<Partial<Event>>({
    title: '', date: '', speaker: '', capacity: 50, enrolledIds: []
  });

  useEffect(() => {
    const load = async () => setEvents(await StorageService.getAll(StorageService.KEYS.EVENTS));
    load();
  }, []);

  const handleCreate = async () => {
    await StorageService.create(StorageService.KEYS.EVENTS, { ...form, id: Math.random().toString() } as Event);
    setIsModalOpen(false);
    const load = async () => setEvents(await StorageService.getAll(StorageService.KEYS.EVENTS));
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Eventos & Palestras</h1>
        <Button onClick={() => setIsModalOpen(true)}><Plus size={18} /> Criar Evento</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map(ev => (
          <Card key={ev.id} className="flex flex-col h-full">
            <div className="bg-indigo-50 -m-6 mb-4 p-6 border-b border-indigo-100">
              <Badge color="indigo" className="mb-2">Evento</Badge>
              <h3 className="text-xl font-bold text-slate-900">{ev.title}</h3>
              <p className="text-slate-600 flex items-center gap-2 mt-2"><Calendar size={14} /> {ev.date} às {ev.time}</p>
            </div>
            <div className="flex-1 space-y-4 pt-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span className="font-semibold">Palestrante:</span> {ev.speaker}
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div 
                  className="bg-indigo-500 h-2 rounded-full transition-all" 
                  style={{ width: `${(ev.enrolledIds.length / ev.capacity) * 100}%` }} 
                />
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>{ev.enrolledIds.length} inscritos</span>
                <span>Capacidade: {ev.capacity}</span>
              </div>
            </div>
            <Button variant="secondary" className="w-full mt-6">Gerenciar Inscrições</Button>
          </Card>
        ))}
        {events.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
            Nenhum evento agendado.
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Evento">
        <div className="space-y-4">
          <Input label="Título" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
          <div className="grid grid-cols-2 gap-4">
            <Input type="date" label="Data" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
            <Input type="time" label="Hora" value={form.time} onChange={e => setForm({...form, time: e.target.value})} />
          </div>
          <Input label="Palestrante" value={form.speaker} onChange={e => setForm({...form, speaker: e.target.value})} />
          <Input type="number" label="Capacidade" value={form.capacity} onChange={e => setForm({...form, capacity: Number(e.target.value)})} />
          <Button onClick={handleCreate} className="w-full mt-2">Criar</Button>
        </div>
      </Modal>
    </div>
  );
};