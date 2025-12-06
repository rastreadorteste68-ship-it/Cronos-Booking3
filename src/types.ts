export type Role = 'MASTER_ADMIN' | 'EMPRESA_ADMIN' | 'CLIENTE';

export interface NotificationSettings {
  provider: 'MOCK' | 'WHATSAPP_CLOUD' | 'Z_API' | 'ULTRAMSG';
  apiKey: string;
  instanceId?: string; // For Z-API/UltraMsg
  phoneFrom?: string; // For Cloud API
  templates: {
    appointmentCreated: string;
    appointmentReminder: string;
    appointmentCancelled: string;
    paymentLink: string;
    eventInvite: string;
  };
  active: boolean;
}

export interface NotificationLog {
  id: string;
  companyId: string;
  date: string;
  to: string;
  message: string;
  trigger: string;
  status: 'SENT' | 'FAILED';
}

export interface Company {
  id: string;
  name: string;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  active: boolean;
  createdAt: string;
  notificationSettings?: NotificationSettings;
}

export interface User {
  id: string;
  companyId?: string; // Optional for Master Admin
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

export interface Client {
  id: string;
  companyId: string;
  name: string;
  email: string;
  phone: string;
  notes?: string;
  createdAt: string;
}

export interface TimeInterval {
  start: string; // "08:00"
  end: string;   // "12:00"
}

export interface AvailabilityException {
  date: string; // YYYY-MM-DD
  active: boolean; // Is the professional working this day?
  intervals?: TimeInterval[]; // Overrides weekly intervals if active
  reason?: string;
}

export interface AvailabilityRule {
  dayOfWeek: number; // 0-6 (Sun-Sat)
  active: boolean;
  intervals: TimeInterval[]; // Support for multiple slots (Morning, Afternoon, Night)
}

export interface Professional {
  id: string;
  companyId: string;
  name: string;
  email: string;
  specialty: string;
  availability: AvailabilityRule[];
  exceptions?: AvailabilityException[];
  slotInterval?: number; // Minutes, e.g., 30, 45, 60
}

export interface CustomField {
  id: string;
  label: string;
  type: 'text' | 'longText' | 'number' | 'email' | 'phone' | 'select' | 'checkbox' | 'upload' | 'signature';
  options?: string[]; // For select
  required: boolean;
}

export interface Service {
  id: string;
  companyId: string;
  name: string;
  durationMinutes: number;
  price: number;
  customFields?: CustomField[];
}

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'EN_ROUTE' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface Appointment {
  id: string;
  companyId: string;
  clientId: string;
  professionalId: string;
  serviceId: string;
  date: string; // ISO Date YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: AppointmentStatus;
  customFieldValues?: Record<string, any>;
  notes?: string;
}

export interface Event {
  id: string;
  companyId: string;
  title: string;
  date: string;
  time: string;
  speaker: string;
  capacity: number;
  enrolledIds: string[]; // Client IDs
  meetingLink?: string;
  description?: string;
  durationMinutes?: number;
}

export interface Transaction {
  id: string;
  companyId: string;
  date: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  description: string;
  status: 'PENDING' | 'PAID';
  category: string;
  paymentMethod?: 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH' | 'BOLETO';
  providerId?: string; // MercadoPago ID, etc.
  referenceId?: string; // Appointment ID or Event ID
}