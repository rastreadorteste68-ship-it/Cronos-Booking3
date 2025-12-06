import React, { useEffect, useState } from 'react';
import { StorageService } from '../services/storage';
import { useAuth } from '../services/authContext';
import { Professional, TimeInterval, Company } from '../types';
import { Button, Card, Badge, Modal, Input, Select } from '../components/UI';
import { Edit2, Plus, Trash2, Clock, Calendar as CalendarIcon, X, User, Mail, Briefcase, Building2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const ProfessionalsPage: React.FC = () => {
  const { user } = useAuth();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [editingProf, setEditingProf] = useState<Professional | null>(null);
  const [activeTab, setActiveTab] = useState<'weekly' | 'exceptions'>('weekly');
  
  // Exception Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setProfessionals(await StorageService.getAll(StorageService.KEYS.PROFESSIONALS));
    if (user?.role === 'MASTER_ADMIN') {
       setCompanies(await StorageService.getAll(StorageService.KEYS.COMPANIES));
    }
  };

  const handleAddNew = () => {
    setEditingProf({
      id: '', // Empty ID marks it as new
      companyId: user?.companyId || '', // Default to current user's company, or empty if Master
      name: '',
      email: '',
      specialty: '',
      slotInterval: 60,
      availability: Array.from({ length: 7 }, (_, i) => ({ 
        dayOfWeek: i, 
        active: i >= 1 && i <= 5, // Default Mon-Fri
        intervals: (i >= 1 && i <= 5) ? [{ start: '09:00', end: '18:00' }] : []
      })),
      exceptions: []
    });
    setActiveTab('weekly');
  };

  const handleSave = async () => {
    if (editingProf) {
      if (!editingProf.name) {
        alert('O nome é obrigatório.');
        return;
      }
      
      // Validation for Master Admin
      if (user?.role === 'MASTER_ADMIN' && !editingProf.companyId) {
        alert('Selecione uma empresa para vincular o profissional.');
        return;
      }

      if (editingProf.id) {
        // Update existing
        await StorageService.update(StorageService.KEYS.PROFESSIONALS, editingProf);
      } else {
        // Create new
        const newProf = { 
          ...editingProf, 
          // If user is not Master, companyId is already set in handleAddNew or forced by backend
          companyId: user?.role === 'MASTER_ADMIN' ? editingProf.companyId : (user?.companyId || ''),
          id: Math.random().toString(36).substr(2, 9) 
        };
        await StorageService.create(StorageService.KEYS.PROFESSIONALS, newProf);
      }
      
      setEditingProf(null);
      load();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este profissional?')) {
      await StorageService.delete(StorageService.KEYS.PROFESSIONALS, id);
      load();
    }
  };

  // --- WEEKLY LOGIC ---
  const toggleDay = (dayIndex: number) => {
    if (!editingProf) return;
    const newAvailability = [...editingProf.availability];
    const ruleIndex = newAvailability.findIndex(r => r.dayOfWeek === dayIndex);
    if (ruleIndex >= 0) {
      // Toggle active
      newAvailability[ruleIndex] = { 
        ...newAvailability[ruleIndex], 
        active: !newAvailability[ruleIndex].active 
      };
      // If activating and no intervals, add default business hours
      if (newAvailability[ruleIndex].active && newAvailability[ruleIndex].intervals.length === 0) {
          newAvailability[ruleIndex].intervals = [{ start: '09:00', end: '18:00' }];
      }
      setEditingProf({ ...editingProf, availability: newAvailability });
    }
  };

  const addInterval = (dayIndex: number) => {
     if (!editingProf) return;
     const newAvailability = editingProf.availability.map(r => {
        if (r.dayOfWeek === dayIndex) {
            return {
                ...r,
                intervals: [...r.intervals, { start: '12:00', end: '13:00' }]
            };
        }
        return r;
     });
     setEditingProf({ ...editingProf, availability: newAvailability });
  };

  const removeInterval = (dayIndex: number, intervalIndex: number) => {
     if (!editingProf) return;
     const newAvailability = editingProf.availability.map(r => {
        if (r.dayOfWeek === dayIndex) {
            const newIntervals = [...r.intervals];
            newIntervals.splice(intervalIndex, 1);
            return { ...r, intervals: newIntervals };
        }
        return r;
     });
     setEditingProf({ ...editingProf, availability: newAvailability });
  };

  const updateInterval = (dayIndex: number, intervalIndex: number, field: keyof TimeInterval, value: string) => {
     if (!editingProf) return;
     const newAvailability = editingProf.availability.map(r => {
        if (r.dayOfWeek === dayIndex) {
            const newIntervals = r.intervals.map((int, idx) => {
                if (idx === intervalIndex) return { ...int, [field]: value };
                return int;
            });
            return { ...r, intervals: newIntervals };
        }
        return r;
     });
     setEditingProf({ ...editingProf, availability: newAvailability });
  };

  // --- EXCEPTION LOGIC ---
  const toggleExceptionDate = (date: Date) => {
    if (!editingProf) return;
    const dateStr = format(date, 'yyyy-MM-dd');
    const existingIndex = editingProf.exceptions?.findIndex(e => e.date === dateStr);
    
    let newExceptions = editingProf.exceptions ? [...editingProf.exceptions] : [];

    if (existingIndex !== undefined && existingIndex >= 0) {
       // Remove exception
       newExceptions.splice(existingIndex, 1);
    } else {
       // Add exception (Day Off by default)
       newExceptions.push({ date: dateStr, active: false, reason: 'Folga', intervals: [] });
    }
    setEditingProf({ ...editingProf, exceptions: newExceptions });
  };

  const updateException = (dateStr: string, updates: Partial<any>) => {
    if (!editingProf || !editingProf.exceptions) return;
    const newExceptions = editingProf.exceptions.map(e => {
        if (e.date === dateStr) {
            // If turning active to true, ensure it has intervals
            if (updates.active === true && (!e.intervals || e.intervals.length === 0)) {
                return { ...e, ...updates, intervals: [{ start: '09:00', end: '18:00' }] };
            }
            return { ...e, ...updates };
        }
        return e;
    });
    setEditingProf({ ...editingProf, exceptions: newExceptions });
  };

  const addExceptionInterval = (dateStr: string) => {
    if (!editingProf || !editingProf.exceptions) return;
    const newExceptions = editingProf.exceptions.map(e => {
        if (e.date === dateStr) {
            return { ...e, intervals: [...(e.intervals || []), { start: '12:00', end: '13:00' }] };
        }
        return e;
    });
    setEditingProf({ ...editingProf, exceptions: newExceptions });
  };

  const removeExceptionInterval = (dateStr: string, idx: number) => {
    if (!editingProf || !editingProf.exceptions) return;
    const newExceptions = editingProf.exceptions.map(e => {
        if (e.date === dateStr && e.intervals) {
            const newInts = [...e.intervals];
            newInts.splice(idx, 1);
            return { ...e, intervals: newInts };
        }
        return e;
    });
    setEditingProf({ ...editingProf, exceptions: newExceptions });
  };

  const updateExceptionIntervalValue = (dateStr: string, idx: number, field: keyof TimeInterval, value: string) => {
    if (!editingProf || !editingProf.exceptions) return;
    const newExceptions = editingProf.exceptions.map(e => {
        if (e.date === dateStr && e.intervals) {
            const newInts = e.intervals.map((int, i) => i === idx ? { ...int, [field]: value } : int);
            return { ...e, intervals: newInts };
        }
        return e;
    });
    setEditingProf({ ...editingProf, exceptions: newExceptions });
  };

  const renderCalendar = () => {
    if (!editingProf) return null;
    const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
    
    return (
      <div className="bg-white rounded border border-slate-200 select-none">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
          {['D','S','T','Q','Q','S','S'].map(d => <div key={d} className="p-2 text-center text-xs font-bold text-slate-500">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const exception = editingProf.exceptions?.find(e => e.date === dateStr);
            const isException = !!exception;
            
            const dayOfWeek = getDay(day);
            const weeklyRule = editingProf.availability.find(r => r.dayOfWeek === dayOfWeek);
            const isWorkDay = isException ? exception.active : (weeklyRule?.active);

            let bgClass = "bg-white";
            if (isException) {
              bgClass = exception.active ? "bg-indigo-100 ring-1 ring-inset ring-indigo-300" : "bg-orange-100 ring-1 ring-inset ring-orange-300";
            } else if (!isWorkDay) {
               bgClass = "bg-slate-50 text-slate-400";
            }

            return (
              <div 
                key={dateStr} 
                onClick={() => toggleExceptionDate(day)}
                className={`aspect-square border-r border-b border-slate-100 p-1 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors ${bgClass}`}
              >
                <span className="text-sm font-medium">{format(day, 'd')}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Gerenciar Profissionais</h1>
        <Button onClick={handleAddNew}>
          <Plus size={18} /> Novo Profissional
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {professionals.map(p => (
          <Card 
            key={p.id} 
            className="relative group cursor-pointer border border-slate-200 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1"
          >
             <button 
               onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }} 
               className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all z-10"
             >
               <Trash2 size={16} />
             </button>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl border-2 border-white shadow-sm">
                  {p.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">{p.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge color="indigo">{p.specialty}</Badge>
                    <span className="text-xs text-slate-400 flex items-center gap-1"><Clock size={10} /> {p.slotInterval || 60}min</span>
                  </div>
                  {user?.role === 'MASTER_ADMIN' && (
                     <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Building2 size={10} /> Emp: {p.companyId}</p>
                  )}
                </div>
              </div>
              <Button variant="secondary" onClick={() => setEditingProf(p)} className="gap-2 mr-6">
                <Edit2 size={16} /> Editar
              </Button>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-100">
               <div className="flex justify-between items-center text-sm">
                 <span className="text-slate-500">Disponibilidade</span>
                 <span className="font-medium text-slate-700">{p.availability.filter(a => a.active).length} dias / semana</span>
               </div>
            </div>
          </Card>
        ))}
        {professionals.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
            Nenhum profissional cadastrado. Clique em "Novo Profissional".
          </div>
        )}
      </div>

      {/* EDIT MODAL */}
      <Modal 
        isOpen={!!editingProf} 
        onClose={() => setEditingProf(null)} 
        title={editingProf?.id ? `Editar: ${editingProf.name}` : 'Novo Profissional'}
      >
        <div className="space-y-6">
          
          {/* Basic Info Inputs */}
          {editingProf && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
               {user?.role === 'MASTER_ADMIN' && (
                 <div className="md:col-span-2">
                   <Select 
                     label="Empresa Vinculada"
                     value={editingProf.companyId}
                     onChange={e => setEditingProf({...editingProf, companyId: e.target.value})}
                   >
                     <option value="">Selecione a empresa...</option>
                     {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </Select>
                 </div>
               )}

               <div className="md:col-span-2">
                 <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 mb-1"><User size={12}/> Nome Completo</label>
                 <Input 
                   value={editingProf.name} 
                   onChange={e => setEditingProf({...editingProf, name: e.target.value})} 
                   placeholder="Ex: Carlos Silva"
                 />
               </div>
               <div>
                 <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 mb-1"><Mail size={12}/> Email</label>
                 <Input 
                   type="email"
                   value={editingProf.email} 
                   onChange={e => setEditingProf({...editingProf, email: e.target.value})} 
                   placeholder="carlos@email.com"
                 />
               </div>
               <div>
                 <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 mb-1"><Briefcase size={12}/> Especialidade</label>
                 <Input 
                   value={editingProf.specialty} 
                   onChange={e => setEditingProf({...editingProf, specialty: e.target.value})} 
                   placeholder="Ex: Barbeiro"
                 />
               </div>
            </div>
          )}

          <div className="flex gap-2 border-b border-slate-200">
            <button 
              onClick={() => setActiveTab('weekly')} 
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'weekly' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Agenda Semanal
            </button>
            <button 
              onClick={() => setActiveTab('exceptions')} 
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'exceptions' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Exceções e Feriados
            </button>
          </div>

          {activeTab === 'weekly' && editingProf && (
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
              <div className="bg-blue-50 p-4 rounded-lg flex items-center gap-4 border border-blue-100">
                 <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Clock size={20} /></div>
                 <div className="flex-1">
                    <label className="text-sm font-semibold text-blue-900 block mb-1">Duração do Atendimento (Minutos)</label>
                    <Input 
                      type="number" 
                      className="max-w-[120px] bg-white"
                      value={editingProf.slotInterval || 60} 
                      onChange={e => setEditingProf({...editingProf, slotInterval: Number(e.target.value)})}
                    />
                 </div>
              </div>

              <div className="space-y-3">
                {editingProf.availability.map((rule, dayIndex) => (
                  <div key={rule.dayOfWeek} className={`p-4 rounded-xl border transition-all ${rule.active ? 'bg-white border-slate-300 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-75'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={rule.active} onChange={() => toggleDay(dayIndex)} />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                        <span className={`font-semibold ${rule.active ? 'text-slate-900' : 'text-slate-500'}`}>
                          {['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'][rule.dayOfWeek]}
                        </span>
                      </div>
                      {rule.active && (
                         <Button variant="ghost" className="text-xs h-8" onClick={() => addInterval(dayIndex)}><Plus size={14} /> Adicionar Turno</Button>
                      )}
                    </div>
                    
                    {rule.active && (
                      <div className="space-y-2 pl-2 border-l-2 border-indigo-100 ml-5">
                         {rule.intervals.map((interval, intervalIndex) => (
                           <div key={intervalIndex} className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
                              <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                                <input 
                                  type="time" 
                                  className="text-sm bg-transparent border-0 focus:ring-0 p-0 w-20 text-slate-700 font-medium" 
                                  value={interval.start} 
                                  onChange={e => updateInterval(dayIndex, intervalIndex, 'start', e.target.value)} 
                                />
                                <span className="text-slate-400">-</span>
                                <input 
                                  type="time" 
                                  className="text-sm bg-transparent border-0 focus:ring-0 p-0 w-20 text-slate-700 font-medium" 
                                  value={interval.end} 
                                  onChange={e => updateInterval(dayIndex, intervalIndex, 'end', e.target.value)} 
                                />
                              </div>
                              <button onClick={() => removeInterval(dayIndex, intervalIndex)} className="text-slate-400 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 transition-colors">
                                <Trash2 size={16} />
                              </button>
                           </div>
                         ))}
                         {rule.intervals.length === 0 && <p className="text-xs text-red-500">Adicione um horário para este dia.</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'exceptions' && editingProf && (
            <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2">
               <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                 <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                   <CalendarIcon size={18} className="text-indigo-600"/> 
                   {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                 </h4>
               </div>
               
               {renderCalendar()}
               
               <div className="flex gap-4 text-xs text-slate-500 px-2">
                  <div className="flex items-center gap-1"><div className="w-3 h-3 bg-white border border-slate-300 rounded-sm"></div> Padrão</div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 bg-orange-100 border border-orange-300 rounded-sm"></div> Folga</div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 bg-indigo-100 border border-indigo-300 rounded-sm"></div> Extra/Específico</div>
               </div>

               {/* LIST OF EXCEPTIONS */}
               {editingProf.exceptions && editingProf.exceptions.length > 0 && (
                 <div className="space-y-3 pt-4 border-t border-slate-100">
                    <h5 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Exceções Configuradas</h5>
                    {editingProf.exceptions
                      .sort((a,b) => a.date.localeCompare(b.date))
                      .map((ex, exIndex) => (
                      <div key={ex.date} className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
                         <div className="flex items-center justify-between mb-3">
                            <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
                              {format(parseISO(ex.date), "dd 'de' MMMM", { locale: ptBR })}
                              <Badge color={ex.active ? 'indigo' : 'orange'}>{ex.active ? 'Trabalho' : 'Folga'}</Badge>
                            </span>
                            <button onClick={() => toggleExceptionDate(parseISO(ex.date))} className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                         </div>
                         
                         <div className="flex items-center gap-4 mb-2">
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                              <input 
                                type="radio" 
                                name={`type-${ex.date}`} 
                                checked={!ex.active} 
                                onChange={() => updateException(ex.date, { active: false })}
                                className="text-orange-500 focus:ring-orange-500"
                              />
                              <span className="text-slate-600">Folga</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                              <input 
                                type="radio" 
                                name={`type-${ex.date}`} 
                                checked={ex.active} 
                                onChange={() => updateException(ex.date, { active: true })}
                                className="text-indigo-600 focus:ring-indigo-600"
                              />
                              <span className="text-slate-600">Trabalho</span>
                            </label>
                         </div>

                         {ex.active && (
                           <div className="bg-slate-50 p-2 rounded mt-2 border border-slate-100">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-semibold text-slate-500">Horários Específicos</span>
                                <button onClick={() => addExceptionInterval(ex.date)} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">+ Adicionar</button>
                              </div>
                              {ex.intervals?.map((int, i) => (
                                <div key={i} className="flex items-center gap-2 mb-1">
                                  <input type="time" className="text-xs border rounded px-1 py-0.5" value={int.start} onChange={e => updateExceptionIntervalValue(ex.date, i, 'start', e.target.value)} />
                                  <span className="text-xs text-slate-400">até</span>
                                  <input type="time" className="text-xs border rounded px-1 py-0.5" value={int.end} onChange={e => updateExceptionIntervalValue(ex.date, i, 'end', e.target.value)} />
                                  <button onClick={() => removeExceptionInterval(ex.date, i)} className="text-slate-400 hover:text-red-500"><X size={14}/></button>
                                </div>
                              ))}
                           </div>
                         )}
                      </div>
                    ))}
                 </div>
               )}
            </div>
          )}

          <Button onClick={handleSave} className="w-full">
            {editingProf?.id ? 'Salvar Alterações' : 'Criar Profissional'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};