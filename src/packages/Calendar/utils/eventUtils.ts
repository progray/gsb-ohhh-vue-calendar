import type { CalendarEvent, EventConflict } from '../types';

export function generateEventId(): string {
  return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function normalizeEvent(event: Partial<CalendarEvent>): CalendarEvent {
  const now = new Date();
  return {
    id: event.id || generateEventId(),
    title: event.title || '',
    startDate: event.startDate ? new Date(event.startDate) : now,
    endDate: event.endDate ? new Date(event.endDate) : now,
    color: event.color,
    description: event.description || '',
    allDay: event.allDay || false
  };
}

export function getEventsForDate(events: CalendarEvent[], date: Date): CalendarEvent[] {
  return events.filter(event => {
    const eventStart = new Date(event.startDate);
    const eventEnd = new Date(event.endDate);
    const targetDate = new Date(date);
    
    eventStart.setHours(0, 0, 0, 0);
    eventEnd.setHours(23, 59, 59, 999);
    targetDate.setHours(0, 0, 0, 0);
    
    return targetDate >= eventStart && targetDate <= eventEnd;
  });
}

export function isDateInRange(date: Date, start: Date, end: Date): boolean {
  const d = new Date(date).setHours(0, 0, 0, 0);
  const s = new Date(start).setHours(0, 0, 0, 0);
  const e = new Date(end).setHours(23, 59, 59, 999);
  return d >= s && d <= e;
}

export function checkEventConflicts(events: CalendarEvent[], newEvent: CalendarEvent): EventConflict | null {
  const conflicts: CalendarEvent[] = [];
  const newStart = new Date(newEvent.startDate).getTime();
  const newEnd = new Date(newEvent.endDate).getTime();

  events.forEach(event => {
    if (event.id === newEvent.id) return;
    
    const eventStart = new Date(event.startDate).getTime();
    const eventEnd = new Date(event.endDate).getTime();

    if (
      (newStart >= eventStart && newStart < eventEnd) ||
      (newEnd > eventStart && newEnd <= eventEnd) ||
      (newStart <= eventStart && newEnd >= eventEnd)
    ) {
      conflicts.push(event);
    }
  });

  return conflicts.length > 0 ? { event: newEvent, conflicts } : null;
}

export function getAllConflicts(events: CalendarEvent[]): EventConflict[] {
  const result: EventConflict[] = [];
  events.forEach((event, index) => {
    const conflicts = events.slice(index + 1).filter(e => {
      const eStart = new Date(e.startDate).getTime();
      const eEnd = new Date(e.endDate).getTime();
      const evStart = new Date(event.startDate).getTime();
      const evEnd = new Date(event.endDate).getTime();
      
      return (
        (evStart >= eStart && evStart < eEnd) ||
        (evEnd > eStart && evEnd <= eEnd) ||
        (evStart <= eStart && evEnd >= eEnd)
      );
    });
    
    if (conflicts.length > 0) {
      result.push({ event, conflicts });
    }
  });
  return result;
}

export function sortEvents(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) => {
    const aStart = new Date(a.startDate).getTime();
    const bStart = new Date(b.startDate).getTime();
    if (aStart !== bStart) {
      return aStart - bStart;
    }
    const aEnd = new Date(a.endDate).getTime();
    const bEnd = new Date(b.endDate).getTime();
    return bEnd - aEnd;
  });
}

export function updateEventDate(
  event: CalendarEvent,
  newStartDate: Date,
  keepDuration: boolean = true
): CalendarEvent {
  const oldStart = new Date(event.startDate);
  const oldEnd = new Date(event.endDate);
  const newStart = new Date(newStartDate);
  
  if (keepDuration) {
    const duration = oldEnd.getTime() - oldStart.getTime();
    const newEnd = new Date(newStart.getTime() + duration);
    return {
      ...event,
      startDate: newStart,
      endDate: newEnd
    };
  }
  
  return {
    ...event,
    startDate: newStart
  };
}

export function formatEventTime(date: Date): string {
  return new Date(date).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  });
}
