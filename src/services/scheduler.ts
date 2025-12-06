import { Professional, Appointment, TimeInterval } from '../types';
import { parse, format, addMinutes, isBefore, getDay } from 'date-fns';

export const SchedulerService = {
  
  isWorkDay: (date: Date, professional: Professional): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // 1. Check Exceptions first
    const exception = professional.exceptions?.find(e => e.date === dateStr);
    if (exception) {
      return exception.active;
    }

    // 2. Check Weekly Availability
    const dayOfWeek = getDay(date); // 0 = Sunday
    const rule = professional.availability.find(r => r.dayOfWeek === dayOfWeek);
    return rule ? rule.active : false;
  },

  getWorkingIntervals: (date: Date, professional: Professional): TimeInterval[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const exception = professional.exceptions?.find(e => e.date === dateStr);
    
    if (exception) {
      return exception.active ? (exception.intervals || []) : [];
    }

    const dayOfWeek = getDay(date);
    const rule = professional.availability.find(r => r.dayOfWeek === dayOfWeek);
    
    if (rule && rule.active) {
      return rule.intervals;
    }
    
    return [];
  },

  generateSlots: (dateStr: string, professional: Professional, dayAppointments: Appointment[]): string[] => {
    const date = parse(dateStr, 'yyyy-MM-dd', new Date());
    const intervals = SchedulerService.getWorkingIntervals(date, professional);
    
    if (intervals.length === 0) return [];

    const slots: string[] = [];
    const intervalMinutes = professional.slotInterval || 60;

    // Iterate over each working interval (e.g., Morning 09-12, Afternoon 13-18)
    intervals.forEach(interval => {
      let current = parse(interval.start, 'HH:mm', date);
      const end = parse(interval.end, 'HH:mm', date);

      while (isBefore(current, end)) {
        const slotEnd = addMinutes(current, intervalMinutes);
        
        // Ensure slot finishes before the interval ends
        // (Using simple comparison to allow tight fit)
        if (slotEnd > end) break;

        const slotStartStr = format(current, 'HH:mm');
        const slotEndStr = format(slotEnd, 'HH:mm');

        // Check Overlaps with existing appointments
        const isTaken = dayAppointments.some(appt => {
           if (appt.status === 'CANCELLED') return false;
           // Check intersection: Appt.Start < Slot.End AND Appt.End > Slot.Start
           return (appt.startTime < slotEndStr && appt.endTime > slotStartStr);
        });

        if (!isTaken) {
          slots.push(slotStartStr);
        }

        current = addMinutes(current, intervalMinutes);
      }
    });

    return slots.sort();
  }
};