import { StorageService } from './storage';
import { Appointment, Client, Service, Professional, NotificationLog, Company } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const NotificationService = {
  
  // Replaces placeholders like {client_name} with actual data
  formatMessage: (template: string, data: Record<string, string>) => {
    let msg = template;
    for (const key in data) {
      msg = msg.replace(new RegExp(`{${key}}`, 'g'), data[key]);
    }
    return msg;
  },

  // Generic send function
  send: async (toPhone: string, message: string, trigger: string) => {
    const user = StorageService.getCurrentUser();
    if (!user || !user.companyId) return;

    const company = await StorageService.getCompanySettings();
    
    // Check if notification is active
    if (!company?.notificationSettings?.active) {
      console.log('Notifications inactive for company:', company?.name);
      return;
    }

    // SIMULATION: In a real app, this would be an axios.post to WhatsApp API
    console.log(`%c[WHATSAPP API] To: ${toPhone} | Msg: ${message}`, 'color: #25D366; font-weight: bold;');
    
    // Store in Log
    const log: NotificationLog = {
      id: Math.random().toString(36).substr(2, 9),
      companyId: user.companyId,
      date: new Date().toISOString(),
      to: toPhone,
      message,
      trigger,
      status: 'SENT' // Assume success for simulation
    };

    await StorageService.create(StorageService.KEYS.NOTIFICATIONS, log);

    // Optional: Visual Feedback for Demo
    // alert(`[SIMULAÇÃO WHATSAPP] Enviado para ${toPhone}:\n${message}`);
  },

  // Triggers
  notifyAppointmentCreated: async (appt: Appointment) => {
    const [client, service, professional, company] = await Promise.all([
      StorageService.getById<Client>(StorageService.KEYS.CLIENTS, appt.clientId),
      StorageService.getById<Service>(StorageService.KEYS.SERVICES, appt.serviceId),
      StorageService.getById<Professional>(StorageService.KEYS.PROFESSIONALS, appt.professionalId),
      StorageService.getCompanySettings()
    ]);

    if (!client || !service || !professional || !company?.notificationSettings) return;

    const msg = NotificationService.formatMessage(company.notificationSettings.templates.appointmentCreated, {
      client_name: client.name,
      service_name: service.name,
      professional_name: professional.name,
      date: format(new Date(appt.date), 'dd/MM/yyyy', { locale: ptBR }),
      time: appt.startTime
    });

    await NotificationService.send(client.phone, msg, 'APPOINTMENT_CREATED');
  },

  notifyAppointmentCancelled: async (appt: Appointment) => {
    const [client, company] = await Promise.all([
      StorageService.getById<Client>(StorageService.KEYS.CLIENTS, appt.clientId),
      StorageService.getCompanySettings()
    ]);

    if (!client || !company?.notificationSettings) return;

    const msg = NotificationService.formatMessage(company.notificationSettings.templates.appointmentCancelled, {
      client_name: client.name,
      date: format(new Date(appt.date), 'dd/MM/yyyy'),
    });

    await NotificationService.send(client.phone, msg, 'APPOINTMENT_CANCELLED');
  },

  sendPaymentLink: async (client: Client, link: string) => {
     const company = await StorageService.getCompanySettings();
     if (!company?.notificationSettings) return;

     const msg = NotificationService.formatMessage(company.notificationSettings.templates.paymentLink, {
       client_name: client.name,
       link: link
     });

     await NotificationService.send(client.phone, msg, 'PAYMENT_LINK');
  }
};