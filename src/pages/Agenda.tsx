import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Appointment, Client, Professional, Service } from '../types';
import { StorageService } from '../services/storage';
import { NotificationService } from '../services/notification';
import { SchedulerService } from '../services/scheduler';
import { Button, Modal, Input, Select, Badge, Card } from '../components/UI';
import { ChevronLeft, ChevronRight, Plus, Clock, User, Check, X, MapPin } from 'lucide-react';
import { useAuth } from '../services/authContext';

export const Agenda: React.FC = () => {
  const { user } = useAuth();
  const [view, setView] = useState<'month' | 'list'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  
  // Data for modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  
  // Form State
  const [formData, setFormData] = useState<Partial<Appointment>>({
    date: format(new Date(), 'yyyy-MM-dd'),
    status: 'PENDING',
    notes: ''
  });
  
  // Custom Fields State
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  
  // Slot Picker State
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Payment Checkout
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentData, setPaymentData] = useState<{ appt: Appointment | null, method: string }>({ appt: null, method: 'PIX' });

  useEffect(() => {
    fetchData();
  }, []);

  // Effect to load slots when dependencies change
  useEffect(() => {
    if (formData.date && formData.professionalId && formData.serviceId) {
      const dayOfWeek = new Date(formData.date).getUTCDay(); // fix timezone later, using simple date
      const prof = professionals.find(p => p.id === formData.professionalId);
      if (prof) {
         // Generate slots based on professional availability and existing appointments
         const dayAppts = appointments.filter(a => a.professionalId === prof.id && a.date === formData.date);
         const slots = SchedulerService.generateSlots(formData.date, prof, dayAppts);
         setAvailableSlots(slots);
         setSelectedSlot(null); 
      }
    }
  }, [formData.date, formData.professionalId, formData.serviceId, professionals, appointments]);

  const fetchData = async () => {
    const [a, c, p, s] = await Promise.all([
      StorageService.getAppointments(),
      StorageService.getAll<Client>(StorageService.KEYS.CLIENTS),
      StorageService.getAll<Professional>(StorageService.KEYS.PROFESSIONALS),
      StorageService.getAll<Service>(StorageService.KEYS.SERVICES)
    ]);
    setAppointments(a);
    setClients(c);
    setProfessionals(p);
    setServices(s);
  };

  const handleCreate = async () => {
    if (!formData.clientId || !formData.serviceId || !formData.professionalId || !selectedSlot) return;
    
    // Calculate End Time
    const service = services.find(s => s.id === formData.serviceId);
    if (!service) return;
    
    const [hours, minutes] = selectedSlot.split(':').map(Number);
    const endDate = new Date();
    endDate.setHours(hours, minutes + service.durationMinutes);
    const endTime = format(endDate, 'HH:mm');

    const newAppt: Appointment = {
      id: Math.random().toString(36).substr(2, 9),
      companyId: user?.companyId || '',
      clientId: formData.clientId,
      professionalId: formData.professionalId,
      serviceId: formData.serviceId,
      date: formData.date!,
      startTime: selectedSlot,
      endTime,
      status: 'PENDING',
      customFieldValues: customFieldValues,
      notes: formData.notes
    };

    await StorageService.create(StorageService.KEYS.APPOINTMENTS, newAppt);
    
    // Trigger Notification
    await NotificationService.notifyAppointmentCreated(newAppt);

    setIsModalOpen(false);
    setCustomFieldValues({});
    setSelectedSlot(null);
    setFormData({ date: format(new Date(), 'yyyy-MM-dd'), status: 'PENDING', notes: '' });
    fetchData();
  };

  const updateStatus = async (appt: Appointment, status: Appointment['status']) => {
    if (status === 'COMPLETED') {
      // Open payment modal instead of just completing
      setPaymentData({ appt, method: 'PIX' });
      setIsPaymentModalOpen(true);
      return;
    }

    if (status === 'CANCELLED') {
       if (confirm('Deseja realmente cancelar? O cliente será notificado.')) {
          await StorageService.update(StorageService.KEYS.APPOINTMENTS, { ...appt, status });
          await NotificationService.notifyAppointmentCancelled(appt);
          fetchData();
       }
       return;
    }

    await StorageService.update(StorageService.KEYS.APPOINTMENTS, { ...appt, status });
    fetchData();
  };

  const finalizePayment = async () => {
    if (!paymentData.appt) return;
    
    const service = services.find(s => s.id === paymentData.appt!.serviceId);
    if (service) {
      await StorageService.create(StorageService.KEYS.TRANSACTIONS, {
         id: Math.random().toString(),
         companyId: user?.companyId || '',
         date: new Date().toISOString(),
         amount: service.price,
         type: 'INCOME',
         category: 'Serviço',
         description: `Serviço: ${service.name}`,
         status: 'PAID',
         referenceId: paymentData.appt.id,
         paymentMethod: paymentData.method as any
      });
      
      await StorageService.update(StorageService.KEYS.APPOINTMENTS, { ...paymentData.appt, status: 'COMPLETED' });
      setIsPaymentModalOpen(false);
      fetchData();
    }
  };

  // Helper to render custom fields input
  const renderCustomFields = () => {
    if (!formData.serviceId) return null;
    const service = services.find(s => s.id === formData.serviceId);
    if (!service || !service.customFields || service.customFields.length === 0) return null;

    return (
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-3">
        <h4 className="text-sm font-semibold text-slate-700">Informações Adicionais</h4>
        {service.customFields.map(field => (
          <div key={field.id}>
             {field.type === 'select' ? (
               <Select 
                 label={field.label}
                 value={customFieldValues[field.id] || ''}
                 onChange={e => setCustomFieldValues({...customFieldValues, [field.id]: e.target.value})}
               >
                 <option value="">Selecione...</option>
                 {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
               </Select>
             ) : (
               <Input 
                 type={field.type === 'number' ? 'number' : 'text'}
                 label={field.label}
                 value={customFieldValues[field.id] || ''}
                 onChange={e => setCustomFieldValues({...customFieldValues, [field.id]: e.target.value})}
               />
             )}
          </div>
        ))}
      </div>
    )
  };

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const getDayAppointments = (day: Date) => {
    return appointments.filter(a => isSameDay(new Date(a.date), day));
  };

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-slate-800 capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </h1>
          <div className="flex gap-1 bg-white p-1 rounded-lg border border-slate-200">
            <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-1 hover:bg-slate-100 rounded"><ChevronLeft size={20} /></button>
            <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1 hover:bg-slate-100 rounded"><ChevronRight size={20} /></button>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setView(view === 'month' ? 'list' : 'month')}>
            {view === 'month' ? 'Ver Lista' : 'Ver Calendário'}
          </Button>
          <Button onClick={() => setIsModalOpen(true)}><Plus size={18} /> Novo Agendamento</Button>
        </div>
      </div>

      {view === 'month' ? (
        <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
          {/* Calendar Grid */}
          <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-y-auto">
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 sticky top-0 z-10">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                <div key={d} className="py-3 text-center text-sm font-semibold text-slate-600">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 auto-rows-fr">
              {daysInMonth.map((day) => {
                const dayAppts = getDayAppointments(day);
                const isSelected = selectedDay && isSameDay(day, selectedDay);
                return (
                  <div 
                    key={day.toISOString()} 
                    onClick={() => setSelectedDay(day)}
                    className={`min-h-[100px] p-2 border-b border-r border-slate-100 cursor-pointer transition-colors hover:bg-slate-50 ${isSelected ? 'bg-indigo-50 ring-2 ring-inset ring-indigo-500' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-sm font-medium ${isSameDay(day, new Date()) ? 'bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-slate-700'}`}>
                        {format(day, 'd')}
                      </span>
                      {dayAppts.length > 0 && (
                        <span className="text-xs font-bold text-slate-400">{dayAppts.length}</span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {dayAppts.slice(0, 3).map(a => (
                        <div key={a.id} className={`text-[10px] px-1.5 py-0.5 rounded truncate ${
                          a.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' :
                          a.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                          a.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {a.startTime}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Side Drawer for Details */}
          {selectedDay && (
            <div className="w-full md:w-80 bg-white border border-slate-200 rounded-xl shadow-lg flex flex-col animate-in slide-in-from-right duration-200">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-semibold text-slate-800 capitalize">{format(selectedDay, 'EEEE, d MMMM', { locale: ptBR })}</h3>
                <button onClick={() => setSelectedDay(null)}><X size={18} className="text-slate-400" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {getDayAppointments(selectedDay).length === 0 ? (
                  <p className="text-center text-slate-400 py-8">Sem agendamentos</p>
                ) : getDayAppointments(selectedDay).map(appt => {
                    const client = clients.find(c => c.id === appt.clientId);
                    const service = services.find(s => s.id === appt.serviceId);
                    const prof = professionals.find(p => p.id === appt.professionalId);
                    return (
                      <div key={appt.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 group">
                        <div className="flex justify-between items-start mb-2">
                          <Badge color={
                            appt.status === 'CONFIRMED' ? 'blue' :
                            appt.status === 'COMPLETED' ? 'green' :
                            appt.status === 'CANCELLED' ? 'red' : 'yellow'
                          }>{appt.status}</Badge>
                          <span className="text-xs font-bold text-slate-500">{appt.startTime} - {appt.endTime}</span>
                        </div>
                        <p className="font-medium text-slate-900">{client?.name}</p>
                        <p className="text-xs text-slate-500">{service?.name}</p>
                        <p className="text-xs text-slate-400 mb-2">Prof: {prof?.name}</p>
                        
                        {appt.notes && (
                            <div className="bg-yellow-50 p-2 rounded text-xs text-yellow-800 mb-2 border border-yellow-100">
                                <strong>Nota:</strong> {appt.notes}
                            </div>
                        )}
                        
                        <div className="flex gap-2 pt-2 border-t border-slate-200">
                          {appt.status !== 'COMPLETED' && appt.status !== 'CANCELLED' && (
                             <>
                               {appt.status === 'PENDING' && (
                                 <button onClick={() => updateStatus(appt, 'CONFIRMED')} className="flex-1 text-xs bg-green-100 text-green-700 py-1.5 rounded hover:bg-green-200">Confirmar</button>
                               )}
                               {appt.status === 'CONFIRMED' && (
                                  <button onClick={() => updateStatus(appt, 'EN_ROUTE')} className="flex-1 text-xs bg-indigo-100 text-indigo-700 py-1.5 rounded hover:bg-indigo-200 flex items-center justify-center gap-1"><MapPin size={10} /> A Caminho</button>
                               )}
                               <button onClick={() => updateStatus(appt, 'COMPLETED')} className="flex-1 text-xs bg-blue-100 text-blue-700 py-1.5 rounded hover:bg-blue-200">Pagar/Concluir</button>
                               <button onClick={() => updateStatus(appt, 'CANCELLED')} className="p-1.5 text-red-400 hover:text-red-600 rounded"><X size={14} /></button>
                             </>
                          )}
                        </div>
                      </div>
                    )
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <div className="space-y-2">
             {appointments.map(a => (
               <div key={a.id} className="flex items-center justify-between p-4 border-b border-slate-50 last:border-0">
                 <div>
                    <p className="font-medium text-slate-900">{format(new Date(a.date), 'dd/MM/yyyy')} - {a.startTime}</p>
                    <p className="text-sm text-slate-500">{clients.find(c => c.id === a.clientId)?.name} - {services.find(s => s.id === a.serviceId)?.name}</p>
                    {a.notes && <p className="text-xs text-slate-400 mt-1">Obs: {a.notes}</p>}
                 </div>
                 <Badge color="gray">{a.status}</Badge>
               </div>
             ))}
          </div>
        </Card>
      )}

      {/* CREATE APPOINTMENT MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Agendamento">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          
          <Select 
            label="Cliente" 
            value={formData.clientId} 
            onChange={e => setFormData({...formData, clientId: e.target.value})}
          >
            <option value="">Selecione...</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>

          <Select 
            label="Serviço" 
            value={formData.serviceId} 
            onChange={e => setFormData({...formData, serviceId: e.target.value})}
          >
            <option value="">Selecione...</option>
            {services.map(s => <option key={s.id} value={s.id}>{s.name} - R${s.price}</option>)}
          </Select>

          <Select 
            label="Profissional" 
            value={formData.professionalId} 
            onChange={e => setFormData({...formData, professionalId: e.target.value})}
          >
            <option value="">Selecione...</option>
            {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>

          <Input 
            type="date" 
            label="Data" 
            value={formData.date} 
            onChange={e => setFormData({...formData, date: e.target.value})} 
          />

          {/* Smart Slot Picker */}
          {formData.professionalId && formData.date && (
            <div className="space-y-2">
               <label className="text-sm font-medium text-slate-700">Horários Disponíveis</label>
               {availableSlots.length > 0 ? (
                 <div className="grid grid-cols-4 gap-2">
                   {availableSlots.map(slot => (
                     <button
                       key={slot}
                       onClick={() => setSelectedSlot(slot)}
                       className={`text-xs py-2 px-1 rounded border transition-all ${
                         selectedSlot === slot 
                           ? 'bg-indigo-600 text-white border-indigo-600' 
                           : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-400'
                       }`}
                     >
                       {slot}
                     </button>
                   ))}
                 </div>
               ) : (
                 <p className="text-sm text-red-500">Sem horários para este dia/profissional.</p>
               )}
            </div>
          )}

          <div className="w-full">
            <label className="block text-sm font-medium text-slate-700 mb-1">Notas / Observações</label>
            <textarea 
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-slate-900 h-20 resize-none"
              value={formData.notes || ''}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              placeholder="Observações sobre o agendamento..."
            />
          </div>
          
          {renderCustomFields()}

          <Button onClick={handleCreate} className="w-full mt-4" disabled={!selectedSlot}>
             Confirmar Agendamento
          </Button>
        </div>
      </Modal>

      {/* PAYMENT MODAL */}
      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Checkout e Pagamento">
         <div className="space-y-4">
            <p className="text-slate-600">Confirme o recebimento para concluir o serviço.</p>
            <div className="bg-slate-50 p-4 rounded text-center">
               <span className="text-2xl font-bold text-slate-900">
                 R$ {services.find(s => s.id === paymentData.appt?.serviceId)?.price.toFixed(2)}
               </span>
            </div>
            
            <Select label="Forma de Pagamento" value={paymentData.method} onChange={e => setPaymentData({...paymentData, method: e.target.value})}>
               <option value="PIX">Pix</option>
               <option value="CREDIT_CARD">Cartão de Crédito</option>
               <option value="DEBIT_CARD">Cartão de Débito</option>
               <option value="CASH">Dinheiro</option>
               <option value="BOLETO">Boleto</option>
            </Select>

            <Button onClick={finalizePayment} className="w-full">Confirmar Pagamento</Button>
         </div>
      </Modal>
    </div>
  );
};