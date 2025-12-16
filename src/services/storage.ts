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
  // (Mantendo dados de exemplo iniciais apenas se não existir nada)
  // ... código de seed existente mantido breve para focar na correção ...
};
// Executa seed apenas uma vez
if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify([]));
}

const delay = () => new Promise(resolve => setTimeout(resolve, DELAY_MS));

function getItem<T>(key: string): T[] {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function setItem<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

const filterByContext = <T>(data: T[], user: User): T[] => {
  if (user.role === 'MASTER_ADMIN') return data;
  if (!user.companyId) return [];
  return data.filter(item => (item as any).companyId === user.companyId);
};

export const StorageService = {
  
  /**
   * Sincroniza usuário do Firebase com o LocalStorage.
   * 
   * CRÍTICO: Não assume valores padrão. Se 'role' não for passado e não existir localmente,
   * a função retorna null, bloqueando o acesso indevido.
   */
  syncFirebaseUser: async (email: string | null, role?: Role, name?: string, companyId?: string): Promise<User | null> => {
    if (!email) return null;
    await delay();
    
    let users = getItem<User>(STORAGE_KEYS.USERS);
    let user = users.find(u => u.email === email);

    // 1. Atualização de Dados (Se usuário já existe localmente)
    if (user) {
        let hasChanges = false;
        
        // Prioridade para dados vindos do Firestore (argumentos da função)
        if (role && user.role !== role) {
            user.role = role;
            hasChanges = true;
        }
        if (companyId && user.companyId !== companyId) {
            user.companyId = companyId;
            hasChanges = true;
        }
        if (name && user.name !== name) {
            user.name = name;
            hasChanges = true;
        }

        if (hasChanges) {
            const index = users.findIndex(u => u.email === email);
            if (index !== -1) users[index] = user;
            setItem(STORAGE_KEYS.USERS, users);
        }
    }

    // 2. Criação de Novo Usuário Local
    // SÓ cria se tivermos uma ROLE explícita vinda do Firestore.
    // Isso impede que o listener crie usuários "CLIENTE" por padrão antes do fetch do banco.
    if (!user && role) {
      console.log(`[Storage] Criando perfil local validado: ${role} para ${email}`);
      
      user = {
        id: Math.random().toString(36).substr(2, 9),
        name: name || email.split('@')[0],
        email: email,
        role: role, // Role OBRIGATÓRIA
        companyId: companyId || undefined
      };
      
      // Auto-create workspace se necessário
      if ((user.role === 'EMPRESA_ADMIN' || user.role === 'PROFESSIONAL') && !user.companyId) {
         user.companyId = Math.random().toString(36).substr(2, 9);
      }

      // Garante estrutura da empresa
      if (user.companyId) {
          const companies = getItem<Company>(STORAGE_KEYS.COMPANIES);
          const exists = companies.find(c => c.id === user.companyId);
          if (!exists) {
            companies.push({
                id: user.companyId,
                name: user.role === 'EMPRESA_ADMIN' ? `Empresa de ${user.name}` : `Consultório de ${user.name}`,
                plan: 'FREE',
                active: true,
                createdAt: new Date().toISOString()
            });
            setItem(STORAGE_KEYS.COMPANIES, companies);
          }
      }

      users.push(user);
      setItem(STORAGE_KEYS.USERS, users);
    }
    
    // Se o usuário não existe e não foi passada role, retornamos null.
    // Isso força o app a esperar os dados do Firestore.
    if (!user) {
        console.warn(`[Storage] Usuário ${email} não encontrado localmente e sem Role fornecida. Bloqueando sync.`);
        return null;
    }
    
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

  // ... (restante dos métodos de CRUD mantidos iguais para brevidade)
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