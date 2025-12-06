import { User, Client, Professional, Service, Appointment, Event, Transaction, Company, NotificationLog, Role } from '../types';

const DELAY_MS = 400;

const STORAGE_KEYS = {
  COMPANIES: 'cronos_companies',
  USERS: 'cronos_users',
  CLIENTS: 'cronos_clients',
  PROFESSIONALS: 'cronos_professionals',
  SERVICES: 'cronos_services',
  APPOINTMENTS: 'cronos_appointments',
  EVENTS: 'cronos_events',
  TRANSACTIONS: 'cronos_transactions',
  NOTIFICATIONS: 'cronos_notifications',
  CURRENT_USER: 'cronos_session',
};

// Seeder
const seedData = () => {
  if (localStorage.getItem(STORAGE_KEYS.USERS)) return;

  const defaultTemplates = {
    appointmentCreated: "Olá {client_name}, seu agendamento de {service_name} foi confirmado para {date} às {time} com {professional_name}.📍",
    appointmentReminder: "Lembrete: Você tem um horário de {service_name} hoje às {time}. Confirma?",
    appointmentCancelled: "Olá {client_name}, seu agendamento para {date} foi cancelado. Entre em contato para reagendar.",
    paymentLink: "Olá, segue o link de pagamento para seu serviço: {link}",
    eventInvite: "Você foi inscrito no evento {event_title} dia {date}. Link: {link}"
  };

  const companies: Company[] = [
    { 
      id: 'comp1', 
      name: 'Barbearia Vintage', 
      plan: 'PRO', 
      active: true, 
      createdAt: new Date().toISOString(),
      notificationSettings: {
        provider: 'MOCK',
        apiKey: 'sk_test_123',
        active: true,
        templates: defaultTemplates
      }
    },
    { 
      id: 'comp2', 
      name: 'Consultoria Tech', 
      plan: 'ENTERPRISE', 
      active: true, 
      createdAt: new Date().toISOString(),
      notificationSettings: {
        provider: 'WHATSAPP_CLOUD',
        apiKey: '',
        active: false,
        templates: defaultTemplates
      }
    }
  ];

  const users: User[] = [
    { id: '1', name: 'Master Admin', email: 'master@cronos.com', role: 'MASTER_ADMIN' },
    { id: '2', companyId: 'comp1', name: 'Admin Barbearia', email: 'admin@barbearia.com', role: 'EMPRESA_ADMIN' },
    { id: '3', companyId: 'comp2', name: 'Admin Consultoria', email: 'admin@consultoria.com', role: 'EMPRESA_ADMIN' },
    { id: '4', companyId: 'comp1', name: 'João Cliente', email: 'joao@cliente.com', role: 'CLIENTE' }
  ];

  localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(companies));
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.PROFESSIONALS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
};

seedData();

const delay = () => new Promise(resolve => setTimeout(resolve, DELAY_MS));

function getItem<T>(key: string): T[] {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function setItem<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Helper to filter data based on user context
const filterByContext = <T>(data: T[], user: User): T[] => {
  if (user.role === 'MASTER_ADMIN') return data;
  if (!user.companyId) return [];
  return data.filter(item => (item as any).companyId === user.companyId);
};

export const StorageService = {
  // Syncs Firebase user with Local Storage User
  // Accepts Name and Role to create the correct profile on first registration
  syncFirebaseUser: async (email: string | null, role?: Role, name?: string): Promise<User | null> => {
    if (!email) return null;
    await delay();
    let users = getItem<User>(STORAGE_KEYS.USERS);
    let user = users.find(u => u.email === email);

    if (!user) {
      console.log("Creating new local user profile for:", email);
      user = {
        id: Math.random().toString(36).substr(2, 9),
        name: name || email.split('@')[0],
        email: email,
        role: role || 'CLIENTE', 
        // Note: For a real SaaS, we would assign a new Company ID here if role is EMPRESA_ADMIN
      };
      
      if (user.role === 'EMPRESA_ADMIN') {
         // Auto-create a company for this new admin? 
         // For simplicity in this demo, let's leave companyId undefined or generate one if needed.
         // In a real flow, registration would ask for Company Name too.
         user.companyId = Math.random().toString(36).substr(2, 9);
         
         const newCompany: Company = {
            id: user.companyId,
            name: `Nova Empresa de ${user.name}`,
            plan: 'FREE',
            active: true,
            createdAt: new Date().toISOString()
         };
         const companies = getItem<Company>(STORAGE_KEYS.COMPANIES);
         companies.push(newCompany);
         setItem(STORAGE_KEYS.COMPANIES, companies);
      }

      users.push(user);
      setItem(STORAGE_KEYS.USERS, users);
    }
    
    // Set current session
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    return user;
  },

  logout: async () => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  getCurrentUser: (): User | null => {
    const u = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return u ? JSON.parse(u) : null;
  },

  getAll: async <T = any>(key: string): Promise<T[]> => {
    await delay();
    const allItems = getItem<T>(key);
    const currentUser = StorageService.getCurrentUser();
    if (!currentUser) return [];
    return filterByContext(allItems, currentUser);
  },

  getById: async <T = any>(key: string, id: string): Promise<T | undefined> => {
    await delay();
    const items = getItem<T & { id: string }>(key);
    return items.find(i => i.id === id);
  },

  create: async <T extends { id: string }>(key: string, item: T): Promise<T> => {
    await delay();
    const currentUser = StorageService.getCurrentUser();
    if (!currentUser) throw new Error("Unauthorized");

    if (currentUser.role !== 'MASTER_ADMIN' && currentUser.companyId) {
      (item as any).companyId = currentUser.companyId;
    }

    const items = getItem<T>(key);
    items.push(item);
    setItem(key, items);
    return item;
  },

  update: async <T extends { id: string }>(key: string, item: T): Promise<T> => {
    await delay();
    const items = getItem<T>(key);
    const index = items.findIndex(i => i.id === item.id);
    if (index !== -1) {
      items[index] = item;
      setItem(key, items);
    }
    return item;
  },

  delete: async <T extends { id: string }>(key: string, id: string): Promise<void> => {
    await delay();
    const items = getItem<T>(key);
    const filtered = items.filter(i => i.id !== id);
    setItem(key, filtered);
  },

  getAppointments: async (): Promise<Appointment[]> => {
    return StorageService.getAll<Appointment>(STORAGE_KEYS.APPOINTMENTS);
  },

  getCompanySettings: async (): Promise<Company | undefined> => {
    const user = StorageService.getCurrentUser();
    if (!user || !user.companyId) return undefined;
    const companies = getItem<Company>(STORAGE_KEYS.COMPANIES);
    return companies.find(c => c.id === user.companyId);
  },
  
  KEYS: STORAGE_KEYS
};